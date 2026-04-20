import { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Device } from "mediasoup-client";
import { RemoteMedia } from "../components/RemoteMedia";
import { useWhisperWorker } from '../hooks/useWhisperWorker';
import { useVAD } from '../hooks/useVAD';

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const { roomId } = useParams();
  const location = useLocation();
  const email = location.state?.email;

  const [summaries, setSummaries] = useState([]);

  const handleNewTranscript = useCallback((text) => {
    socket.emit('send-transcript', {
      roomId: roomId,
      text: text
    });
  }, [roomId, socket]);

  const { isWorkerReady, transcripts, sendAudioToWhisper } = useWhisperWorker(handleNewTranscript);

  const { startListening, stopListening } = useVAD(sendAudioToWhisper);

  /*
  TODO: later switch this with session to keep email cuz on refresh its gonna vanish 
  The issue is getting email from lobby page to this roompage
  */
  const [producerTransport, setProducerTransport] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState(null);

  const [videoProducer, setVideoProducer] = useState(null);
  const [audioProducer, setAudioProducer] = useState(null);
  const localVideoRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);


  const [participants, setParticipants] = useState([]);

  const initiateSendTransport = useCallback(
    (loadedDevice) => {
      socket.emit(
        "createWebRtcTransport",
        { roomId },
        async ({ params, error }) => {
          if (error) {
            console.error(error);
            return;
          }

          console.log("Received params from server:", params);
          const transport = loadedDevice.createSendTransport(params);

          transport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                socket.emit(
                  "transport:connect",
                  {
                    roomId: roomId,
                    transportId: transport.id,
                    dtlsParameters,
                  },
                  () => {
                    callback();
                  },
                );
              } catch (error) {
                errback(error);
              }
            },
          );

          transport.on("produce", async (parameters, callback, errback) => {
            try {
              socket.emit(
                "transport:produce",
                {
                  roomId: roomId,
                  transportId: transport.id,
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                },
                ({ id, error }) => {
                  if (error) {
                    errback(error);
                    return;
                  }
                  callback({ id });
                },
              );
            } catch (error) {
              errback(error);
            }
          });

          setProducerTransport(transport);
          console.log("Send transport created on client!");
        },
      );
    },
    [socket, roomId],
  );

  const consumeRemoteStream = useCallback(
    (producerId, email, recvTransport, loadedDevice) => {
      socket.emit(
        "consume",
        {
          roomId: roomId,
          transportId: recvTransport.id,
          producerId: producerId,
          rtpCapabilities: loadedDevice.rtpCapabilities,
        },
        async ({ params, error }) => {
          if (error) {
            console.error("Server failed to consume:", error);
            return;
          }

          const consumer = await recvTransport.consume({
            id: params.id,
            producerId: params.producerId,
            kind: params.kind,
            rtpParameters: params.rtpParameters,
          });

          setParticipants((prev) =>
            prev.map((p) => {
              if (p.email === email) {
                if (consumer.kind === "video") return { ...p, videoConsumer: consumer };
                if (consumer.kind === "audio") return { ...p, audioConsumer: consumer };
              }
              return p;
            })
          );
          console.log(`Successfully consuming ${params.kind} stream!`);

          socket.emit("consumer-resume", {
            roomId: roomId,
            consumerId: consumer.id,
          });
        },
      );
    },
    [roomId, socket],
  );

  const initiateRecvTransport = useCallback(
    (loadedDevice) => {
      socket.emit(
        "createWebRtcTransport",
        { roomId },
        async ({ params, error }) => {
          if (error) {
            console.error(error);
            return;
          }

          console.log("Received params from server:", params);
          const recvTransport = loadedDevice.createRecvTransport(params);

          recvTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                socket.emit(
                  "transport:connect",
                  {
                    roomId: roomId,
                    transportId: recvTransport.id,
                    dtlsParameters,
                  },
                  () => {
                    callback();
                  },
                );
              } catch (error) {
                errback(error);
              }
            },
          );

          setConsumerTransport(recvTransport);
          console.log("Receive transport created on client!");

          socket.emit("get-producers", { roomId: roomId }, (producerList) => {
            console.log("Active producers in room:", producerList);

            producerList.forEach(({ producerId, email }) => {
              consumeRemoteStream(producerId, email, recvTransport, loadedDevice);
            });
          });

          socket.off("new-producer");

          socket.on("new-producer", ({ producerId, email }) => {
            console.log("Someone new turned on their camera : ", producerId);
            consumeRemoteStream(producerId, email, recvTransport, loadedDevice);
          });

          socket.off("consumer-closed");
          socket.on("consumer-closed", ({ consumerId }) => {
            console.log("A remote consumer closed:", consumerId);

            setParticipants((prev) =>
              prev.map((p) => {
                if (p.videoConsumer?.id === consumerId) return { ...p, videoConsumer: null };
                if (p.audioConsumer?.id === consumerId) return { ...p, audioConsumer: null };
                return p;
              })
            );
          });

          socket.off("peer-joined");
          socket.on("peer-joined", ({ email: joinedEmail }) => {
            setParticipants((prev) => {
              const alreadyExists = prev.some((p) => p.email === joinedEmail);
              if (alreadyExists) return prev;

              return [
                ...prev,
                { email: joinedEmail, videoConsumer: null, audioConsumer: null },
              ];
            });
          });

          socket.off("peer-left");
          socket.on("peer-left", ({ email }) => {
            setParticipants((prev) => prev.filter((p) => p.email !== email));
          });
        },
      );
    },
    [roomId, socket, consumeRemoteStream],
  );

  useEffect(() => {
    socket.on('new-summary', (data) => {
      console.log('Received new AI summary:', data);
      setSummaries((prev) => [...prev, data]);
    });

    return () => {
      socket.off('new-summary');
    };
  }, [socket]);

  useEffect(() => {
    if (!email) {
      console.log("No email found, redirecting to lobby...");
      navigate("/");
      return;
    }
    console.log("email is :-> ", email);
    console.log("emitting room join");

    socket.emit("room:join", { email, roomId }, async (response) => {
      if (response.error) {
        console.error(response.error);
        return;
      }

      if (response.peers) {
        setParticipants(
          response.peers
            .filter((peer) => peer.email !== email)
            .map((peer) => ({
              email: peer.email,
              videoConsumer: null,
              audioConsumer: null,
            }))
        );
      }

      console.log("F: participants list : ", participants);

      try {
        const newDevice = new Device();

        await newDevice.load({
          routerRtpCapabilities: response.rtpCapabilities,
        });

        console.log("Mediasoup device loaded successfully!");

        if (!newDevice.canProduce("video")) {
          console.log("This browser cannot produce video");
        }

        setDevice(newDevice);

        console.log("Attempting to create Send Transport...");
        initiateSendTransport(newDevice);
        console.log("Attempting to create receive Transport...");

        initiateRecvTransport(newDevice);
      } catch (error) {
        if (error.name === "UnsupportedError") {
          console.error("Browser is not supported by Mediasoup");
        } else {
          console.error("Failed to load device:", error);
        }
      }
    });
  }, [
    email,
    roomId,
    socket,
    navigate,
    initiateSendTransport,
    initiateRecvTransport
  ]);

  const enableVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([videoTrack]);
      }

      const producer = await producerTransport.produce({ track: videoTrack });

      setVideoProducer(producer);
      console.log("Producing video!");

      producer.on("trackended", () => {
        console.log("Video track abruptly ended");

        producer.close();

        socket.emit("close-producer", {
          roomId: roomId,
          producerId: producer.id,
        });

        setVideoProducer(null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }

        // TODO: Show a toast notification to the user
      });
    } catch (error) {
      console.error("Failed to enable video:", error);
    }
  };

  const enableAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];

      const producer = await producerTransport.produce({ track: audioTrack });

      setAudioProducer(producer);
      console.log("Producing audio!");

      if (isWorkerReady) {
        console.log("Whisper model is ready. Whisper is starting to listen...");
        startListening(stream);
      } else {
        console.warn('Whisper model is not ready yet. Transcription paused.');
      }

    } catch (error) {
      console.error("Failed to enable audio:", error);
    }
  };



  const disableVideo = () => {
    if (!videoProducer) return;

    videoProducer.track.stop();

    videoProducer.close();

    socket.emit("close-producer", {
      roomId: roomId,
      producerId: videoProducer.id,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setVideoProducer(null);
    console.log("Video disabled and hardware turned off.");
  };

  const disableAudio = () => {
    if (!audioProducer) return;

    audioProducer.track.stop();
    audioProducer.close();
    socket.emit("close-producer", {
      roomId: roomId,
      producerId: audioProducer.id,
    });

    setAudioProducer(null);
    stopListening();
    console.log("Audio disabled (Muted).");
  };


  const debugg = () => {
    participants.map(ele => {
      console.log(ele);
    })
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>

      {/* LEFT/MAIN COLUMN: Video & Controls */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <h1>Room page</h1>
        <h2>Local Stream</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "300px",
            backgroundColor: "black",
            borderRadius: "8px",
          }}
        />

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          {/* --- VIDEO CONTROLS --- */}
          {videoProducer ? (
            <button
              onClick={disableVideo}
              style={{
                backgroundColor: "#ff4d4f",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}>
              Turn Video Off
            </button>
          ) : (
            <button
              onClick={enableVideo}
              disabled={!producerTransport}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: !producerTransport ? "not-allowed" : "pointer",
              }}>
              Turn Video On
            </button>
          )}

          {/* --- AUDIO CONTROLS --- */}
          {audioProducer ? (
            <button
              onClick={disableAudio}
              style={{
                backgroundColor: "#ff4d4f",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}>
              Mute Audio
            </button>
          ) : (
            <button
              onClick={enableAudio}
              disabled={!producerTransport}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: !producerTransport ? "not-allowed" : "pointer",
              }}>
              Unmute Audio
            </button>
          )}
        </div>

        <h2>Remote Users</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "15px" }}>
          {participants.map((participant) => (
            <RemoteMedia
              key={participant.email}
              participant={participant}
            />
          ))}
        </div>

        <button
          onClick={debugg}
          style={{ marginTop: "20px", alignSelf: "flex-start", padding: "8px 16px" }}>
          hello
        </button>
      </div>

      {/* RIGHT COLUMN: AI Summaries & Live Transcript */}
      <div style={{
        width: '350px',
        borderLeft: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        height: '100%' // Ensure it takes full height of the parent flex container
      }}>

        {/* TOP HALF: AI Summaries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', borderBottom: '2px solid #ddd' }}>
          <h3>AI Meeting Summaries</h3>
          {summaries.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9em' }}>
              Waiting for enough conversation to generate a summary... (approx. 10 mins)
            </p>
          ) : (
            summaries.map((summary, index) => (
              <div key={index} style={{
                backgroundColor: '#e6f2ff',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '5px' }}>
                  {new Date(summary.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95em', lineHeight: '1.4' }}>
                  {summary.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM HALF: Live Transcript Sidebar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: 'white' }}>
            <h4 style={{ margin: 0 }}>Live Transcript</h4>
            <small style={{ color: isWorkerReady ? 'green' : 'orange' }}>
              {isWorkerReady ? '🟢 Whisper (WebGPU) Ready' : '🟠 Loading Model...'}
            </small>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {transcripts.map((text, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};
export default RoomPage;
