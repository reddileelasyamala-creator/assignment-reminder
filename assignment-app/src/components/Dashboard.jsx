import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [assignments, setAssignments] = useState([]);

  const todayDate = new Date().toISOString().split("T")[0];

  // 🔹 Fetch assignments from backend
  const fetchAssignments = async () => {
    try {
      const res = await API.get(`/assignments/${user.id}`);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 🔹 Calculate stats
  const dueToday = assignments.filter(
    (a) => a.due_date === todayDate
  ).length;

  const upcoming = assignments.filter(
    (a) => a.due_date > todayDate
  ).length;

  const completed = assignments.filter(
    (a) => a.due_date < todayDate
  ).length;

  // 🔹 Logout function
  const logout = () => {
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.logo}>AssignmentApp</div>

        <div style={styles.links}>
          <Link to="/" style={styles.navLink}>Dashboard</Link>
          <Link to="/assignments" style={styles.navLink}>Assignments</Link>
          <Link to="/chat" style={styles.navLink}>Group Chat</Link>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <main style={styles.main}>
        <h1>Welcome, {user?.username} 👋</h1>

        <div style={styles.statsGrid}>
          <div onClick={() => navigate("/assignments")} style={styles.card}>
            <h3>Due Today</h3>
            <p style={styles.statNumber}>{dueToday}</p>
          </div>

          <div style={styles.card}>
            <h3>Upcoming</h3>
            <p style={styles.statNumber}>{upcoming}</p>
          </div>

          <div style={styles.card}>
            <h3>Completed</h3>
            <p style={styles.statNumber}>{completed}</p>
          </div>
        </div>

        <section style={styles.actions}>
          <h3>Quick Actions</h3>

          <div style={styles.actionButtons}>
            <button onClick={() => navigate("/assignments")} style={styles.actionBtn}>
              ➕ Add Assignment
            </button>

            <button
              onClick={() => navigate("/chat")}
              style={{ ...styles.actionBtn, backgroundColor: "#673AB7" }}
            >
              💬 Open Chat
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: "sans-serif", backgroundColor: "#f4f7f6", minHeight: "100vh" },
  nav: { display: "flex", justifyContent: "space-between", padding: "15px 40px", background: "#3F51B5", color: "white" },
  logo: { fontSize: "20px", fontWeight: "bold" },
  links: { display: "flex", gap: "20px", alignItems: "center" },
  navLink: { color: "white", textDecoration: "none" },
  logoutBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" },
  main: { padding: "30px 40px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginTop: "20px" },
  card: { background: "white", padding: "20px", borderRadius: "8px", textAlign: "center", cursor: "pointer" },
  statNumber: { fontSize: "30px", fontWeight: "bold" },
  actions: { marginTop: "40px" },
  actionButtons: { display: "flex", gap: "15px" },
  actionBtn: { padding: "12px 20px", background: "#3F51B5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
};

export default Dashboard;