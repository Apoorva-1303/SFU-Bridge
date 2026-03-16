import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const handleUserJoined = useCallback((data) => {
    const { email, id } = data;
    console.log(`User ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    return () => {
      socket.off("user:joined", handleUserJoined);
    };
  }, [socket, handleUserJoined]);

  const handleCallUser = useCallback(()=>{

  },[])

  return (
    <div>
      <h1>Room page</h1>
      <h4>{remoteSocketId ? "You are connected" : "No one in the room"}</h4>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
    </div>
  );
};
export default RoomPage;
