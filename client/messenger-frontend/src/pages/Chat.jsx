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
  const messagesEndRef = useRef(null);

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
    setSelectedConvo(convo);
    setMessages([]);
    setLoadingMessages(true);
    fetchMessages(convo._id);
    markAsSeen(convo._id);
  };

  // ─── Socket.IO ─────────────────────────────────────────
  useEffect(() => {
    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      // Only add message if it belongs to the selected conversation
      if (message.conversation === selectedConvo?._id) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.find((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      // Always refresh conversations to update last message & unread count
      fetchConversations();
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedConvo]);

  // ─── Auto Scroll ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Send Message ──────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConvo) return;
    try {
      const res = await sendMessage(selectedConvo._id, text.trim());
      const newMessage = res.data.message;
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
      fetchConversations();
      socket.emit("send_message", newMessage);
    } catch (err) {
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
      // find the full convo from list and select it
      setShowModal(false);
      setSearchQuery("");
      setSearchResults([]);
      // Select after conversations reload
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

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#fff5f0" }}>

      {/* ─── New Conversation Modal ───────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-800">New Message</h2>
              <button
                onClick={closeModal}
                className="text-gray-300 hover:text-gray-500 text-xl font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or username..."
              autoFocus
              className="border-2 border-orange-100 bg-orange-50 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition"
            />

            {/* Results */}
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
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-orange-50 transition text-left disabled:opacity-50"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">@{u.username}</p>
                      <p className="text-xs text-gray-400">
                        {u.firstName} {u.lastName}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─────────────────────────────────── */}
      <div className="w-80 flex flex-col shrink-0 bg-white shadow-lg rounded-r-3xl overflow-hidden">

        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
        >
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">💬 Messenger</h1>
            <p className="text-orange-100 text-xs mt-0.5">@{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-full transition"
          >
            Logout
          </button>
        </div>

        {/* Conversations Label + New Button */}
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Conversations
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow transition hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
          >
            + New
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1">
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
                className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition ${
                  selectedConvo?._id === convo._id
                    ? "bg-orange-50 border-2 border-orange-300"
                    : "hover:bg-gray-50 border-2 border-transparent"
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
                >
                  {getInitial(convo)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800 truncate">
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
                        className="text-white text-xs font-bold rounded-full px-2 py-0.5 shrink-0"
                        style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
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
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
              >
                {getInitial(selectedConvo)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800">
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
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-300">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full flex-col gap-2">
                  <p className="text-3xl">👋</p>
                  <p className="text-sm text-gray-400 font-medium">
                    Say hello to {getConvoName(selectedConvo)}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex flex-col gap-1 max-w-sm ${
                      isOwn(msg) ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    {selectedConvo.isGroup && !isOwn(msg) && (
                      <p className="text-xs font-semibold px-1" style={{ color: "#ff8e53" }}>
                        {msg.sender?.username}
                      </p>
                    )}
                    <div
                      className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm ${
                        isOwn(msg)
                          ? "text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm"
                      }`}
                      style={
                        isOwn(msg)
                          ? { background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }
                          : {}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 text-center mb-2">{error}</p>
            )}

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="px-6 py-4 bg-white shadow-inner flex items-center gap-3"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-2 border-orange-100 bg-orange-50 rounded-full px-5 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="text-white font-bold text-sm px-5 py-3 rounded-full shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
              >
                Send 🚀
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">💬</div>
            <p className="text-xl font-extrabold text-gray-700">Your Messages</p>
            <p className="text-sm text-gray-400">
              Pick a conversation or start a new one!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="text-white font-bold text-sm px-6 py-3 rounded-full shadow-md transition hover:scale-105 active:scale-95 mt-2"
              style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
            >
              + New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}