import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";
import API from "../api";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");

  const user = JSON.parse(sessionStorage.getItem("user"));

  // 🚨 Important safety check
  if (!user) {
    alert("User not logged in");
    return <p>Please login</p>;
  }

  // 🔹 Fetch assignments
  const fetchAssignments = async () => {
    try {
      const res = await API.get(`/assignments/${user.id}`);
      console.log("Assignments:", res.data); // 🔍 debug
      setAssignments(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 🔹 Add assignment
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Button clicked"); // 🔍 debug

    if (!title || !dueDate) {
      alert("Fill Title and Due Date");
      return;
    }

    try {
      const res = await API.post("/assignments", {
        userId: user.id,
        title,
        subject,
        dueDate,
      });

      console.log("Added:", res.data); // 🔍 debug

      setTitle("");
      setSubject("");
      setDueDate("");

      fetchAssignments();
    } catch (err) {
      console.error("Add Error:", err);
      alert("Error adding assignment");
    }
  };

  // 🔹 Delete assignment
  const deleteAssignment = async (id) => {
    try {
      await API.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <BackButton />

      <section style={styles.formSection}>
        <h3>Add New Assignment ➕</h3>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={styles.input}
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.addButton}>
            Save Assignment
          </button>
        </form>
      </section>

      <hr style={styles.divider} />

      <section>
        <h2>My Assignments</h2>

        {assignments.length === 0 ? (
          <p>No assignments found</p>
        ) : (
          <div style={styles.grid}>
            {assignments.map((item) => (
              <div key={item.id} style={styles.card}>
                <h4>{item.title}</h4>
                <small>{item.subject}</small>
                <p>📅 {item.due_date}</p>

                <button
                  onClick={() => deleteAssignment(item.id)}
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
  container: { padding: "20px", maxWidth: "800px", margin: "auto" },
  formSection: { background: "#f9f9f9", padding: "20px", borderRadius: "10px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ddd" },
  addButton: {
    padding: "10px",
    background: "#3F51B5",
    color: "white",
    border: "none",
    cursor: "pointer"
  },
  divider: { margin: "20px 0" },
  grid: { display: "grid", gap: "10px" },
  card: {
    background: "white",
    padding: "10px",
    borderRadius: "5px",
  },
  deleteBtn: { background: "red", color: "white", padding: "5px" },
};

export default AssignmentList;