import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  searchUsers,
  createDirectConversation,
  markAsSeen
} from "../api/axios";
import socket from "../socket";
 
export default function Chat() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
 
  // ─── New Conversation Modal ────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const searchTimeoutRef = useRef(null);
 
  // ─── Fetch Conversations ───────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.conversations);
    } catch (err) {
      setError("Failed to load conversations.");
    } finally {
      setLoadingConvos(false);
    }
  };
 
  useEffect(() => {
    fetchConversations();
  }, []);
 
  // ─── Socket Connection ─────────────────────────────────
  useEffect(() => {
    if (!user) return;
 
    const onConnect = () => {
      socket.emit("join_user_room", user.id);
    };
 
    const onDisconnect = () => console.log("Socket disconnected");
 
    if (socket.connected) {
      onConnect();
    } else {
      socket.on("connect", onConnect);
    }
 
    socket.on("disconnect", onDisconnect);
 
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [user]);
 
  // ─── Request Notification Permission ──────────────────
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
 
  // ─── Fetch Messages ────────────────────────────────────
  const fetchMessages = async (conversationId) => {
    try {
      const res = await getMessages(conversationId);
      setMessages(res.data.messages);
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };
 
  // ─── Select Conversation ───────────────────────────────
  const handleSelectConvo = (convo) => {
    if (selectedConvo) {
      socket.emit("leave_room", selectedConvo._id);
    }
    setSelectedConvo(convo);
    setMessages([]);
    setTypingUser(null);
    setLoadingMessages(true);
    fetchMessages(convo._id);
    markAsSeen(convo._id);
    socket.emit("join_room", convo._id);
  };
 
  // ─── Socket: Receive Message ───────────────────────────
  useEffect(() => {
    socket.on("receive_message", (message) => {
      if (message.conversation === selectedConvo?._id) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        setTypingUser(null);
      }
      fetchConversations();
    });
 
    return () => socket.off("receive_message");
  }, [selectedConvo]);
 
  // ─── Socket: Typing Indicators ─────────────────────────
  useEffect(() => {
    socket.on("typing", ({ username }) => {
      setTypingUser(username);
    });
 
    socket.on("stop_typing", () => {
      setTypingUser(null);
    });
 
    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);
 
  // ─── Socket: Notifications ─────────────────────────────
  useEffect(() => {
    socket.on("new_notification", ({ conversationId, message }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: message }
            : c
        )
      );
 
      if (selectedConvo?._id === conversationId) return;
 
      if (Notification.permission === "granted") {
        new Notification(message.sender?.username, {
          body: message.text,
        });
      }
    });
 
    return () => socket.off("new_notification");
  }, [selectedConvo]);
 
  // ─── Auto Scroll ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);
 
  // ─── Handle Input + Typing Emit ───────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
 
    if (!selectedConvo) return;
 
    socket.emit("typing", {
      conversationId: selectedConvo._id,
      username: user.username,
    });
 
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: selectedConvo._id });
    }, 1500);
  };
 
  // ─── Send Message ──────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConvo) return;
 
    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stop_typing", { conversationId: selectedConvo._id });
 
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      text: text.trim(),
      sender: { _id: user.id, username: user.username },
      conversation: selectedConvo._id,
      createdAt: new Date().toISOString(),
    };
 
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
 
    try {
      const res = await sendMessage(selectedConvo._id, optimisticMsg.text);
      const newMessage = res.data.message;
 
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? newMessage : m))
      );
 
      fetchConversations();
 
      const recipientIds = selectedConvo.members
        .filter((m) => m._id !== user.id)
        .map((m) => m._id);
 
      socket.emit("send_message", {
        _id: newMessage._id,
        text: newMessage.text,
        sender: newMessage.sender,
        conversation: selectedConvo._id,
        recipientIds,
        createdAt: newMessage.createdAt,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setText(optimisticMsg.text);
      setError("Failed to send message.");
    }
  };
 
  // ─── Search Users ──────────────────────────────────────
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
 
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
 
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsers(q);
        setSearchResults(res.data.users);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };
 
  // ─── Start New Conversation ────────────────────────────
  const handleStartChat = async (userId) => {
    setStartingChat(true);
    try {
      const res = await createDirectConversation(userId);
      const newConvo = res.data.chat;
      await fetchConversations();
      setShowModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setTimeout(() => {
        setConversations((prev) => {
          const found = prev.find((c) => c._id === newConvo.id);
          if (found) handleSelectConvo(found);
          return prev;
        });
      }, 500);
    } catch (err) {
      setError("Failed to start conversation.");
    } finally {
      setStartingChat(false);
    }
  };
 
  const closeModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };
 
  // ─── Helpers ───────────────────────────────────────────
  const getConvoName = (convo) => {
    if (convo.isGroup) return convo.name;
    const other = convo.members?.find((m) => m._id !== user.id);
    return other?.username || "Unknown";
  };
 
  const getLastMessage = (convo) => {
    if (!convo.lastMessage?.text) return "No messages yet";
    const label =
      convo.lastMessage.sender?.username === user.username
        ? "You"
        : convo.lastMessage.sender?.username;
    return `${label}: ${convo.lastMessage.text}`;
  };
 
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
 
  const isOwn = (msg) => msg.sender?._id === user.id;
  const getInitial = (convo) => getConvoName(convo)?.[0]?.toUpperCase() || "?";
 
  // ─── Color Tokens ──────────────────────────────────────
  const brand = {
    bg: "#3b2f8f",
    bgLight: "#eeebff",
    border: "#c4b8f7",
    accent: "#6c5ce7",
    text: "#b8aef5",
  };
 
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#f5f4fa" }}>
 
      {/* ─── New Conversation Modal ───────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">New Message</h2>
              <button
                onClick={closeModal}
                className="text-gray-300 hover:text-gray-500 text-lg font-medium transition"
              >
                x
              </button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or username..."
              autoFocus
              className="border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
              style={{ borderColor: brand.border }}
            />
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {searching ? (
                <p className="text-sm text-gray-300 text-center py-4">Searching...</p>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <p className="text-sm text-gray-300 text-center py-4">No users found.</p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleStartChat(u._id)}
                    disabled={startingChat}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition text-left disabled:opacity-50"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                      style={{ background: brand.bg }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">@{u.username}</p>
                      <p className="text-xs text-gray-400">{u.firstName} {u.lastName}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* ─── Sidebar ─────────────────────────────────── */}
      <div className="w-72 flex flex-col shrink-0 bg-white overflow-hidden" style={{ borderRight: "0.5px solid #e2e0f0" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: brand.bg }}>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">Messenger</h1>
            <p className="text-xs mt-0.5" style={{ color: brand.text }}>@{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            Logout
          </button>
        </div>
 
        <div className="px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Conversations
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-white text-xs font-medium px-3 py-1 rounded-full transition hover:opacity-90"
            style={{ background: brand.bg }}
          >
            + New
          </button>
        </div>
 
        <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
          {loadingConvos ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-300">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-300">No conversations yet.</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo._id}
                onClick={() => handleSelectConvo(convo)}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition"
                style={
                  selectedConvo?._id === convo._id
                    ? { background: brand.bgLight, border: `0.5px solid ${brand.border}` }
                    : { border: "0.5px solid transparent" }
                }
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                  style={{ background: brand.bg }}
                >
                  {getInitial(convo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getConvoName(convo)}
                    </p>
                    <span className="text-xs text-gray-300 ml-1 shrink-0">
                      {formatTime(convo.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-gray-400 truncate">
                      {getLastMessage(convo)}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span
                        className="text-xs font-medium rounded-full px-2 py-0.5 shrink-0"
                        style={{ background: brand.bg, color: "#d4ccff" }}
                      >
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
 
      {/* ─── Main Chat Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConvo ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 bg-white flex items-center gap-3" style={{ borderBottom: "0.5px solid #e2e0f0" }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                style={{ background: brand.bg }}
              >
                {getInitial(selectedConvo)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {getConvoName(selectedConvo)}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedConvo.isGroup
                    ? `${selectedConvo.members?.length} members`
                    : "Direct message"}
                </p>
              </div>
            </div>
 
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-300">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full flex-col gap-2">
                  <p className="text-sm text-gray-400 font-medium">
                    Say hello to {getConvoName(selectedConvo)}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex flex-col gap-1 max-w-sm ${isOwn(msg) ? "self-end items-end" : "self-start items-start"}`}
                  >
                    {selectedConvo.isGroup && !isOwn(msg) && (
                      <p className="text-xs font-medium px-1" style={{ color: brand.accent }}>
                        {msg.sender?.username}
                      </p>
                    )}
                    <div
                      className="px-4 py-2.5 text-sm leading-relaxed"
                      style={
                        isOwn(msg)
                          ? {
                              background: brand.bg,
                              color: "#fff",
                              borderRadius: "16px 16px 4px 16px",
                            }
                          : {
                              background: "#fff",
                              color: "#1a1a2e",
                              border: "0.5px solid #e2e0f0",
                              borderRadius: "16px 16px 16px 4px",
                            }
                      }
                    >
                      {msg.text}
                    </div>
                    <p className="text-xs text-gray-300 px-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                ))
              )}
 
              {/* Typing Indicator */}
              {typingUser && (
                <div className="self-start flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-xs shrink-0"
                    style={{ background: brand.bg }}
                  >
                    {typingUser[0]?.toUpperCase()}
                  </div>
                  <div
                    className="px-4 py-2.5 flex items-center gap-1.5"
                    style={{
                      background: "#fff",
                      border: "0.5px solid #e2e0f0",
                      borderRadius: "16px 16px 16px 4px",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: brand.accent, animation: "typingBounce 1.2s infinite ease-in-out" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: brand.accent, animation: "typingBounce 1.2s infinite ease-in-out 0.2s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: brand.accent, animation: "typingBounce 1.2s infinite ease-in-out 0.4s" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{typingUser} is typing</span>
                </div>
              )}
 
              <div ref={messagesEndRef} />
            </div>
 
            {error && (
              <p className="text-xs text-red-400 text-center mb-2">{error}</p>
            )}
 
            {/* Input */}
            <form
              onSubmit={handleSend}
              className="px-5 py-3 bg-white flex items-center gap-3"
              style={{ borderTop: "0.5px solid #e2e0f0" }}
            >
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                placeholder="Type a message..."
                className="flex-1 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
                style={{ background: "#f5f4fa", border: `0.5px solid #e2e0f0` }}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="text-white font-medium text-sm px-5 py-2.5 rounded-full transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: brand.bg }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-lg font-semibold text-gray-700">Your Messages</p>
            <p className="text-sm text-gray-400">
              Pick a conversation or start a new one.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="text-white font-medium text-sm px-5 py-2.5 rounded-full transition hover:opacity-90 mt-1"
              style={{ background: brand.bg }}
            >
              + New Conversation
            </button>
          </div>
        )}
      </div>
 
      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}