import React, { useState, useEffect } from "react";
import API from "../api";
import BackButton from "./BackButton";

const GroupChat = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [msgText, setMsgText] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  // FETCH GROUPS
  const fetchGroups = async () => {
    try {
      const res = await API.get(`/groups/${user.id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH MESSAGES
  const fetchMessages = async (id) => {
    try {
      const res = await API.get(`/messages/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
  if (!selectedGroup) return;

  const interval = setInterval(async () => {
    await fetchMessages(selectedGroup.id);
    await API.post(`/messages/${selectedGroup.id}/read/${user.id}`);
  }, 5000);

  return () => clearInterval(interval);
}, [selectedGroup]);



  const fetchMembers = async (groupId) => {
  try {
    const res = await API.get(
      `/groups/${groupId}/members`
    );

    setGroupMembers(res.data);

  } catch (err) {
    console.error(err);
  }
};

  // CREATE GROUP
  const createGroup = async (e) => {
    e.preventDefault();

    if (!newGroupName) return;

    try {
      await API.post("/groups", {
        name: newGroupName,
        creator: user.id,
      });

      setNewGroupName("");
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  // SEND MESSAGE
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!msgText) return;

    try {
      await API.post("/messages", {
        groupId: selectedGroup.id,
        sender: user.username,
        text: msgText,
      });

      setMsgText("");
      fetchMessages(selectedGroup.id);
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE GROUP
  const deleteGroup = async (id) => {
    try {
      await API.delete(`/groups/${id}?userId=${user.id}`);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // LEAVE GROUP
  const leaveGroup = async (id) => {
    try {
      await API.delete(`/groups/${id}/leave?userId=${user.id}`);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert("Leave failed");
    }
  };

  // INVITE MEMBER
  const inviteMember = async (groupId) => {
    if (!inviteUsername) {
      alert("Enter username");
      return;
    }

    try {
      await API.post("/groups/add-member", {
        groupId,
        username: inviteUsername,
      });

      alert("Member added");
      setInviteUsername("");
    } catch (err) {
      console.error(err);
      alert("Invite failed");
    }
  };

  // =========================
  // GROUP LIST PAGE
  // =========================

  if (!selectedGroup) {
    return (
      <div style={styles.container}>
        <BackButton />

        <div style={styles.cardWrapper}>
          <h2 style={styles.heading}>Groups 👥</h2>

          <form onSubmit={createGroup} style={styles.formRow}>
            <input
              type="text"
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={styles.input}
            />

            <button type="submit" style={styles.createBtn}>
              Create
            </button>
          </form>

          {groups.map((g) => (
            <div key={g.id} style={styles.groupCard}>
              <div>
                <h3>{g.name}</h3>
                <p>Creator: {g.creator}</p>

                <div style={styles.inviteRow}>
                  <input
                    type="text"
                    placeholder="Invite username"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    style={styles.inviteInput}
                  />

                  <button
                    onClick={() => inviteMember(g.id)}
                    style={styles.inviteBtn}
                  >
                    Invite
                  </button>
                </div>
              </div>

              <div style={styles.actions}>
                <button
                  style={styles.openBtn}
                  onClick={async () => {
  setSelectedGroup(g);
  fetchMessages(g.id);
  fetchMembers(g.id);
  // ✅ mark messages as read
  await API.post(`/messages/${g.id}/read/${user.id}`);
}}
                >
                  Open
                </button>

                {Number(g.creator) === Number(user.id) ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteGroup(g.id)}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    style={styles.leaveBtn}
                    onClick={() => leaveGroup(g.id)}
                  >
                    Leave
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================
  // CHAT PAGE
  // =========================

  return (
    <div style={styles.container}>
      <BackButton />

      <div style={styles.chatWrapper}>
        <button
          style={styles.backInsideBtn}
          onClick={() => setSelectedGroup(null)}
        >
          ← Back to Groups
        </button>

        <h2>{selectedGroup.name}</h2>
        <div style={styles.membersBox}>

  <button
    style={styles.membersBtn}
    onClick={() => setShowMembers(!showMembers)}
  >
    👥 Members
  </button>

  {showMembers && (
    <div style={styles.membersList}>
      {groupMembers.map((member) => (
        <span key={member.id} style={styles.memberTag}>
          {member.username}
        </span>
      ))}
    </div>
  )}

</div>

        <div style={styles.chatBox}>
          {messages.map((m) => (
            <div key={m.id} style={styles.message}>
              <b>{m.sender}</b>: {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} style={styles.formRow}>
          <input
            type="text"
            placeholder="Type message..."
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.sendBtn}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    background: "#f5f7fb",
    minHeight: "100vh",
  },

  cardWrapper: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    maxWidth: "850px",
    margin: "20px auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  heading: {
    marginBottom: "20px",
  },

  formRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  createBtn: {
    background: "#5b5ce2",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  groupCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderRadius: "10px",
    background: "#fafafa",
    marginTop: "15px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  openBtn: {
    background: "#4285f4",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  leaveBtn: {
    background: "#ff9800",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  inviteRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },

  inviteInput: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  inviteBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  chatWrapper: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    maxWidth: "850px",
    margin: "20px auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  chatBox: {
    background: "#f9f9f9",
    padding: "15px",
    borderRadius: "10px",
    height: "350px",
    overflowY: "auto",
    marginBottom: "20px",
  },

  message: {
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    marginBottom: "10px",
  },

  sendBtn: {
    background: "#5b5ce2",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  backInsideBtn: {
    marginBottom: "15px",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    background: "#ddd",
    cursor: "pointer",
  },

  membersBox: {
  marginBottom: "20px",
},

membersList: {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
},

memberTag: {
  background: "#e0e7ff",
  padding: "8px 12px",
  borderRadius: "20px",
  fontSize: "14px",
},
membersBtn: {
  background: "#5b5ce2",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  marginBottom: "10px",
},
};

export default GroupChat;