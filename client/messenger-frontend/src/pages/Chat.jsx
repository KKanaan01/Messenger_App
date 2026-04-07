import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getConversations, getMessages, sendMessage } from "../api/axios";

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
  const pollingRef = useRef(null);

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

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchMessages(convo._id);
      fetchConversations();
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
      fetchConversations();
    } catch (err) {
      setError("Failed to send message.");
    }
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
      convo.lastMessage.sender?.username === user.username ? "You" : convo.lastMessage.sender?.username;
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

        {/* Conversations Label */}
        <div className="px-6 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Conversations
          </p>
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
                    {/* Sender name for group chats */}
                    {selectedConvo.isGroup && !isOwn(msg) && (
                      <p className="text-xs font-semibold px-1" style={{ color: "#ff8e53" }}>
                        {msg.sender?.username}
                      </p>
                    )}

                    {/* Bubble */}
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

                    {/* Timestamp */}
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
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">💬</div>
            <p className="text-xl font-extrabold text-gray-700">Your Messages</p>
            <p className="text-sm text-gray-400">
              Pick a conversation and start chatting!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}