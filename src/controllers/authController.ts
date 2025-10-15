import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Room from "../models/Room";
import User from "../models/User";
import { randomColor } from "../utils/colorGen";

export const register = async (req: Request, res: Response) => {
  const { password, username } = req.body;
  try {
    const user = await User.create({
      color: randomColor(),
      password,
      username,
    });
    res.status(201).json({ message: "User registered" });
    console.log("User registered:", user.username);
  } catch (err) {
    res.status(400).json({ error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { password, username } = req.body;
  try {
    // Find user by username only
    const user = await User.findOne({ username });
    if (!user || typeof user.comparePassword !== "function") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    // Generate JWT for 1 day
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );
    res.json({ color: randomColor(), token });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// // Optional REST endpoint for fallback (e.g. debugging or sidebar refresh)
// import { Application, Request, Response } from "express";
// // Add this import or define roomUsers elsewhere in your codebase

// export const getActiveUsersRoute = (app: Application) => {
//   app.get("/api/active-users/:room", (req: Request, res: Response) => {
//     const { room } = req.params;
//     const users = Array.from(roomUsers[room] || []);
//     res.json({ count: users.length, room, users });
//   });
// };
