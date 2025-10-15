import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    const { host, port } = mongoose.connection;
    console.log(`MongoDB connected at ${host}:${port}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
