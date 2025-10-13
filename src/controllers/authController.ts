import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { randomColor } from "../utils/colorGen";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await User.create({
      username,
      password,
      color: randomColor(),
    });
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );
    res.json({ token, color: user.color });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
