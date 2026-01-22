// Socket.IO client served by your server automatically at /socket.io/socket.io.js
// Make sure this file is loaded AFTER socket.io.js in the HTML.

const socket = io("http://10.0.0.157:3001");

const chat = document.getElementById("chat");
const nameInput = document.getElementById("name");
const roomInput = document.getElementById("room");
const msgInput = document.getElementById("msg");
const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");

let currentRoom = null;

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = `[${nowTime()}] ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function addMessage({ room, name, text, time, socketId }) {
  if (currentRoom && room && room !== currentRoom) return;

  const div = document.createElement("div");
  const isMe = socketId && socketId === socket.id;
  div.className = "bubble" + (isMe ? " me" : "");
  div.innerHTML = `<span class="who">${escapeHtml(name || "Anon")}</span>
                   <span>${escapeHtml(text)}</span>
                   <div class="meta">${escapeHtml(time || nowTime())}${room ? " • room: " + escapeHtml(room) : ""}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ---- Connection events ----
socket.on("connect", () => addSystem(`Connected ✅ (socket: ${socket.id})`));
socket.on("disconnect", () => addSystem("Disconnected ⚠️"));
socket.on("connect_error", (err) => addSystem("Connect error ❌ " + err.message));

// ---- Chat events ----
socket.on("receive_message", (message) => addMessage(message));

// ---- UI actions ----
joinBtn.addEventListener("click", () => {
  const room = roomInput.value.trim() || "lobby";
  currentRoom = room;
  addSystem(`Joined room: ${room} (local filter for now)`);
});

function send() {
  const name = nameInput.value.trim() || "Anon";
  const room = roomInput.value.trim() || "lobby";
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("send_message", {
    room,
    name,
    text,
    time: nowTime(),
    socketId: socket.id,
  });

  msgInput.value = "";
  msgInput.focus();
}

sendBtn.addEventListener("click", send);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
