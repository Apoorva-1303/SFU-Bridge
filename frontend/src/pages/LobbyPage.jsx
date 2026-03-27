import React from "react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const LobbyPage=()=>{
  const [email,setEmail] = useState('');
  const [roomId,setRoomId] = useState('');
  const navigate = useNavigate();

  const handleFormSubmit= useCallback((e)=>{
    e.preventDefault();
    navigate(`/room/${roomId}`, { 
      state: { email: email } 
    });
  },[roomId, navigate, email]);

  return <>
    <div>
      <form onSubmit={handleFormSubmit}>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" value={email} onChange={(e)=>{setEmail(e.target.value)}}/>
        <label htmlFor="room">Room id</label>
        <input type="text" id="roomId" value={roomId} onChange={(e)=>{setRoomId(e.target.value)}}/>
        <button>Join</button>
      </form>
    </div>
  </>
};

export default LobbyPage;