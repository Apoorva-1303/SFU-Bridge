import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/background.webp";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setEmail(data.user.email || "");
        }
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

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
    <div style={styles.pageWrapper}>
      <header style={styles.header}>
        <div style={styles.logoContainer} onClick={() => navigate("/")}>
          <div style={styles.logoBadge}>SFU</div>
          <span style={styles.logoText}>
            SFU<span style={styles.orangeText}>Bridge</span>
          </span>
        </div>
        <div style={styles.navActions}>
          {!checkingAuth && (
            user ? (
              <button 
                onClick={() => navigate("/dashboard")} 
                style={styles.headerBtnPrimary}
              >
                Go to Dashboard
              </button>
            ) : (
              <button 
                onClick={() => navigate("/signup")} 
                style={styles.headerBtnPrimary}
              >
                Sign In / Register
              </button>
            )
          )}
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.heroSection}>
          <h1 style={styles.title}>
            Simple, Secure Video <span style={styles.orangeGradientText}>Collaboration</span>
          </h1>
          <p style={styles.subtitle}>
            A real-time conferencing system powered by Mediasoup SFU, featuring local Whisper AI transcriptions and Google Gemini summaries.
          </p>
        </div>

        <div style={styles.interactiveArea}>
          {!showJoinForm ? (
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => setShowJoinForm(true)} 
                style={styles.actionBtnSecondary}
              >
                Join Existing Room
              </button>
              
              <button 
                onClick={() => navigate(user ? "/dashboard" : "/signup")} 
                style={styles.actionBtnPrimary}
              >
                {user ? "Create a Room" : "Register to Create Room"}
              </button>
            </div>
          ) : (
            <div style={styles.joinFormContainer}>
              <h3 style={styles.formTitle}>Enter a Room</h3>
              <form onSubmit={handleJoinSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>Your Identifier (Email/Name)</label>
                  <input 
                    type="text" 
                    id="email" 
                    placeholder="name@example.com or Username"
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
                    placeholder="Enter the room UUID code"
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formActions}>
                  <button 
                    type="button" 
                    onClick={() => setShowJoinForm(false)} 
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={styles.submitBtn}
                  >
                    Enter Room
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <div style={styles.glowOrb1}></div>
      <div style={styles.glowOrb2}></div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    backgroundImage: `linear-gradient(rgba(8, 11, 17, 0.9), rgba(8, 11, 17, 0.95)), url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "#080b11",
    overflow: "hidden",
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  header: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 3rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(8, 11, 17, 0.6)",
    backdropFilter: "blur(12px)",
    zIndex: 10,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    cursor: "pointer",
  },
  logoBadge: {
    backgroundColor: "#ff6b00",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    boxShadow: "0 0 12px rgba(255, 107, 0, 0.4)",
  },
  logoText: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  orangeText: {
    color: "#ff6b00",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
  },
  headerBtnPrimary: {
    padding: "0.6rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 600,
    border: "1px solid #ff6b00",
    backgroundColor: "transparent",
    color: "#ff6b00",
    transition: "all 0.2s ease",
  },
  mainContent: {
    flex: 1,
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "6rem 2rem 4rem 2rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    zIndex: 5,
  },
  heroSection: {
    marginBottom: "3rem",
  },
  title: {
    fontSize: "3.25rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-1px",
    lineHeight: "1.15",
    marginBottom: "1.25rem",
  },
  orangeGradientText: {
    background: "linear-gradient(135deg, #ff9e00 0%, #ff6b00 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.15rem",
    color: "#94a3b8",
    lineHeight: "1.6",
    maxWidth: "600px",
    margin: "0 auto",
  },
  interactiveArea: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    justifyContent: "center",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
  },
  actionBtnPrimary: {
    width: "100%",
    padding: "0.9rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    boxShadow: "0 4px 20px rgba(255, 107, 0, 0.35)",
    transition: "transform 0.15s ease, background-color 0.15s ease",
  },
  actionBtnSecondary: {
    width: "100%",
    padding: "0.9rem",
    fontSize: "1rem",
    fontWeight: 700,
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "#f3f4f6",
    transition: "all 0.2s ease",
  },
  joinFormContainer: {
    width: "100%",
    backgroundColor: "rgba(21, 28, 44, 0.55)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 107, 0, 0.2)",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "left",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.3)",
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "1.25rem",
    textAlign: "center",
    letterSpacing: "-0.3px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#ff9e00",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    backgroundColor: "rgba(8, 11, 17, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  formActions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  cancelBtn: {
    flex: 1,
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "transparent",
    color: "#94a3b8",
  },
  submitBtn: {
    flex: 2,
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(255, 107, 0, 0.3)",
  },
  glowOrb1: {
    position: "absolute",
    top: "20%",
    left: "-10%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(255, 107, 0, 0.08) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 1,
  },
  glowOrb2: {
    position: "absolute",
    bottom: "10%",
    right: "-10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(255, 107, 0, 0.05) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(70px)",
    pointerEvents: "none",
    zIndex: 1,
  },
};

export default LandingPage;
