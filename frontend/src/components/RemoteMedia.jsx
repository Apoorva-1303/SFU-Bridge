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
        width: "100%",
        height: "100%",
        minHeight: "180px",
        backgroundColor: "#111827", 
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255, 107, 0, 0.15)",
        transition: "transform 0.2s ease",
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
          }}
        >
          {avatarLetter}
        </div>
      )}

      {/* Label Overlay */}
      <div
        style={{
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
        }}
      >
        {!audioConsumer && (
          <span style={{ color: "#ef4444", fontSize: "14px" }}>
            🔇
          </span>
        )}
        {email.split("@")[0]}
      </div>
    </div>
  );
};