import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message";

interface ChatData {
  username: string;
  room: string;
  color: string;
}

export const chatHandler = (io: Server) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Authentication error"));

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any;
      socket.data.username = payload.username;
      socket.data.userId = payload.id;
      return next();
    } catch {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("✅ User connected:", socket.data.username);

    socket.on("joinRoom", async (room: string) => {
      socket.join(room);

      socket.data.room = room;
      socket.broadcast
        .to(room)
        .emit("systemMessage", `${socket.data.username} joined the room`);

      // Load last 20 messages
      const messages = await Message.find({ room })
        .sort({ createdAt: -1 })
        .limit(20);
      socket.emit("loadMessages", messages.reverse());
    });

    socket.on("chatMessage", async (text: string) => {
      const { username, room, color } = socket.data as ChatData;
      const message = await Message.create({
        room,
        sender: username,
        text,
        color,
      });
      io.to(room).emit("chatMessage", message);
    });

    socket.on("disconnect", () => {
      const { username, room } = socket.data as ChatData;
      if (room) {
        socket.broadcast
          .to(room)
          .emit("systemMessage", `${username} left the room`);
      }
      console.log("❌ User disconnected:", socket.data.username);
    });
  });
};
