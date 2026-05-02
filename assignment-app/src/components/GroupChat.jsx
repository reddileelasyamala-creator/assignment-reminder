import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";
import API from "../api";

const GroupChat = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [msgText, setMsgText] = useState("");

  // 🔒 Safety: user check
  if (!user) {
    return <p>Please login first</p>;
  }

  // 🔹 Fetch groups
  const fetchGroups = async () => {
    try {
      const res = await API.get(`/groups/${user.id}`);
      console.log("Groups:", res.data);
      setGroups(res.data);
    } catch (err) {
      console.error("Fetch Groups Error:", err);
    }
  };

  // 🔹 Fetch messages
  const fetchMessages = async (groupId) => {
    try {
      const res = await API.get(`/messages/${groupId}`);
      console.log("Messages:", res.data);
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch Messages Error:", err);
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

    console.log("Create clicked");

    if (!newGroupName.trim()) {
      alert("Enter group name");
      return;
    }

    try {
      const res = await API.post("/groups", {
        name: newGroupName,
        creator: user.username,
        userId: user.id, 
      });

      console.log("Group created:", res.data);

      setNewGroupName("");
      fetchGroups();
    } catch (err) {
      console.error("Create Group Error:", err);
      alert("Error creating group");
    }
  };

  // 🔹 Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    console.log("Send clicked");

    if (!msgText.trim()) {
      alert("Enter message");
      return;
    }

    try {
      const res = await API.post("/messages", {
        groupId: selectedGroup.id,
        sender: user.username,
        text: msgText,
      });

      console.log("Message sent:", res.data);

      setMsgText("");
      fetchMessages(selectedGroup.id);
    } catch (err) {
      console.error("Send Message Error:", err);
      alert("Error sending message");
    }
  };

  // 🔹 GROUP LIST SCREEN
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
          <button type="submit" style={styles.btn}>Create</button>
        </form>

        <div style={styles.groupGrid}>
          {groups.map((g) => (
            <div
              key={g.id}
              style={styles.groupCard}
              onClick={() => setSelectedGroup(g)}
            >
              <h4>{g.name}</h4>
              <small>{g.creator}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🔹 CHAT SCREEN
  return (
    <div style={styles.container}>
      <button onClick={() => setSelectedGroup(null)} style={styles.backBtn}>
        ⬅ Exit {selectedGroup.name}
      </button>

      <div style={styles.chatBox}>
        <div style={styles.chatHeader}>{selectedGroup.name} Chat</div>

        <div style={styles.msgList}>
          {messages.map((m) => (
            <div key={m.id} style={styles.bubbleWrapper}>
              <b>{m.sender}</b>
              <div style={styles.bubble}>{m.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} style={styles.inputArea}>
          <input
            style={styles.chatInput}
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type message..."
          />
          <button type="submit" style={styles.btn}>Send</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "20px", maxWidth: "600px", margin: "auto" },
  createBox: { display: "flex", gap: "10px", marginBottom: "20px" },
  groupGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  groupCard: { padding: "15px", border: "1px solid #ddd", cursor: "pointer", background: "#fff" },
  chatBox: { border: "1px solid #ddd", height: "70vh", display: "flex", flexDirection: "column" },
  chatHeader: { padding: "10px", background: "#3F51B5", color: "white", textAlign: "center" },
  msgList: { flex: 1, overflowY: "auto", padding: "10px" },
  bubbleWrapper: { marginBottom: "10px" },
  bubble: { background: "#eee", padding: "8px", borderRadius: "5px" },
  inputArea: { display: "flex", padding: "10px" },
  chatInput: { flex: 1, padding: "8px" },
  btn: { padding: "8px", background: "#3F51B5", color: "white", border: "none", cursor: "pointer" },
  input: { flex: 1, padding: "8px" },
  backBtn: { marginBottom: "10px" }
};

export default GroupChat;