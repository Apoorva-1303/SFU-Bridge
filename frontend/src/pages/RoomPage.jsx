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
  const [copied, setCopied] = useState(false);

  const handleNewTranscript = useCallback((text) => {
    socket.emit('send-transcript', {
      roomId: roomId,
      text: text
    });
  }, [roomId, socket]);

  const { isWorkerReady, transcripts, sendAudioToWhisper } = useWhisperWorker(handleNewTranscript);
  const { startListening, stopListening } = useVAD(sendAudioToWhisper);

  const [producerTransport, setProducerTransport] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState(null);

  const [videoProducer, setVideoProducer] = useState(null);
  const [audioProducer, setAudioProducer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Bind local stream when local video element becomes available in DOM
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoProducer]);

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
      const mediaStream = new MediaStream([videoTrack]);

      setLocalStream(mediaStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
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
        setLocalStream(null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
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
    setLocalStream(null);
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

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const debugg = () => {
    participants.map(ele => {
      console.log(ele);
    })
  };

  // Local user details for placeholder
  const localAvatarLetter = email ? email.charAt(0).toUpperCase() : "U";

  // Calculate dynamic grid column layout to maximize video block sizes (opentok layout style)
  const totalVideoBlocks = 1 + participants.length;
  let gridCols = "repeat(auto-fit, minmax(320px, 1fr))";
  if (totalVideoBlocks === 1) {
    gridCols = "1fr";
  } else if (totalVideoBlocks === 2) {
    gridCols = "repeat(auto-fit, minmax(400px, 1fr))";
  }

  return (
    <div style={styles.roomContainer}>
      
      {/* LEFT/MAIN SECTION: Video Layout & Controls */}
      <div style={styles.mainVideoArea}>
        
        {/* Top Header Row within Main Area */}
        <div style={styles.topHeader}>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            <span>LIVE CONFERENCE</span>
          </div>

          {/* Copyable Room ID Widget */}
          <div style={styles.roomIdWidget}>
            <span style={styles.roomIdLabel}>Room ID:</span>
            <span style={styles.roomIdValue} title={roomId}>{roomId}</span>
            <button 
              onClick={handleCopyRoomId}
              style={copied ? styles.copyBtnSuccess : styles.copyBtn}
            >
              {copied ? "✓ Copied" : "📋 Copy ID"}
            </button>
          </div>
        </div>

        {/* Video Grid Area (stretching to maximize layout) */}
        <div style={styles.videoGridContainer}>
          <div 
            style={{
              ...styles.videoGrid,
              gridTemplateColumns: gridCols,
            }}
          >
            {/* LOCAL VIDEO STREAM (ALWAYS FIRST!) */}
            <div style={styles.localVideoBlock}>
              {videoProducer ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={styles.videoElement}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <div style={styles.localAvatarRing}>
                    {localAvatarLetter}
                  </div>
                </div>
              )}
              
              {/* Overlay Identifier */}
              <div style={styles.labelOverlay}>
                <span style={styles.indicatorMic}>
                  {audioProducer ? "🎙️" : "🔇"}
                </span>
                <span>You ({email ? email.split("@")[0] : ""})</span>
              </div>
            </div>

            {/* REMOTE VIDEO STREAMS */}
            {participants.map((participant) => (
              <div key={participant.email} style={styles.remoteVideoBlock}>
                <RemoteMedia participant={participant} />
              </div>
            ))}
          </div>
        </div>

        {/* FLOATING CONTROLS BAR */}
        <div style={styles.controlsBar}>
          {videoProducer ? (
            <button onClick={disableVideo} style={styles.ctrlBtnActive}>
              📹 Stop Video
            </button>
          ) : (
            <button 
              onClick={enableVideo} 
              disabled={!producerTransport} 
              style={styles.ctrlBtnInactive}
            >
              📹 Start Video
            </button>
          )}

          {audioProducer ? (
            <button onClick={disableAudio} style={styles.ctrlBtnActive}>
              🎙️ Mute Mic
            </button>
          ) : (
            <button 
              onClick={enableAudio} 
              disabled={!producerTransport} 
              style={styles.ctrlBtnInactive}
            >
              🎙️ Unmute Mic
            </button>
          )}

          {/* Leave Room Button */}
          <button 
            onClick={() => {
              disableVideo();
              disableAudio();
              navigate("/dashboard");
            }} 
            style={styles.leaveBtn}
          >
            🚪 Leave Room
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: AI Summaries & Live Transcript Sidebar (CORNER MOUNTED) */}
      <div style={styles.sidebar}>
        
        {/* UPPER PANEL: AI Summaries */}
        <div style={styles.summaryPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>AI Meeting Summaries</h3>
            <span style={styles.panelIcon}>🤖</span>
          </div>

          <div style={styles.summaryList}>
            {summaries.length === 0 ? (
              <div style={styles.emptyStateText}>
                <p>Waiting for enough discussion to analyze...</p>
                <small>Summaries will generate automatically as speech transcripts accumulate.</small>
              </div>
            ) : (
              summaries.map((summary, index) => (
                <div key={index} style={styles.summaryCard}>
                  <div style={styles.summaryTime}>
                    {new Date(summary.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={styles.summaryText}>
                    {summary.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOWER PANEL: Live Transcript */}
        <div style={styles.transcriptPanel}>
          <div style={styles.panelHeaderBorder}>
            <h4 style={styles.transcriptTitle}>Live Transcript</h4>
            <div style={styles.modelStatusBadge}>
              <span style={isWorkerReady ? styles.statusGreenDot : styles.statusOrangeDot}></span>
              <span style={{ fontSize: "11px", fontWeight: 600 }}>
                {isWorkerReady ? 'Whisper (WebGPU) Active' : 'Loading Model...'}
              </span>
            </div>
          </div>

          <div style={styles.transcriptList}>
            {transcripts.map((text, index) => (
              <div key={index} style={styles.transcriptBubble}>
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

// Premium Styles for Room Page
const styles = {
  roomContainer: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#080b11",
    overflow: "hidden",
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  mainVideoArea: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    padding: "20px",
    overflow: "hidden",
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    zIndex: 10,
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    color: "#f87171",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    boxShadow: "0 0 8px #ef4444",
    animation: "pulse 1.5s infinite",
  },
  roomIdWidget: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    backgroundColor: "rgba(21, 28, 44, 0.65)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 107, 0, 0.2)",
    padding: "0.35rem 0.5rem 0.35rem 0.9rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  roomIdLabel: {
    color: "#ff9e00",
    fontWeight: 600,
  },
  roomIdValue: {
    color: "#ffffff",
    fontFamily: "monospace",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyBtn: {
    padding: "0.25rem 0.6rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
  },
  copyBtnSuccess: {
    padding: "0.25rem 0.6rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
  },
  videoGridContainer: {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: "80px", // space for controls bar
  },
  videoGrid: {
    display: "grid",
    gap: "16px",
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    alignContent: "center",
    justifyContent: "center",
  },
  localVideoBlock: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: "180px",
    backgroundColor: "#111827",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    border: "2px solid #ff6b00",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  remoteVideoBlock: {
    width: "100%",
    height: "100%",
  },
  videoElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // Mirror local video
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  localAvatarRing: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "bold",
    boxShadow: "0 0 16px rgba(255, 107, 0, 0.4)",
  },
  labelOverlay: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    backgroundColor: "rgba(11, 15, 23, 0.8)",
    backdropFilter: "blur(6px)",
    color: "white",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(255, 107, 0, 0.25)",
  },
  indicatorMic: {
    fontSize: "14px",
  },
  controlsBar: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "12px",
    backgroundColor: "rgba(11, 15, 23, 0.85)",
    backdropFilter: "blur(12px)",
    padding: "0.65rem 1.5rem",
    borderRadius: "30px",
    border: "1px solid rgba(255, 107, 0, 0.3)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  ctrlBtnActive: {
    padding: "0.55rem 1.1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    color: "#ff6b00",
    border: "1px solid #ff6b00",
  },
  ctrlBtnInactive: {
    padding: "0.55rem 1.1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  leaveBtn: {
    padding: "0.55rem 1.1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    border: "1px solid #ef4444",
  },
  
  /* Sidebar styles (Corner-mounted, Dark theme, White text) */
  sidebar: {
    width: "360px",
    height: "100%",
    backgroundColor: "#0c101b",
    borderLeft: "1px solid rgba(255, 107, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    color: "#ffffff",
    zIndex: 5,
  },
  summaryPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid rgba(255, 107, 0, 0.15)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "1.25rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 0, 0.03)",
  },
  panelHeaderBorder: {
    padding: "1.25rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
  },
  panelTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  panelIcon: {
    fontSize: "1.2rem",
  },
  summaryList: {
    flex: 1,
    overflowY: "auto",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  emptyStateText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontStyle: "italic",
    padding: "2rem 1rem",
    lineHeight: "1.4",
  },
  summaryCard: {
    backgroundColor: "rgba(255, 107, 0, 0.08)",
    border: "1px solid rgba(255, 107, 0, 0.18)",
    borderRadius: "8px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
  },
  summaryTime: {
    fontSize: "0.75rem",
    color: "#ff9e00",
    fontWeight: 600,
  },
  summaryText: {
    fontSize: "0.9rem",
    lineHeight: "1.45",
    color: "#ffffff",
    whiteSpace: "pre-wrap",
  },
  transcriptPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  transcriptTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
  },
  modelStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "#94a3b8",
  },
  statusGreenDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    boxShadow: "0 0 6px #10b981",
  },
  statusOrangeDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    backgroundColor: "#ff9e00",
    borderRadius: "50%",
    boxShadow: "0 0 6px #ff9e00",
    animation: "pulse 1.5s infinite",
  },
  transcriptList: {
    flex: 1,
    overflowY: "auto",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  transcriptBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    padding: "10px 12px",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "0.88rem",
    lineHeight: "1.4",
  },
};

export default RoomPage;
