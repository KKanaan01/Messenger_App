const http = require("http");
require("dotenv").config();
const portNumber = process.env.PORT || 3001;
const connectDB = require('./config/db');

// Socket io's Server class
// This is what we will use to instantiate the io server
const { Server } = require("socket.io");

const app = require("./app");

// SOCKET IO requires the use of raw http
const server = http.createServer(app);

// SOCKET IO SET UP
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_user_room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });


  socket.on("join_room", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("leave_room", (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on("send_message", (message) => {
    console.log("📨 Server received send_message:", message.conversation); 
    io.to(message.conversation).emit("receive_message", message);

    message.recipientIds.forEach((recipientId) => {
      io.to(recipientId).emit("new_notification", {
        conversationId: message.conversation,
        message,
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

async function start() {
  await connectDB();

  server.listen(portNumber, () => {
    console.log(`Server running on port ${portNumber}`);
  });
}

start().catch((err) => {
  console.error("Start up failed", err);
  process.exit(1);
})