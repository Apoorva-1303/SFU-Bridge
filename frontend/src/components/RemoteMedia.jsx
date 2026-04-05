import { useEffect, useRef } from "react";

export const RemoteMedia = ({ consumer,email }) => {
  const mediaRef = useRef(null);

  useEffect(() => {
    if (mediaRef.current && consumer && consumer.track) {
      mediaRef.current.srcObject = new MediaStream([consumer.track]);
    }
  }, [consumer]);

  if (consumer.kind === 'audio') {
    return <audio ref={mediaRef} autoPlay playsInline />;
  }

  return (
    <>
      <h3>email:{email}</h3>
      <video 
        ref={mediaRef} 
        autoPlay 
        playsInline 
        style={{ width: '300px', backgroundColor: '#333', margin: '5px' }} 
      />
    </>
    
  );
};
