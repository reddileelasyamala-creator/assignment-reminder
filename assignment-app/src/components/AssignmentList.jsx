import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import BackButton from "./BackButton";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const filter = query.get("filter");

  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    return <p>Please login</p>;
  }

  useEffect(() => {
    fetchAssignments();
  }, []);

  // FETCH ASSIGNMENTS
  const fetchAssignments = async () => {
    try {
      const res = await API.get(`/assignments/${user.id}`);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ADD ASSIGNMENT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !dueDate) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await API.post("/assignments", {
        userId: user.id,
        title,
        subject,
        dueDate,
        dueTime,
      });

      setAssignments((prev) => [...prev, res.data]);

      setTitle("");
      setSubject("");
      setDueDate("");
      setDueTime("");

    } catch (err) {
      console.error(err);
      alert("Error adding assignment");
    }
  };

  // DELETE
  const deleteAssignment = async (id) => {
    try {
      await API.delete(`/assignments/${id}`);

      setAssignments(
        assignments.filter((a) => a.id !== id)
      );

    } catch (err) {
      console.error(err);
    }
  };

  // TOGGLE COMPLETE
  const toggleComplete = async (id, currentValue) => {
    try {

      await API.put(`/assignments/${id}`, {
        completed: !currentValue,
      });

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                completed: !currentValue,
              }
            : a
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Converts any DB date (UTC timestamp or plain) to local YYYY-MM-DD
  const toLocalDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-CA");
  };

  // Today in local timezone
  const todayDate = new Date().toLocaleDateString("en-CA");

  // FILTERS
  const filteredAssignments = assignments.filter((a) => {

    const due = toLocalDate(a.due_date); // ✅ local date, not UTC slice

    if (filter === "today") {
      return due === todayDate && !a.completed;
    }

    if (filter === "upcoming") {
      return due > todayDate && !a.completed;
    }

    if (filter === "completed") {
      return a.completed;
    }

    if (filter === "overdue") {
      return due < todayDate && !a.completed;
    }

    return true;
  });

  // COUNTDOWN
  const getCountdown = (dueDate, dueTime) => {

    const now = new Date();

    // ✅ convert DB date to local YYYY-MM-DD first, then build datetime
    const localDate = toLocalDate(dueDate);
    const due = new Date(`${localDate}T${dueTime || "23:59"}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueOnlyDate = new Date(due);
    dueOnlyDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (dueOnlyDate - today) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return "Due Today";
    }

    if (due < now) {
      return "Overdue";
    }

    return `${diffDays} day(s) left`;
  };

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.nav}>
        <h2>📚 Assignment Reminder</h2>
      </nav>

      {/* BACK BUTTON */}
      <div style={{ margin: "15px 0" }}>
        <BackButton />
      </div>

      {/* FORM */}
      <section style={styles.formSection}>

        <h2>Add Assignment ➕</h2>

        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) =>
              setDueDate(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="time"
            value={dueTime}
            onChange={(e) =>
              setDueTime(e.target.value)
            }
            style={styles.input}
          />

          <button
            type="submit"
            style={styles.addButton}
          >
            Save Assignment
          </button>

        </form>

      </section>

      {/* LIST */}
      <section style={styles.listSection}>

        <h2>My Assignments</h2>

        {filteredAssignments.length === 0 ? (

          <p>No assignments found</p>

        ) : (

          <div style={styles.grid}>

            {filteredAssignments.map((item) => (

              <div
                key={item.id}
                style={{
                  ...styles.card,

                  opacity:
                    item.completed ? 0.7 : 1,

                  border:
                    !item.completed &&
                    getCountdown(
                      item.due_date,
                      item.due_time
                    ) === "Overdue"
                      ? "2px solid red"
                      : "none",
                }}
              >

                {/* TOP ROW */}
                <div style={styles.topRow}>

                  <h3>
                    {item.completed
                      ? "✅"
                      : "📌"}{" "}
                    {item.title}
                  </h3>

                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() =>
                      toggleComplete(
                        item.id,
                        item.completed
                      )
                    }
                  />

                </div>

                {/* SUBJECT */}
                <p>{item.subject}</p>

                {/* ✅ Use new Date(dateStr) directly — it's already a full ISO timestamp */}
                <p>
                  📅{" "}
                  {new Date(item.due_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>

                {/* TIME */}
                <p>
                  ⏰{" "}
                  {item.due_time
                    ? new Date(
                        `1970-01-01T${item.due_time}`
                      ).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "No Time"}
                </p>

                {/* COUNTDOWN */}
                <p
                  style={{
                    color:
                      getCountdown(
                        item.due_date,
                        item.due_time
                      ) === "Overdue"
                        ? "red"
                        : "orange",

                    fontWeight: "bold",
                  }}
                >

                  {item.completed ? (

                    "✅ Completed"

                  ) : getCountdown(
                      item.due_date,
                      item.due_time
                    ) === "Overdue" ? (

                    "🚨 Overdue"

                  ) : (

                    `⏳ ${getCountdown(
                      item.due_date,
                      item.due_time
                    )}`

                  )}

                </p>

                {/* DELETE */}
                <button
                  onClick={() =>
                    deleteAssignment(item.id)
                  }
                  style={styles.deleteBtn}
                >
                  Delete
                </button>

              </div>

            ))}

          </div>

        )}

      </section>
    </div>
  );
};

const styles = {

  container: {
    padding: "20px",
    background: "#f4f7f6",
    minHeight: "100vh",
  },

  nav: {
    background: "#3F51B5",
    color: "white",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  formSection: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },

  addButton: {
    background: "#3F51B5",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  listSection: {
    marginTop: "30px",
  },

  grid: {
    display: "grid",
    gap: "15px",
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow:
      "0 2px 5px rgba(0,0,0,0.1)",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deleteBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  },

};

export default AssignmentList;