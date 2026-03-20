import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import peer from "../services/peer";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback((data) => {
    const { email, id } = data;
    console.log(`User ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log("incoming call ", from, " ", offer);

      const answer = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, answer });
    },
    [socket],
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ answer }) => {
      peer.setLocalDescription(answer);
      console.log("call accepted");

      sendStreams();
    },
    [sendStreams],
  );

  useEffect(() => {
    peer.peer.addEventListener("track", async (e) => {
      const remStream = e.streams;
      console.log("received the tracks!!", remStream);
      setRemoteStream(remStream[0]);
    });
  }, []);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleNegoIncoming = useCallback(
    async ({ from, offer }) => {
      const answer = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, answer });
    },
    [socket],
  );

  const handleNegoFinal = useCallback(async ({ answer }) => {
    // console.log("handleNegoFinal", answer);
    await peer.setLocalDescription(answer);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoIncoming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoIncoming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoIncoming,
    handleNegoFinal,
  ]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  return (
    <div>
      <h1>Room page</h1>
      <h4>{remoteSocketId ? "You are connected" : "No one in the room"}</h4>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream && <button onClick={sendStreams}>Send Streams</button>}

      {myStream && (
        <div>
          <h3>My Stream</h3>
          <video
            style={{
              width: "200px",
              height: "100px",
              backgroundColor: "black",
            }}
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && myStream) {
                video.srcObject = myStream;
              }
            }}
          />
        </div>
      )}

      {remoteStream && (
        <div>
          <h3>Remote Stream</h3>
          <video
            style={{
              width: "200px",
              height: "100px",
              backgroundColor: "black",
            }}
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && remoteStream) {
                video.srcObject = remoteStream;
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
export default RoomPage;
