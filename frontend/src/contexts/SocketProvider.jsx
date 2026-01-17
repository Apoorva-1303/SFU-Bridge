import React, { useMemo } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './SocketContext';

export const SocketProvider = (props) => {
  const domain = "/"; 
  
  const socket = useMemo(() => io(domain, {
    // This ensures socket.io uses the proxy correctly
    path: '/socket.io' 
  }), [domain]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
}