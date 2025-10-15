import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import Message from "../models/Message";
import Room from "../models/Room";

interface ChatData {
  username: string;
  room?: string;
  color?: string;
}

// In-memory store for tracking users in each room
const roomUsers: Record<string, Set<string>> = {};

export const chatHandler = (io: Server) => {
  // Middleware: verify JWT for every socket connection
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token || (socket.handshake.query.token as string);

    if (!token) return next(new Error("Authentication error"));

    try {
      interface JWTPayload {
        username: string;
        id: string;
        [key: string]: unknown;
      }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as JWTPayload;

      socket.data.username = payload.username;
      socket.data.userId = payload.id;
      socket.data.color =
        "#" + Math.floor(Math.random() * 16777215).toString(16);

      next();
    } catch {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.data.username);

    // ✅ JOIN ROOM
    socket.on("joinRoom", async (roomName: string) => {
      if (!roomName) return socket.emit("errorMessage", "Room name required");

      // Leave old room
      if (socket.data.room && socket.data.room !== roomName) {
        socket.leave(socket.data.room);
        if (roomUsers[socket.data.room]) {
          roomUsers[socket.data.room].delete(socket.data.username);
          io.to(socket.data.room).emit("roomUsers", {
            count: roomUsers[socket.data.room].size,
            room: socket.data.room,
            users: Array.from(roomUsers[socket.data.room]),
          });
        }
      }

      // Check or create room
      let room = await Room.findOne({ name: roomName });
      if (!room) {
        room = await Room.create({
          ephemeral: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          name: roomName,
        });
      }

      socket.join(room.name);
      socket.data.room = room.name;

      // Add to in-memory user tracker
      if (!roomUsers[room.name]) roomUsers[room.name] = new Set();
      roomUsers[room.name].add(socket.data.username);

      console.log(`${socket.data.username} joined room: ${room.name}`);

      // Notify all clients in the room
      io.to(room.name).emit("roomUsers", {
        count: roomUsers[room.name].size,
        room: room.name,
        users: Array.from(roomUsers[room.name]),
      });

      socket.broadcast
        .to(room.name)
        .emit("systemMessage", `${socket.data.username} joined the room`);

      // Load recent messages
      const messages = await Message.find({ room: room.name })
        .sort({ createdAt: -1 })
        .limit(20);
      socket.emit("loadMessages", messages.reverse());

      // Ephemeral cleanup
      if (room.ephemeral) {
        setTimeout(async () => {
          const stillExists = await Room.findById(room._id);
          if (stillExists) {
            await Message.deleteMany({ room: room.name });
            io.to(room.name).emit(
              "systemMessage",
              "This ephemeral room expired due to inactivity."
            );
            io.in(room.name).socketsLeave(room.name);
            await Room.deleteOne({ _id: room._id });
            console.log(`Room ${room.name} auto-deleted.`);
          }
        }, 1000 * 60 * 60); // 1 hour
      }
    });

    // ✅ CHAT MESSAGE
    socket.on(
      "chatMessage",
      async (text: string, ephemeral: boolean = false) => {
        const { color, room, username } = socket.data as ChatData;

        if (!room) {
          return socket.emit(
            "errorMessage",
            "You must join a room before sending messages."
          );
        }

        const message = await Message.create({
          color: color || "#999999",
          room,
          sender: username,
          text,
        });

        io.to(room).emit("chatMessage", message);

        // Auto-delete ephemeral messages
        if (ephemeral) {
          setTimeout(async () => {
            await Message.deleteOne({ _id: message._id });
            io.to(room).emit("deleteMessage", message._id);
          }, 1000 * 60 * 5);
        }
      }
    );

    // ✅ TYPING INDICATORS
    socket.on("typing", () => {
      const { room, username } = socket.data as ChatData;
      if (room)
        socket.broadcast.to(room).emit("typing", `${username} is typing...`);
    });

    socket.on("stopTyping", () => {
      const { room, username } = socket.data as ChatData;
      if (room) socket.broadcast.to(room).emit("stopTyping", username);
    });

    // ✅ HANDLE DISCONNECT
    socket.on("disconnect", () => {
      const { room, username } = socket.data as ChatData;
      if (room) {
        if (roomUsers[room]) {
          roomUsers[room].delete(username);
          io.to(room).emit("roomUsers", {
            count: roomUsers[room].size,
            room,
            users: Array.from(roomUsers[room]),
          });
        }

        socket.broadcast
          .to(room)
          .emit("systemMessage", `${username} left the room`);
      }

      console.log("User disconnected:", username);
    });
  });
};