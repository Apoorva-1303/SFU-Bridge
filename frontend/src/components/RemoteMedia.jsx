import { useEffect, useRef } from "react";

export const RemoteMedia = ({ participant }) => {
  const { email, videoConsumer, audioConsumer } = participant;
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Handle Video
  useEffect(() => {
    if (videoRef.current && videoConsumer?.track) {
      videoRef.current.srcObject = new MediaStream([videoConsumer.track]);
    }
  }, [videoConsumer]);

  // Handle Audio
  useEffect(() => {
    if (audioRef.current && audioConsumer?.track) {
      audioRef.current.srcObject = new MediaStream([audioConsumer.track]);
    }
  }, [audioConsumer]);

  // Extract first letter for the Avatar
  const avatarLetter = email.charAt(0).toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        width: "320px",
        height: "240px",
        backgroundColor: "#202124", 
        borderRadius: "12px",
        margin: "10px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      }}
    >
      {audioConsumer && (
        <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      )}

      {videoConsumer ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", 
          }}
        />
      ) : (
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#8ab4f8", 
            color: "#202124",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            fontWeight: "bold",
          }}
        >
          {avatarLetter}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {!audioConsumer && (
          <span style={{ color: "#ea4335", fontSize: "16px" }}>
            🔇
          </span>
        )}
        {email.split("@")[0]}
      </div>
    </div>
  );
};