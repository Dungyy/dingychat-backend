import express from "express";
import { getRooms, login, register } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/rooms", getRooms);

export default router;
