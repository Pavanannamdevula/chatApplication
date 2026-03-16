const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", async (userId) => {
    try {
      onlineUsers[userId] = socket.id;

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });

      io.emit("userStatusChange", {
        userId,
        isOnline: true,
      });

      console.log(`User joined: ${userId}`);
    } catch (error) {
      console.log("Join socket error:", error.message);
    }
  });

  socket.on("sendMessage", (messageData) => {
    const receiverSocketId = onlineUsers[messageData.receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", messageData);
    }
  });

  socket.on("disconnect", async () => {
    try {
      let disconnectedUserId = null;

      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          disconnectedUserId = userId;
          delete onlineUsers[userId];
          break;
        }
      }

      if (disconnectedUserId) {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("userStatusChange", {
          userId: disconnectedUserId,
          isOnline: false,
        });
      }

      console.log("Socket disconnected:", socket.id);
    } catch (error) {
      console.log("Disconnect socket error:", error.message);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Chat backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});