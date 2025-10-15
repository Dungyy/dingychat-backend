import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Room from "../models/Room";
import { IFreeUser } from "../models/User";
import { randomColor } from "../utils/colorGen";

const freeUser: IFreeUser = {
    color: "",
    username: "",
};

// create a free user login endpoint it gets a token token and a username and returns a free user object with the username and a random color
export const freeUserLogin = async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }
  const freeUser = {
    color: randomColor(),
    token: jwt.sign(
      { username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    ),
    username,
  };
  res.json(freeUser);
};

export const getFreeUser = async (req: Request, res: Response) => {
    const { username } = req.body;
    freeUser.username = username;
    res.json(freeUser);
};

export const freeRoomAccess = async (_: Request, res: Response) => {
  try {
    const rooms = await Room.find({});
    res.json({
      rooms,
      user: freeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
