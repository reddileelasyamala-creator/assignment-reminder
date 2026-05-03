import React, { useState, useEffect } from "react";
import API from "../api";
import BackButton from "./BackButton";

const GroupChat = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [msgText, setMsgText] = useState("");

  // NEW STATES
  const [newMemberId, setNewMemberId] = useState("");

  // 🔹 Fetch user groups
  const fetchGroups = async () => {
    try {
      const res = await API.get(`/groups/${user.id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Fetch messages (SECURE)
  const fetchMessages = async (groupId) => {
    try {
      const res = await API.get(
        `/messages/${groupId}?userId=${user.id}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  // 🔹 Create group
  const handleCreate = async (e) => {
    e.preventDefault();

    if (newGroupName.trim()) {
      try {
        await API.post("/groups", {
          name: newGroupName,
          creator: user.id
        });

        setNewGroupName("");
        fetchGroups();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 🔹 Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (msgText.trim() && selectedGroup) {
      await API.post("/messages", {
        groupId: selectedGroup.id,
        sender: user.username,
        text: msgText
      });

      setMsgText("");
      fetchMessages(selectedGroup.id);
    }
  };

  // 🔹 ADD MEMBER
  const addMember = async () => {
    if (!newMemberId) return;

    try {
      await API.post(`/groups/${selectedGroup.id}/add-member`, {
        userId: Number(newMemberId)
      });

      alert("User added!");
      setNewMemberId("");
    } catch (err) {
      alert(err.response?.data?.message || "Error adding member");
    }
  };

  // 🔹 DELETE GROUP
  const deleteGroup = async (groupId) => {
    try {
      await API.delete(`/groups/${groupId}`, {
        data: { userId: user.id }
      });

      alert("Group deleted");
      fetchGroups();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // ---------------- UI ----------------

  // GROUP LIST VIEW
  if (!selectedGroup) {
    return (
      <div style={styles.container}>
        <BackButton />
        <h2>Groups 👥</h2>

        <form onSubmit={handleCreate} style={styles.createBox}>
          <input
            style={styles.input}
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button style={styles.btn}>Create</button>
        </form>

        <div style={styles.groupGrid}>
          {groups.map((g) => (
            <div key={g.id} style={styles.groupCard}>
              <h4>{g.name}</h4>
              <small>Creator: {g.creator}</small>

              <button onClick={() => setSelectedGroup(g)}>
                Open
              </button>

              <button onClick={() => deleteGroup(g.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CHAT VIEW
  return (
    <div style={styles.container}>
      <button onClick={() => setSelectedGroup(null)}>⬅ Back</button>

      <div style={styles.chatBox}>
        <div style={styles.chatHeader}>
          {selectedGroup.name}
        </div>

        {/* ADD MEMBER UI */}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="number"
            placeholder="Enter User ID"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
          />
          <button onClick={addMember}>Add Member</button>
        </div>

        {/* MESSAGES */}
        <div style={styles.msgList}>
          {messages.map((m) => (
            <div key={m.id}>
              <b>{m.sender}</b>: {m.text}
            </div>
          ))}
        </div>

        {/* SEND MESSAGE */}
        <form onSubmit={sendMessage}>
          <input
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type message..."
          />
          <button>Send</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "20px" },
  createBox: { display: "flex", gap: "10px" },
  groupGrid: { display: "grid", gap: "10px", marginTop: "20px" },
  groupCard: {
    padding: "10px",
    border: "1px solid #ddd",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  chatBox: { border: "1px solid #ddd", marginTop: "10px", padding: "10px" },
  msgList: { marginBottom: "10px" }
};

export default GroupChat;