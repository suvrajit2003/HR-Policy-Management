import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await axios.post("http://localhost:1000/api/forgot-password", { email });
      alert("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp) return setError("Please enter the OTP.");
    try {
      await axios.post("http://localhost:1000/api/verify-otp", { email, otp });
      setMessage("OTP verified. You can now reset your password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!newPassword || !confirmPassword)
      return setError("Please fill all fields.");
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");
    try {
      await axios.post("http://localhost:1000/api/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage("Password reset successful.");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glassCard {
          animation: fadeIn 0.8s ease forwards;
        }
        .inputField:focus {
          border-color: #2575fc;
          box-shadow: 0 0 6px rgba(37, 117, 252, 0.4);
        }
        .button:hover {
          background-color: #1a5fd1;
          transform: scale(1.02);
        }
        .button {
          transition: background-color 0.3s, transform 0.3s;
        }
      `}</style>

      <div className="glassCard" style={styles.card}>
        <h2 style={styles.title}>Forgot Password</h2>

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inputField"
              style={styles.input}
            />
            <button onClick={handleSendOtp} className="button" style={styles.button}>
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="inputField"
              style={styles.input}
            />
            <button onClick={handleVerifyOtp} className="button" style={styles.button}>
              Verify OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="inputField"
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="inputField"
              style={styles.input}
            />
            <button onClick={handleResetPassword} className="button" style={styles.button}>
              Reset Password
            </button>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <p style={{ marginTop: 15 }}>
          <span onClick={() => navigate("/")} style={styles.link}>
            ⬅ Back to Login
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Poppins', sans-serif",
    padding: "20px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "30px",
    maxWidth: "400px",
    width: "100%",
    color: "#fff",
    boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
    fontWeight: "bold",
    fontSize: "24px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2575fc",
    color: "#fff",
    fontSize: "16px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  error: {
    color: "#ff5e5e",
    marginTop: "10px",
    fontSize: "14px",
    fontWeight: "600",
  },
  success: {
    color: "#00e676",
    marginTop: "10px",
    fontSize: "14px",
    fontWeight: "600",
  },
  link: {
    color: "#fff",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default ForgotPassword;
