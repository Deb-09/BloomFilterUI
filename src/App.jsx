import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState(null);

  const debouncedUsername = useDebounce(username, 400);

  // Auto check username as user types
  const checkUsername = useCallback(async (name) => {
    if (!name || name.trim().length < 2) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/check?username=${name.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  // Trigger check when debounced username changes
  useEffect(() => {
    checkUsername(debouncedUsername);
    fetchStats();
  }, [debouncedUsername]);

  // Register handler
  const handleRegister = async () => {
    if (!username || !email) return;
    setRegistering(true);
    setRegisterMsg(null);
    try {
      const res = await fetch(
        `${API}/register?username=${username.trim()}&email=${email.trim()}`,
        { method: "POST" }
      );
      const data = await res.json();
      setRegisterMsg(data.message);
      setResult(data);
      fetchStats();
    } catch {
      setRegisterMsg("Something went wrong.");
    } finally {
      setRegistering(false);
    }
  };

  const statusColor = () => {
    if (loading) return "#888";
    if (!result) return "transparent";
    return result.available ? "#2ecc71" : "#e74c3c";
  };

  const statusIcon = () => {
    if (loading) return "⏳";
    if (!result) return null;
    return result.available ? "✅" : "❌";
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <img 
          src="/google-logo-transparent.png" 
          alt="Google Logo" 
          style={styles.image} 
        />

        {/* Username input */}
        <div style={styles.inputWrapper}>
          <input
            style={{
              ...styles.input,
              borderColor: statusColor(),
            }}
            type="text"
            placeholder="Enter a username..."
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setRegisterMsg(null);
            }}
          />
          {statusIcon() && (
            <span style={styles.icon}>{statusIcon()}</span>
          )}
        </div>

        {/* Result message */}
        {result && !loading && (
          <div style={{
            ...styles.resultBox,
            background: result.available ? "#1a3a2a" : "#3a1a1a",
            borderColor: result.available ? "#2ecc71" : "#e74c3c",
          }}>
            <p style={{ ...styles.resultText, color: result.available ? "#2ecc71" : "#e74c3c" }}>
              {result.message}
            </p>
            <p style={styles.checkedBy}>
              Checked by:{" "}
              <span style={{
                color: result.checkedBy === "BLOOM_FILTER" ? "#f39c12" : "#3498db",
                fontWeight: 600,
              }}>
                {result.checkedBy}
              </span>
            </p>
            {result.checkedBy === "BLOOM_FILTER" && (
              <p style={styles.hint}>⚡ DB was never called!</p>
            )}
          </div>
        )}

        {/* Register section — only show if available */}
        {result?.available && !loading && (
          <div style={styles.registerBox}>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email to register..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              style={styles.button}
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? "Registering..." : "Register Username"}
            </button>
            {registerMsg && (
              <p style={styles.registerMsg}>{registerMsg}</p>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={styles.statsBox}>
            <p style={styles.statsTitle}>⚡ Bloom Filter Stats</p>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.totalChecks}</span>
                <span style={styles.statLabel}>Total Checks</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.bloomShortCircuits}</span>
                <span style={styles.statLabel}>DB Calls Saved</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.databaseQueries}</span>
                <span style={styles.statLabel}>DB Queries Made</span>
              </div>
              <div style={styles.statItem}>
                <span style={{ ...styles.statValue, color: "#2ecc71" }}>
                  {stats.dbCallsSavedPercent}%
                </span>
                <span style={styles.statLabel}>Efficiency</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "2rem",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "480px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#fff",
    fontSize: "1.6rem",
    margin: "0 0 6px",
    fontWeight: 600,
  },
  subtitle: {
    color: "#666",
    fontSize: "0.85rem",
    margin: "0 0 1.8rem",
  },
  inputWrapper: {
    position: "relative",
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#111",
    border: "1.5px solid #333",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  icon: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "1.1rem",
  },
  resultBox: {
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid",
    marginBottom: "1rem",
  },
  resultText: {
    margin: "0 0 4px",
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  checkedBy: {
    margin: "0",
    fontSize: "0.8rem",
    color: "#888",
  },
  hint: {
    margin: "6px 0 0",
    fontSize: "0.78rem",
    color: "#f39c12",
  },
  registerBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "1.5rem",
  },
  button: {
    padding: "12px",
    background: "#2ecc71",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  registerMsg: {
    color: "#aaa",
    fontSize: "0.85rem",
    margin: 0,
    textAlign: "center",
  },
  statsBox: {
    marginTop: "1.5rem",
    padding: "16px",
    background: "#111",
    borderRadius: "10px",
    border: "1px solid #2a2a2a",
  },
  statsTitle: {
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 600,
    margin: "0 0 12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statValue: {
    color: "#f39c12",
    fontSize: "1.4rem",
    fontWeight: 700,
  },
  statLabel: {
    color: "#555",
    fontSize: "0.75rem",
  },
};