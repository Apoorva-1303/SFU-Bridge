import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/background.webp";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [emailToUse, setEmailToUse] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const navigate = useNavigate();

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

    let uuid = "";
    if (typeof self.crypto !== "undefined" && typeof self.crypto.randomUUID === "function") {
      uuid = self.crypto.randomUUID();
    } else {
      uuid = "room-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
    }

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
    <div style={styles.pageWrapper}>
      {/* 100% Width Header */}
      <header style={styles.header}>
        <div style={styles.logoContainer} onClick={() => navigate("/")}>
          <div style={styles.logoBadge}>SFU</div>
          <span style={styles.logoText}>
            SFU<span style={styles.orangeText}>Bridge</span>
          </span>
        </div>
        <div style={styles.profileHeaderBadge}>
          <div style={styles.avatar}>
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div style={styles.profileTextWrapper}>
            <span style={styles.profileName}>{displayName}</span>
            <span style={styles.profileStatus}>
              <span style={styles.greenDot}></span> Active Session
            </span>
          </div>
        </div>
      </header>

      {/* Success Notification Banner at the Top */}
      {showSuccessBanner && (
        <div style={styles.successBanner}>
          <div style={styles.successBannerContent}>
            <span style={styles.successCheck}>✓</span>
            <span>Logged in successfully. Welcome back, <strong>{displayName}</strong>!</span>
          </div>
          <button 
            onClick={() => setShowSuccessBanner(false)} 
            style={styles.bannerCloseBtn}
            title="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main style={styles.mainContent}>
        <div style={styles.dashboardCard}>
          <div style={styles.cardHeader}>
            <span style={styles.orangeTag}>QUICK ACTIONS</span>
            <h2 style={styles.welcomeTitle}>
              Launch a Video <span style={styles.orangeGradientText}>Bridge</span>
            </h2>
            <p style={styles.cardSubtitle}>
              Create a new room with a secure unique ID instantly, customize your display name, or log out when done.
            </p>
          </div>

          {/* Configuration Box */}
          <div style={styles.configBox}>
            <h3 style={styles.sectionTitle}>Room Profile Settings</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Display Identity (Visible in video chat)</label>
              <input 
                type="text" 
                value={emailToUse}
                onChange={(e) => setEmailToUse(e.target.value)}
                placeholder="e.g. yourname@domain.com"
                style={styles.input}
              />
              <small style={styles.helperText}>
                We prefilled this with your email. Feel free to adjust it for this session.
              </small>
            </div>
          </div>

          {/* Action Row */}
          <div style={styles.actionRow}>
            <button 
              onClick={handleCreateRoom}
              style={styles.btnLaunch}
            >
              <span style={styles.btnIcon}>✨</span> Create & Launch New Room
            </button>
            
            <button 
              onClick={handleLogout}
              disabled={loggingOut}
              style={styles.btnLogout}
            >
              {loggingOut ? "Signing out..." : "Log Out Securely"}
            </button>
          </div>

          {/* Status info footer inside card */}
          <div style={styles.cardFooter}>
            <div style={styles.statusGroup}>
              <div style={styles.activeDot}></div>
              <span>SFU Server: Connected</span>
            </div>
            <span style={styles.cardFooterSecText}>v1.0.0</span>
          </div>
        </div>
      </main>

      {/* Glowing background highlights */}
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
    backgroundImage: `linear-gradient(rgba(8, 11, 17, 0.92), rgba(8, 11, 17, 0.96)), url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#080b11",
    color: "#f3f4f6",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    overflowX: "hidden",
  },
  loadingContainer: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080b11",
    color: "#94a3b8",
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255, 107, 0, 0.1)",
    borderTop: "3px solid #ff6b00",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    fontSize: "0.95rem",
    fontWeight: 500,
    letterSpacing: "0.5px",
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
  profileHeaderBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  profileTextWrapper: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  profileName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#f3f4f6",
  },
  profileStatus: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  greenDot: {
    display: "inline-block",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
  },
  successBanner: {
    width: "100%",
    padding: "0.75rem 3rem",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderBottom: "1px solid rgba(16, 185, 129, 0.25)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#a7f3d0",
    fontSize: "0.9rem",
    zIndex: 9,
    animation: "fadeIn 0.3s ease-out",
  },
  successBannerContent: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  successCheck: {
    fontWeight: "bold",
    color: "#34d399",
  },
  bannerCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#a7f3d0",
    cursor: "pointer",
    fontSize: "0.85rem",
    opacity: 0.7,
    transition: "opacity 0.15s ease",
    padding: "0.2rem",
    ':hover': {
      opacity: 1
    }
  },
  mainContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 2rem",
    zIndex: 5,
  },
  dashboardCard: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "rgba(21, 28, 44, 0.55)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 107, 0, 0.15)",
    borderRadius: "16px",
    padding: "2.75rem 2.5rem",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.35)",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    animation: "fadeIn 0.4s ease-out",
  },
  cardHeader: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  orangeTag: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#ff9e00",
    letterSpacing: "1.5px",
    backgroundColor: "rgba(255, 107, 0, 0.08)",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    border: "1px solid rgba(255, 107, 0, 0.15)",
  },
  welcomeTitle: {
    fontSize: "2.1rem",
    fontWeight: 800,
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  orangeGradientText: {
    background: "linear-gradient(135deg, #ff9e00 0%, #ff6b00 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  cardSubtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    lineHeight: "1.5",
    margin: 0,
  },
  configBox: {
    backgroundColor: "rgba(8, 11, 17, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    paddingBottom: "0.5rem",
    letterSpacing: "-0.2px",
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
  actionRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },
  btnLaunch: {
    width: "100%",
    padding: "0.9rem",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 700,
    border: "none",
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    boxShadow: "0 4px 16px rgba(255, 107, 0, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  btnIcon: {
    fontSize: "1.1rem",
  },
  btnLogout: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    border: "1px solid rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.03)",
    color: "#f87171",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "1rem",
    marginTop: "0.5rem",
  },
  statusGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: 600,
  },
  activeDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    boxShadow: "0 0 6px #10b981",
  },
  cardFooterSecText: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
  glowOrb1: {
    position: "absolute",
    top: "15%",
    left: "-5%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(255, 107, 0, 0.06) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 1,
  },
  glowOrb2: {
    position: "absolute",
    bottom: "10%",
    right: "-5%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(255, 107, 0, 0.04) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(65px)",
    pointerEvents: "none",
    zIndex: 1,
  },
};

export default DashboardPage;
