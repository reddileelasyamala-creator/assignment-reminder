require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

// ---------------- CORS ----------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://assignment-reminder-chi.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ---------------- ROOT ----------------
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ======================================================
// AUTH
// ======================================================

// REGISTER
app.post("/register", async (req, res) => {
  console.log("REGISTER BODY:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password required",
    });
  }

  try {
    // Check existing user
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Insert user
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1,$2)",
      [username, password]
    );

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // ✅ Clean response
    res.json({
      id: user.id,
      username: user.username,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// ======================================================
// GROUPS
// ======================================================

// GET USER GROUPS
app.get("/groups/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT g.*
      FROM groups g
      JOIN group_members gm
      ON g.id = gm.group_id
      WHERE gm.user_id = $1
      `,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Group fetch error",
    });
  }
});

// CREATE GROUP
app.post("/groups", async (req, res) => {
  const { name, creator } = req.body;

  if (!name || !creator) {
    return res.status(400).json({
      message: "Missing fields",
    });
  }

  try {
    // Create group
    const group = await pool.query(
      `
      INSERT INTO groups (name, creator)
      VALUES ($1,$2)
      RETURNING *
      `,
      [name, creator]
    );

    // Add creator to members
    await pool.query(
      `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1,$2)
      `,
      [group.rows[0].id, creator]
    );

    res.json(group.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Group create error",
    });
  }
});

// ADD MEMBER
app.post("/groups/add-member", async (req, res) => {
  const { groupId, username } = req.body;

  try {
    const userRes = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userId = userRes.rows[0].id;

    // Check existing member
    const check = await pool.query(
      `
      SELECT * FROM group_members
      WHERE group_id=$1 AND user_id=$2
      `,
      [groupId, userId]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        message: "Already in group",
      });
    }

    await pool.query(
      `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1,$2)
      `,
      [groupId, userId]
    );

    res.json({
      message: "Member added",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Add member error",
    });
  }
});

// GET GROUP MEMBERS
app.get("/groups/:groupId/members", async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT users.id, users.username
      FROM group_members
      JOIN users
      ON group_members.user_id = users.id
      WHERE group_members.group_id = $1
      `,
      [groupId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Fetch members error",
    });
  }
});

// DELETE GROUP
app.delete("/groups/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const group = await pool.query(
      "SELECT * FROM groups WHERE id=$1",
      [id]
    );

    if (!group.rows.length) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    if (String(group.rows[0].creator) !== String(userId)) {
      return res.status(403).json({
        message: "Only creator can delete",
      });
    }

    await pool.query(
      "DELETE FROM messages WHERE group_id=$1",
      [id]
    );

    await pool.query(
      "DELETE FROM group_members WHERE group_id=$1",
      [id]
    );

    await pool.query(
      "DELETE FROM groups WHERE id=$1",
      [id]
    );

    res.json({
      message: "Group deleted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Delete error",
    });
  }
});

// LEAVE GROUP
app.delete("/groups/:id/leave", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    await pool.query(
      `
      DELETE FROM group_members
      WHERE group_id=$1 AND user_id=$2
      `,
      [id, userId]
    );

    res.json({
      message: "Left group",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Leave error",
    });
  }
});

// ======================================================
// MESSAGES
// ======================================================

// GET UNREAD COUNT
app.get("/messages/:groupId/unread/:userId", async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const readRes = await pool.query(
      `SELECT last_read_message_id FROM message_reads
       WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );

    const lastReadId = readRes.rows[0]?.last_read_message_id || 0;

    const unreadRes = await pool.query(
      `SELECT COUNT(*) FROM messages
       WHERE group_id=$1 AND id > $2`,
      [groupId, lastReadId]
    );

    res.json({ unread: parseInt(unreadRes.rows[0].count) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching unread count" });
  }
});

// MARK AS READ
app.post("/messages/:groupId/read/:userId", async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const lastMsg = await pool.query(
      `SELECT id FROM messages WHERE group_id=$1 ORDER BY id DESC LIMIT 1`,
      [groupId]
    );

    if (lastMsg.rows.length === 0) {
      return res.json({ message: "No messages" });
    }

    const lastId = lastMsg.rows[0].id;

    await pool.query(
      `INSERT INTO message_reads (user_id, group_id, last_read_message_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, group_id)
       DO UPDATE SET last_read_message_id=$3`,
      [userId, groupId, lastId]
    );

    res.json({ message: "Marked as read" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error marking read" });
  }
});

// GET MESSAGES
app.get("/messages/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE group_id=$1
      ORDER BY id ASC
      `,
      [groupId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Fetch messages error",
    });
  }
});

// SEND MESSAGE
app.post("/messages", async (req, res) => {
  const { groupId, sender, text } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO messages (group_id, sender, text)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [groupId, sender, text]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Send message error",
    });
  }
});

// ======================================================
// ASSIGNMENTS
// ======================================================

// CREATE ASSIGNMENT
app.post("/assignments", async (req, res) => {
  const { userId, title, subject, dueDate } = req.body;

  if (!userId || !title) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }
  try {
    const {
      userId,
      title,
      subject,
      dueDate,
      dueTime,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO assignments
      (user_id, title, subject, due_date, due_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        userId,
        title,
        subject,
        dueDate,
        dueTime,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error adding assignment",
    });
  }
});

// GET ASSIGNMENTS
app.get("/assignments/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM assignments
      WHERE user_id=$1
      ORDER BY id DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ASSIGNMENTS ERROR:", err);

    res.status(500).json({
      message: "Fetch assignments error",
    });
  }
});

// UPDATE COMPLETED STATUS
app.put("/assignments/:id", async (req, res) => {
  try {
    const { completed } = req.body;

    const result = await pool.query(
      `
      UPDATE assignments
      SET completed=$1
      WHERE id=$2
      RETURNING *
      `,
      [completed, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Update assignment error",
    });
  }
});

// DELETE ASSIGNMENT
app.delete("/assignments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM assignments WHERE id=$1",
      [id]
    );

    res.json({
      success: true,
      message: "Assignment deleted",
    });
  } catch (err) {
    console.error("DELETE ASSIGNMENT ERROR:", err);

    res.status(500).json({
      message: "Delete assignment error",
    });
  }
});

// ======================================================
// SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});