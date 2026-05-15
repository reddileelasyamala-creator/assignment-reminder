import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // ================= LOGIN =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/login", {
        username,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      // ✅ SAVE USER CORRECTLY
      sessionStorage.setItem(
        "user",
        JSON.stringify(res.data)
      );

      alert("Login successful");

      // ✅ GO TO DASHBOARD
      navigate("/");

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Invalid username or password"
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.heading}>
          📚 Assignment Reminder
        </h2>

        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >

          {/* USERNAME */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Username
            </label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
              style={styles.input}
            />
          </div>

          {/* PASSWORD */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              style={styles.input}
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            style={styles.button}
          >
            Login
          </button>
        </form>

        {/* REGISTER LINK */}
        <p style={styles.registerText}>
          Don't have an account?{" "}

          <Link
            to="/register"
            style={styles.link}
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f7f6",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "400px",
    background: "white",
    padding: "35px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },

  heading: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#3F51B5",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    marginBottom: "6px",
    fontWeight: "bold",
  },

  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },

  button: {
    padding: "12px",
    backgroundColor: "#3F51B5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  registerText: {
    textAlign: "center",
    marginTop: "20px",
  },

  link: {
    color: "#3F51B5",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default Login;