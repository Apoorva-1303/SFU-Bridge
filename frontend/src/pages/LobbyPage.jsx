import React from "react";
import { useState, useCallback } from "react";
import {useSocket} from "../contexts/SocketContext"
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LobbyPage=()=>{
  const [email,setEmail] = useState('');
  const [room,setRoom] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const handleFormSubmit= useCallback((e)=>{
    e.preventDefault();
    socket.emit("room:join",{email,room});
  },[email, room, socket]);

  const handleJoinRoom = useCallback((data)=>{
    const {room}=data;
    navigate(`/room/${room}`);
  },[navigate]);

  useEffect(()=>{
    socket.on("room:join",handleJoinRoom);
    return ()=>{
      socket.off("room:join",handleJoinRoom);
    }
  },[socket,handleJoinRoom])

  return <>
    <div>
      <form onSubmit={handleFormSubmit}>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" value={email} onChange={(e)=>{setEmail(e.target.value)}}/>
        <label htmlFor="room">Room id</label>
        <input type="text" id="room" value={room} onChange={(e)=>{setRoom(e.target.value)}}/>
        <button>Join</button>
      </form>
    </div>
  </>
};

export default LobbyPage;