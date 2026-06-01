import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [emailToUse, setEmailToUse] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  // Fetch active session profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.user);
          setDisplayName(data.user.username || data.user.email.split("@")[0]);
          setEmailToUse(data.user.email);
        } else {
          // If not authenticated, redirect to signup/login
          navigate("/signup");
        }
      } catch (err) {
        navigate("/signup");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (response.ok) {
        navigate("/");
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (err) {
      alert("Network error during logout.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCreateRoom = useCallback(() => {
    if (!emailToUse) {
      alert("Please specify a display email or name to enter the room.");
      return;
    }

    // Generate a secure, unique UUID for the room
    let uuid = "";
    if (typeof self.crypto !== "undefined" && typeof self.crypto.randomUUID === "function") {
      uuid = self.crypto.randomUUID();
    } else {
      // Robust fallback generator
      uuid = "room-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
    }

    // Navigate to the room page using standard flow and passing state
    navigate(`/room/${uuid}`, {
      state: { email: emailToUse }
    });
  }, [navigate, emailToUse]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* Main Dashboard Card */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.welcomeBadge}>SECURE ACCESS</div>
          <h2 style={styles.welcomeTitle}>
            Welcome back, <span style={styles.gradientText}>{displayName}</span>!
          </h2>
          <p style={styles.subtitle}>
            You are authenticated. Create a conference room immediately, customize your screen identifier, or securely log out.
          </p>
        </div>

        {/* Profile / Details Grid */}
        <div style={styles.profileSection}>
          <h3 style={styles.sectionTitle}>Conference Identity</h3>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Display Email (used as your video identity)</label>
            <input 
              type="text" 
              value={emailToUse}
              onChange={(e) => setEmailToUse(e.target.value)}
              placeholder="e.g. yourname@domain.com"
              style={styles.input}
            />
            <small style={styles.helperText}>
              By default, we prefill this with your registered email. You can change this identifier for this session.
            </small>
          </div>
        </div>

        {/* Action Panel */}
        <div style={styles.actionPanel}>
          <button 
            onClick={handleCreateRoom}
            style={{ ...styles.button, ...styles.buttonCreate }}
          >
            <span style={styles.buttonIcon}>✨</span> Create & Launch New Room
          </button>
          
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ ...styles.button, ...styles.buttonLogout }}
          >
            {loggingOut ? "Logging out..." : "Secure Log Out"}
          </button>
        </div>

        {/* Footer info */}
        <div style={styles.footer}>
          <span style={styles.footerText}>SFU-Bridge Server Connection: Active</span>
          <div style={styles.statusDot}></div>
        </div>
      </div>
    </div>
  );
};

// Premium Styles
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
  loadingContainer: {
    minHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    background: "#0f172a",
    color: "#94a3b8",
  },
  spinner: {
    width: "45px",
    height: "45px",
    border: "3px solid rgba(99, 102, 241, 0.15)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1.2rem",
  },
  loadingText: {
    fontSize: "1rem",
    fontWeight: 500,
    letterSpacing: "0.5px",
  },
  blob1: {
    position: "absolute",
    top: "-10%",
    left: "-5%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(70px)",
    zIndex: 1,
  },
  blob2: {
    position: "absolute",
    bottom: "-10%",
    right: "-5%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(70px)",
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: "600px",
    background: "rgba(22, 28, 45, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "3rem 2.8rem",
    boxShadow: "0 22px 45px rgba(0, 0, 0, 0.4)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "2.2rem",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.8rem",
  },
  welcomeBadge: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#34d399",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    letterSpacing: "1px",
  },
  welcomeTitle: {
    fontSize: "2.3rem",
    fontWeight: 800,
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
  },
  gradientText: {
    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    margin: 0,
    lineHeight: "1.5",
  },
  profileSection: {
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "1.8rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "0.6rem",
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
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  helperText: {
    fontSize: "0.78rem",
    color: "#64748b",
    lineHeight: "1.3",
  },
  actionPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  button: {
    padding: "0.9rem",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.25s ease",
    border: "1px solid transparent",
  },
  buttonCreate: {
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
  },
  buttonIcon: {
    marginRight: "0.4rem",
  },
  buttonLogout: {
    background: "rgba(239, 68, 68, 0.06)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.15)",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  footerText: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: 600,
  },
  statusDot: {
    width: "7px",
    height: "7px",
    background: "#34d399",
    borderRadius: "50%",
    boxShadow: "0 0 8px #34d399",
  },
};

export default DashboardPage;
