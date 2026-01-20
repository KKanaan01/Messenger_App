const http = require("http");

// Socket io's Server class
// This is what we will use to instantiate the io server
const { Server } = require("socket.io");

const app = require("./app");

// SOCKET IO requires the use of raw http
const server = http.createServer(app);

// SOCKET IO SET UP
const io = new Server(server , {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (message) => {
    io.emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});