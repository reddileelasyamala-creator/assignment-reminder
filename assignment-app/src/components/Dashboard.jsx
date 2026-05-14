import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const Dashboard = () => {
  const navigate = useNavigate();

  const user = JSON.parse(
    sessionStorage.getItem("user")
  );

  const [assignments, setAssignments] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
const [groups, setGroups] = useState([]);

  // ✅ Converts any DB date (UTC timestamp) to local YYYY-MM-DD
  const toLocalDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-CA");
  };

  // Today in local timezone
  const todayDate = new Date().toLocaleDateString("en-CA");

  // ======================================================
  // FETCH DATA
  // ======================================================

  useEffect(() => {
  fetchAssignments();

  if (
    "Notification" in window &&
    Notification.permission !== "granted"
  ) {
    Notification.requestPermission();
  }

  // ✅ Check unread messages every 15 seconds
  const checkUnread = async () => {
    try {
      const res = await API.get(`/groups/${user.id}`);
      const fetchedGroups = res.data;
      setGroups(fetchedGroups);
      const counts = {};
      for (const group of fetchedGroups) {
        const r = await API.get(`/messages/${group.id}/unread/${user.id}`);
        counts[group.id] = r.data.unread;
      }
      setUnreadCounts(counts);
    } catch (err) {
      console.error(err);
    }
  };

  checkUnread();
  const interval = setInterval(checkUnread, 15000);
  return () => clearInterval(interval);

}, []);

  const fetchAssignments = async () => {
    try {

      const res = await API.get(
        `/assignments/${user.id}`
      );

      setAssignments(res.data);

      checkReminders(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // REMINDERS
  // ======================================================

  const checkReminders = (data) => {

    const shown =
      JSON.parse(
        localStorage.getItem("shownAlerts")
      ) || [];

    data.forEach((item) => {

      if (item.completed) return;

      const now = new Date();

      const due = new Date(
        `${toLocalDate(item.due_date)}T${item.due_time || "23:59"}`
      );

      const diff = due.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));

      // OVERDUE
      if (diff < 0) {

        if (!shown.includes(item.id + "-overdue")) {

          alert(`🚨 ${item.title} is OVERDUE`);

          shown.push(item.id + "-overdue");

          localStorage.setItem("shownAlerts", JSON.stringify(shown));

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Assignment Overdue 🚨", {
              body: item.title,
            });
          }
        }
      }

      // DUE SOON
      else if (hours <= 24 && hours >= 0) {

        if (!shown.includes(item.id + "-due")) {

          alert(`⏰ ${item.title} due in ${hours} hour(s)`);

          shown.push(item.id + "-due");

          localStorage.setItem("shownAlerts", JSON.stringify(shown));

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Assignment Reminder ⏰", {
              body: `${item.title} due in ${hours} hour(s)`,
            });
          }
        }
      }

    });

  };

  // ======================================================
  // FILTERS — all using toLocalDate() instead of slice
  // ======================================================

  const dueToday = assignments.filter((a) => {
    const due = toLocalDate(a.due_date); // ✅
    return due === todayDate && !a.completed;
  });

  const upcoming = assignments.filter((a) => {
    const due = toLocalDate(a.due_date); // ✅
    return due > todayDate && !a.completed;
  });

  const completed = assignments.filter(
    (a) => a.completed
  );

  const overdue = assignments.filter((a) => {
    const due = toLocalDate(a.due_date); // ✅
    return due < todayDate && !a.completed;
  });

  // ======================================================
  // LOGOUT
  // ======================================================

  const logout = () => {
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // ======================================================
  // UI
  // ======================================================

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.nav}>

        <div style={styles.logo}>
          📚 Assignment Reminder
        </div>

        <div style={styles.links}>

          <Link to="/" style={styles.navLink}>
            Dashboard
          </Link>

          <Link to="/assignments" style={styles.navLink}>
            Assignments
          </Link>

         <Link to="/chat" style={styles.navLink}>
  Group Chat{" "}
  {totalUnread > 0 && (
    <span style={{
      background: "red",
      color: "white",
      borderRadius: "8px",
      padding: "2px 8px",
      fontSize: "11px",
      marginLeft: "4px",
    }}>
      {Object.entries(unreadCounts)
        .filter(([_, count]) => count > 0)
        .map(([groupId, count]) => {
          const group = groups.find(g => String(g.id) === String(groupId));
          return group ? `${group.name}: ${count}` : null;
        })
        .filter(Boolean)
        .join(", ")}
    </span>
  )}
</Link>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>

        </div>

      </nav>

      {/* MAIN */}
      <main style={styles.main}>

        <h1>Welcome, {user?.username} 👋</h1>

        {/* STATS */}
        <div style={styles.statsGrid}>

          <div
            style={styles.card}
            onClick={() => navigate("/assignments?filter=today")}
          >
            <h3>📌 Due Today</h3>
            <p style={styles.statNumber}>{dueToday.length}</p>
          </div>

          <div
            style={styles.card}
            onClick={() => navigate("/assignments?filter=upcoming")}
          >
            <h3>⏳ Upcoming</h3>
            <p style={styles.statNumber}>{upcoming.length}</p>
          </div>

          <div
            style={styles.card}
            onClick={() => navigate("/assignments?filter=completed")}
          >
            <h3>✅ Completed</h3>
            <p style={styles.statNumber}>{completed.length}</p>
          </div>

          <div
            style={{ ...styles.card, border: "2px solid red" }}
            onClick={() => navigate("/assignments?filter=overdue")}
          >
            <h3>🚨 Overdue</h3>
            <p style={{ ...styles.statNumber, color: "red" }}>
              {overdue.length}
            </p>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <section style={styles.actions}>

          <h2>Quick Actions</h2>

          <div style={styles.actionButtons}>

            <button
              onClick={() => navigate("/assignments")}
              style={styles.actionBtn}
            >
              ➕ Add Assignment
            </button>

            <button
              onClick={() => navigate("/chat")}
              style={{ ...styles.actionBtn, backgroundColor: "#673AB7" }}
            >
              💬 Open Group Chat
            </button>

          </div>

        </section>

        {/* REMINDERS */}
        <section style={styles.reminderSection}>

          <h2>🔔 Reminders</h2>

          {dueToday.length === 0 ? (
  <p>No assignments due today</p>

          ) : (

            dueToday.slice(0, 5).map((item) => {

              const due = new Date(
                `${toLocalDate(item.due_date)}T${item.due_time || "23:59"}`
              );

              const today = new Date();
              const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

              return (

                <div key={item.id} style={styles.reminderCard}>

                  <strong>{item.title}</strong>

                  {/* ✅ timeZone ensures correct date display */}
                  <p>
                    📅{" "}
                    {new Date(item.due_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>

                  <p>
                    ⏰{" "}
                    {item.due_time
                      ? new Date(
                          `1970-01-01T${item.due_time}`
                        ).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "11:59 PM"}
                  </p>

                  <p>
                    Due in {diffDays} day{diffDays !== 1 ? "s" : ""}
                  </p>

                </div>

              );

            })

          )}

        </section>

      </main>
    </div>
  );
};

// ======================================================
// STYLES
// ======================================================

const styles = {

  container: {
    fontFamily: "sans-serif",
    backgroundColor: "#f4f7f6",
    minHeight: "100vh",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    background: "#3F51B5",
    color: "white",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "bold",
  },

  links: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },

  navLink: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  },

  logoutBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  main: {
    padding: "30px 40px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },

  statNumber: {
    fontSize: "35px",
    fontWeight: "bold",
  },

  actions: {
    marginTop: "40px",
  },

  actionButtons: {
    display: "flex",
    gap: "15px",
    marginTop: "15px",
  },

  actionBtn: {
    padding: "12px 20px",
    background: "#3F51B5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  reminderSection: {
    marginTop: "40px",
  },

  reminderCard: {
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "10px",
    borderLeft: "5px solid orange",
  },

};

export default Dashboard;