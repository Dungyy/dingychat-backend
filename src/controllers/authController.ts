import { Request, Response } from "express";
import jwt from "jsonwebtoken";
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
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    // Generate JWT for 1 day
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );
    res.json({ color: user.color, token });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
