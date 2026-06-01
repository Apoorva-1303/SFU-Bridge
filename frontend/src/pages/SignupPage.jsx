import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  // Check if user is already authenticated on mount
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
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isLoginTab ? "Welcome Back" : "Create Account"}</h2>
          <p style={styles.subtitle}>
            {isLoginTab 
              ? "Access your dashboard to create rooms and initiate conferences" 
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
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.12C18.416 1.87 15.61 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11-4.606 11-11.24 0-.756-.08-1.333-.26-1.955H12.24z"/>
          </svg>
          Google Authentication
        </button>

        <button 
          onClick={() => navigate("/")} 
          style={styles.backHomeLink}
        >
          ← Return to Homepage
        </button>
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
  blob1: {
    position: "absolute",
    top: "-5%",
    right: "10%",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(65px)",
    zIndex: 1,
  },
  blob2: {
    position: "absolute",
    bottom: "-5%",
    left: "10%",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(65px)",
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "rgba(22, 28, 45, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    padding: "3rem 2.5rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "1.8rem",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    margin: 0,
    lineHeight: "1.4",
  },
  tabContainer: {
    display: "flex",
    background: "rgba(15, 23, 42, 0.5)",
    padding: "0.3rem",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tab: {
    flex: 1,
    padding: "0.6rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 600,
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeTab: {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#ffffff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
  },
  errorAlert: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#f87171",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  successAlert: {
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#4ade80",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
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
  button: {
    padding: "0.8rem",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.25s ease",
    border: "1px solid transparent",
  },
  submitButton: {
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#ffffff",
    marginTop: "0.5rem",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    margin: "0.5rem 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: 500,
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "10px",
    background: "#ffffff",
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
  backHomeLink: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "center",
    transition: "color 0.2s ease",
  },
};

export default SignupPage;
