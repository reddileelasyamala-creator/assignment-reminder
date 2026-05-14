import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ simple validation
    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await API.post("/register", {
        username,
        password,
      });

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      // ✅ correct error display
      alert(
        err.response?.data?.message ||
        err.response?.data ||
        "Signup failed"
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account 📝</h2>

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Sign Up
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f4f7f6",
  },
  card: {
    padding: "40px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    width: "350px",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  inputGroup: {
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: "15px",
  },
  link: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
};

export default Register;