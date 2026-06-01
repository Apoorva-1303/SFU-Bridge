import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const navigate = useNavigate();

  const handleJoinSubmit = useCallback((e) => {
    e.preventDefault();
    if (!email || !roomId) {
      alert("Please fill in both Email and Room ID.");
      return;
    }
    navigate(`/room/${roomId}`, { 
      state: { email: email } 
    });
  }, [roomId, navigate, email]);

  return (
    <div style={styles.container}>
      {/* Background blobs for premium depth */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* Main Glassmorphic Wrapper */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>SFU</div>
          <h1 style={styles.title}>SFU<span style={styles.gradientText}>Bridge</span></h1>
          <p style={styles.subtitle}>
            A state-of-the-art WebRTC conferencing system powered by Mediasoup SFU, offering real-time collaboration, local AI Whisper transcriptions, and instant meeting summaries.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>SFU Multi-party Video</h3>
            <p style={styles.featureDesc}>Ultra low-latency audio/video routing via Mediasoup SFU, optimizing bandwidth and client performance.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎙️</div>
            <h3 style={styles.featureTitle}>WebGPU Whisper</h3>
            <p style={styles.featureDesc}>Private, high-fidelity in-browser speech recognition running locally using Transformers.js and WebGPU.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.featureTitle}>AI Meeting Summaries</h3>
            <p style={styles.featureDesc}>Automatic intelligent discussion summaries generated in real-time by Google Gemini model integration.</p>
          </div>
        </div>

        {/* Dynamic Interactive Panel */}
        <div style={styles.actionsContainer}>
          {!showJoinForm ? (
            <div style={styles.buttonRow}>
              <button 
                onClick={() => setShowJoinForm(true)} 
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Join Existing Room
              </button>
              
              <button 
                onClick={() => navigate("/signup")} 
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                Register to Create Room
              </button>
            </div>
          ) : (
            <div style={styles.formContainer}>
              <h3 style={styles.formTitle}>Join a Conference Room</h3>
              <form onSubmit={handleJoinSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>Your Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="name@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label htmlFor="roomId" style={styles.label}>Room ID</label>
                  <input 
                    type="text" 
                    id="roomId" 
                    placeholder="Enter unique room code"
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formButtons}>
                  <button 
                    type="button" 
                    onClick={() => setShowJoinForm(false)} 
                    style={{ ...styles.button, ...styles.buttonLink }}
                  >
                    ← Back
                  </button>
                  <button 
                    type="submit" 
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                  >
                    Enter Room
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Premium Styling System (Glassmorphic Dark Theme)
const styles = {
  container: {
    minHeight: "92vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
    color: "#e2e8f0",
    padding: "2rem",
  },
  blob1: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 1,
  },
  blob2: {
    position: "absolute",
    bottom: "10%",
    right: "15%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: "960px",
    background: "rgba(22, 28, 45, 0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "3.5rem 3rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    textAlign: "center",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  logoBadge: {
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "0.25rem 0.85rem",
    borderRadius: "20px",
    letterSpacing: "1px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-1px",
    color: "#ffffff",
    lineHeight: 1.15,
  },
  gradientText: {
    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.15rem",
    color: "#94a3b8",
    maxWidth: "680px",
    lineHeight: "1.6",
    margin: "0.5rem 0 0 0",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
    margin: "1rem 0",
  },
  featureCard: {
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "1.8rem",
    textAlign: "left",
    transition: "transform 0.25s ease, border-color 0.25s ease",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  featureIcon: {
    fontSize: "1.8rem",
    marginBottom: "0.25rem",
  },
  featureTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    margin: 0,
    color: "#f1f5f9",
  },
  featureDesc: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    lineHeight: "1.5",
    margin: 0,
  },
  actionsContainer: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "center",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.2rem",
    justifyContent: "center",
  },
  button: {
    padding: "0.85rem 2rem",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.25s ease",
    border: "1px solid transparent",
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
  },
  buttonSecondary: {
    background: "rgba(255, 255, 255, 0.06)",
    color: "#e2e8f0",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },
  buttonLink: {
    background: "transparent",
    color: "#94a3b8",
    padding: "0.85rem 1.2rem",
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
    background: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "left",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    margin: "0 0 1.5rem 0",
    color: "#ffffff",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "0.8rem 1rem",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  formButtons: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.5rem",
  },
};

export default LandingPage;
