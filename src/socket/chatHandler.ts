import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import Message from "../models/Message";
import Room from "../models/Room";

interface ChatData {
  username: string;
  room?: string;
  color?: string;
}

export const chatHandler = (io: Server) => {
  // Middleware: verify JWT for every socket connection
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token || (socket.handshake.query.token as string);

    if (!token) return next(new Error("Authentication error"));

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any;
      socket.data.username = payload.username;
      socket.data.userId = payload.id;

      // Assign a random color to user if not already assigned
      socket.data.color =
        "#" + Math.floor(Math.random() * 16777215).toString(16);

      next();
    } catch {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("✅ User connected:", socket.data.username);

    // Join or create a room
    socket.on("joinRoom", async (roomName: string) => {
      if (!roomName) return socket.emit("errorMessage", "Room name required");

      // Check if room exists
      let room = await Room.findOne({ name: roomName });
      if (!room) {
        room = await Room.create({
          ephemeral: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hr expiry
          name: roomName,
        });
      }

      socket.join(room.name);
      socket.data.room = room.name;

      console.log(`📥 ${socket.data.username} joined room: ${room.name}`);

      // Broadcast join message
      socket.broadcast
        .to(room.name)
        .emit("systemMessage", `${socket.data.username} joined the room`);

      // Load last 20 messages
      const messages = await Message.find({ room: room.name })
        .sort({ createdAt: -1 })
        .limit(20);
      socket.emit("loadMessages", messages.reverse());

      // Ephemeral cleanup timer
      if (room.ephemeral) {
        setTimeout(async () => {
          const stillExists = await Room.findById(room._id);
          if (stillExists) {
            await Message.deleteMany({ room: room.name });
            io.to(room.name).emit(
              "systemMessage",
              "💨 This ephemeral room expired due to inactivity."
            );
            io.in(room.name).socketsLeave(room.name);
            await Room.deleteOne({ _id: room._id });
            console.log(`🧹 Room ${room.name} auto-deleted.`);
          }
        }, 1000 * 60 * 60); // 1 hour
      }
    });

    // Handle incoming chat messages
    socket.on(
      "chatMessage",
      async (text: string, ephemeral: boolean = false) => {
        const { color, room, username } = socket.data as ChatData;

        // ✅ Ensure user joined a room
        if (!room) {
          console.warn("⚠️ Message received before joining a room");
          return socket.emit(
            "errorMessage",
            "You must join a room before sending messages."
          );
        }

        // ✅ Create message safely
        const message = await Message.create({
          color: color || "#999999",
          room,
          sender: username,
          text,
        });

        io.to(room).emit("chatMessage", message);

        // Ephemeral message auto-delete
        if (ephemeral) {
          setTimeout(async () => {
            await Message.deleteOne({ _id: message._id });
            io.to(room).emit("deleteMessage", message._id);
          }, 1000 * 60 * 5); // 5 minutes
        }
      }
    );

    // Typing indicators
    socket.on("typing", () => {
      const { room, username } = socket.data as ChatData;
      if (room)
        socket.broadcast.to(room).emit("typing", `${username} is typing...`);
    });

    socket.on("stopTyping", () => {
      const { room, username } = socket.data as ChatData;
      if (room) socket.broadcast.to(room).emit("stopTyping", username);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const { room, username } = socket.data as ChatData;
      if (room) {
        socket.broadcast
          .to(room)
          .emit("systemMessage", `${username} left the room`);
      }
      console.log("❌ User disconnected:", username);
    });
  });
};
