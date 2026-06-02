import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/background.webp";

const SignupPage = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        const data = await response.json();
        if (response.ok && data.success) {
          navigate("/dashboard");
        }
      } catch (err) {
        // Ignore unauthenticated check failures on initial load
      }
    };
    checkAuthStatus();
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!isLoginTab && password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    const url = isLoginTab ? "/api/auth/login" : "/api/auth/signup";
    const bodyData = isLoginTab 
      ? { email, password }
      : { email, username, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(isLoginTab ? "Login successful! Redirecting..." : "Account created and logged in!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setErrorMsg(data.error || "An authentication error occurred");
      }
    } catch (err) {
      setErrorMsg("Network error, please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header spanning across the page */}
      <header style={styles.header}>
        <div style={styles.logoContainer} onClick={() => navigate("/")}>
          <div style={styles.logoBadge}>SFU</div>
          <span style={styles.logoText}>
            SFU<span style={styles.orangeText}>Bridge</span>
          </span>
        </div>
        <button onClick={() => navigate("/")} style={styles.backHomeBtn}>
          ← Back
        </button>
      </header>

      <div style={styles.card}>
        <div style={styles.headerSection}>
          <h2 style={styles.title}>{isLoginTab ? "Welcome Back" : "Create Account"}</h2>
          <p style={styles.subtitle}>
            {isLoginTab 
              ? "Access your dashboard to manage rooms and conferences" 
              : "Register below to unlock secure video call capabilities"}
          </p>
        </div>

        {/* Tab Controls */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => { setIsLoginTab(true); setErrorMsg(""); setSuccessMsg(""); }} 
            style={{ 
              ...styles.tab, 
              ...(isLoginTab ? styles.activeTab : {}) 
            }}
          >
            Log In
          </button>
          <button 
            onClick={() => { setIsLoginTab(false); setErrorMsg(""); setSuccessMsg(""); }} 
            style={{ 
              ...styles.tab, 
              ...(!isLoginTab ? styles.activeTab : {}) 
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

        {/* Form */}
        <form onSubmit={handleLocalSubmit} style={styles.form}>
          {!isLoginTab && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input 
                type="text" 
                placeholder="Your screen name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {!isLoginTab && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              ...styles.button, 
              ...styles.submitButton,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? "Processing..." : (isLoginTab ? "Log In" : "Sign Up")}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.dividerLine}></div>
        </div>

        {/* Google OAuth Option */}
        <button onClick={handleGoogleLogin} style={styles.googleButton}>
          <svg style={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.12C18.416 1.87 15.61 1 12.24 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11-4.606 11-11.24 0-.756-.08-1.333-.26-1.955H12.24z"/>
          </svg>
          Google Authentication
        </button>
      </div>

      <div style={styles.glowOrb}></div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundImage: `linear-gradient(rgba(8, 11, 17, 0.9), rgba(8, 11, 17, 0.95)), url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#080b11",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
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
  backHomeBtn: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "transparent",
    color: "#94a3b8",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "rgba(21, 28, 44, 0.65)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 107, 0, 0.15)",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    zIndex: 5,
    margin: "auto 0",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  headerSection: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    lineHeight: "1.4",
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "rgba(8, 11, 17, 0.5)",
    padding: "0.25rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tab: {
    flex: 1,
    padding: "0.55rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: 600,
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeTab: {
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(255, 107, 0, 0.25)",
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "8px",
    padding: "0.7rem 1rem",
    color: "#f87171",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  successAlert: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    borderRadius: "8px",
    padding: "0.7rem 1rem",
    color: "#34d399",
    fontSize: "0.85rem",
    fontWeight: 500,
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
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  button: {
    padding: "0.8rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
  },
  submitButton: {
    backgroundColor: "#ff6b00",
    color: "#ffffff",
    marginTop: "0.4rem",
    boxShadow: "0 4px 12px rgba(255, 107, 0, 0.3)",
    fontWeight: 700,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: 500,
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },
  googleIcon: {
    display: "block",
  },
  glowOrb: {
    position: "absolute",
    bottom: "-10%",
    left: "-10%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(255, 107, 0, 0.06) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 1,
  },
};

export default SignupPage;
