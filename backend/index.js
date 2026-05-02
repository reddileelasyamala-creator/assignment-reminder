const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors({
  origin: "https://assignment-reminder-chi.vercel.app"
}));
app.use(express.json());

// ---------------- ROUTES ----------------

// 1. Welcome
app.get('/', (req, res) => {
  res.send("Backend Server is Running!");
});

// ---------------- AUTH ----------------

// 2. Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, password]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(400).send("User already exists");
  }
});

// 3. Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (user.rows.length > 0) {
      res.json(user.rows[0]);
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send("Server error");
  }
});

// ---------------- ASSIGNMENTS ----------------

// 4. Get Assignments
app.get('/assignments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM assignments WHERE user_id = $1 ORDER BY due_date ASC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error fetching assignments");
  }
});

// 5. Add Assignment
app.post('/assignments', async (req, res) => {
  try {
    const { userId, title, subject, dueDate } = req.body;

    const newAssignment = await pool.query(
      "INSERT INTO assignments (user_id, title, subject, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, subject, dueDate]
    );

    res.json(newAssignment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error adding assignment");
  }
});

// 6. Delete Assignment
app.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM assignments WHERE id = $1",
      [id]
    );

    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error deleting assignment");
  }
});

// ---------------- GROUPS ----------------

// 7. Get only user's groups
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
    console.error(err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// 8. Create Group (with member added)
app.post("/groups", async (req, res) => {
  const { name, creator } = req.body;

  try {
    // 1. Create group
    const groupResult = await pool.query(
      "INSERT INTO groups (name, creator) VALUES ($1, $2) RETURNING *",
      [name, creator]
    );

    const group = groupResult.rows[0];

    // 2. Add creator as member
    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [group.id, creator]
    );

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

    // 2. Add creator as member
    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [group.rows[0].id, userId]
    );

    res.json(group.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// ---------------- MESSAGES ----------------

// 9. Get Messages
app.get('/messages/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await pool.query(
      "SELECT * FROM messages WHERE group_id = $1 ORDER BY id ASC",
      [groupId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 10. Send Message
app.post('/messages', async (req, res) => {
  try {
    const { groupId, sender, text } = req.body;

    const newMessage = await pool.query(
      "INSERT INTO messages (group_id, sender, text) VALUES ($1, $2, $3) RETURNING *",
      [groupId, sender, text]
    );

    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ---------------- SERVER ----------------

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});