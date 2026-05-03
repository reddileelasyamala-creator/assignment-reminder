const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://assignment-reminder-chi.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// ---------------- ROOT ----------------
app.get('/', (req, res) => {
  res.send("Backend Server is Running!");
});

// ---------------- AUTH ----------------

// REGISTER (FIXED)
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔥 CHECK FIRST
    const check = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, password]
    );

    res.json(newUser.rows[0]);

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).send("Register error");
  }
});

// LOGIN (FIXED)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (user.rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    res.json(user.rows[0]);

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send("Server error");
  }
});

// ---------------- ASSIGNMENTS ----------------

app.get('/assignments/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM assignments WHERE user_id = $1 ORDER BY due_date ASC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching assignments");
  }
});

app.post('/assignments', async (req, res) => {
  const { userId, title, subject, dueDate } = req.body;

  try {
    const newAssignment = await pool.query(
      "INSERT INTO assignments (user_id, title, subject, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, subject, dueDate]
    );

    res.json(newAssignment.rows[0]);
  } catch (err) {
    res.status(500).send("Error adding assignment");
  }
});

app.delete('/assignments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM assignments WHERE id = $1", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).send("Error deleting");
  }
});

// ---------------- GROUPS ----------------

app.get("/groups/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT g.*
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Group fetch error");
  }
});

app.post("/groups", async (req, res) => {
  const { name, creator } = req.body;

  try {
    const groupResult = await pool.query(
      "INSERT INTO groups (name, creator) VALUES ($1, $2) RETURNING *",
      [name, creator]
    );

    const group = groupResult.rows[0];

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [group.id, creator]
    );

    res.json(group);
  } catch (err) {
    res.status(500).send("Group create error");
  }
});

// ADD MEMBER
app.post("/groups/:groupId/add-member", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM group_members WHERE group_id=$1 AND user_id=$2",
      [groupId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already a member" });
    }

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [groupId, userId]
    );

    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).send("Error adding member");
  }
});

// DELETE GROUP
app.delete("/groups/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const g = await pool.query("SELECT * FROM groups WHERE id=$1", [id]);

    if (!g.rows.length) return res.status(404).send("Not found");

    if (String(g.rows[0].creator) !== String(userId)) {
      return res.status(403).send("Only creator can delete");
    }

    await pool.query("DELETE FROM messages WHERE group_id=$1", [id]);
    await pool.query("DELETE FROM group_members WHERE group_id=$1", [id]);
    await pool.query("DELETE FROM groups WHERE id=$1", [id]);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).send("Delete error");
  }
});

// ---------------- MESSAGES ----------------

app.get('/messages/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE group_id=$1 ORDER BY id ASC",
      [groupId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Message error");
  }
});

app.post('/messages', async (req, res) => {
  const { groupId, sender, text } = req.body;

  try {
    const newMessage = await pool.query(
      "INSERT INTO messages (group_id, sender, text) VALUES ($1,$2,$3) RETURNING *",
      [groupId, sender, text]
    );

    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).send("Send error");
  }
});

// ---------------- SERVER ----------------

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});