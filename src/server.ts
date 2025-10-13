import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import { chatHandler } from "./socket/chatHandler";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
connectDB();

// REST API
app.use("/api/auth", authRoutes);

// Socket.IO
chatHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`DingyChat backend running on port ${PORT}`)
);
