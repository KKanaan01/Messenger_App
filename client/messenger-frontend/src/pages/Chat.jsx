import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../api/axios";

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

    // Clear old polling and start new one
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchMessages(convo._id);
      fetchConversations();
    }, 3000);
  };

  // Cleanup polling on unmount
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
    const senderName = convo.lastMessage.sender?.username;
    const label = senderName === user.username ? "You" : senderName;
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

  return (
    <div className="h-screen bg-white flex overflow-hidden">

      {/* ─── Sidebar ─────────────────────────────────── */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50 shrink-0">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-black tracking-tight">💬 Messenger</h1>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-black transition font-medium"
          >
            Logout
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Signed in as
          </p>
          <p className="text-sm font-semibold text-black mt-1">@{user?.username}</p>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
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
                className={`w-full text-left px-6 py-4 border-b border-gray-100 hover:bg-white transition ${
                  selectedConvo?._id === convo._id
                    ? "bg-white border-l-4 border-l-black"
                    : ""
                }`}
              >
                {/* Name + Time */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-black truncate">
                    {getConvoName(convo)}
                  </p>
                  <span className="text-xs text-gray-300 ml-2 shrink-0">
                    {formatTime(convo.updatedAt)}
                  </span>
                </div>

                {/* Last Message + Unread Badge */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 truncate">
                    {getLastMessage(convo)}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="bg-black text-white text-xs font-bold rounded-full px-2 py-0.5 shrink-0">
                      {convo.unreadCount}
                    </span>
                  )}
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
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center gap-3">
              <div>
                <p className="text-sm font-bold text-black">
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
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-300">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-300">
                    No messages yet. Say hello! 👋
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
                    {/* Sender name (only for group chats) */}
                    {selectedConvo.isGroup && !isOwn(msg) && (
                      <p className="text-xs text-gray-400 font-medium px-1">
                        {msg.sender?.username}
                      </p>
                    )}

                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isOwn(msg)
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-gray-100 text-black rounded-bl-sm"
                      }`}
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
              <div className="mx-6 mb-2 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-black transition"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-black hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-full transition"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-4xl">💬</p>
            <p className="text-sm font-semibold text-black">Your messages</p>
            <p className="text-xs text-gray-400">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}