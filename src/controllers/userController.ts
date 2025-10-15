import { Request, Response } from "express";
import Room from "../models/Room";
import User from "../models/User";
import { randomColor } from "../utils/colorGen";


export const freeUserLogin = async (req: Request, res: Response) => {
  const { username } = req.body;
  try {
    const user = await User.create({
      color: randomColor(),
      username,
    });
    res.status(201).json({ message: "User registered" });
    console.log("User registered:", user.username);
  } catch (err) {
    res.status(400).json({ error: err });
  }
};

export const getFreeUser = async (req: Request, res: Response) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err });
    }
};

export const freeRoomAccess = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({});
    const { username } = req.body;
    const user = await User.findOne({ username });
    res.json({
      rooms,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
