import React from "react";
import { useState, useCallback } from "react";

const LobbyPage=()=>{
  const [email,setEmail] = useState('');
  const [room,setRoom] = useState('');

  const handleFormSubmit= useCallback((e)=>{
    e.preventDefault();
    console.log(e);
    console.log(email,room);
  },[email, room]);

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