import express from "express";
import { freeRoomAccess, freeUserLogin } from "../controllers/userController";

const router = express.Router();

router.post("/freeuser", freeUserLogin);
router.get("/freerooms", freeRoomAccess);

export default router;