import dotenv from "dotenv";
// seed.ts
import mongoose from "mongoose";
import Room from "../models/Room";

dotenv.config();

// Default starter rooms
const defaultRooms = [
  {
    ephemeral: false,
    name: "general",
  },
  {
    ephemeral: false,
    name: "random",
  },
  {
    ephemeral: false,
    name: "introductions",
  },
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/1800chat";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if rooms already exist
    const existingRooms = await Room.find({
      name: { $in: defaultRooms.map((r) => r.name) },
    });

    if (existingRooms.length > 0) {
      console.log("ℹ️  Default rooms already exist. Skipping initialization.");
      await mongoose.disconnect();
      return;
    }

    // Create default rooms
    console.log("🏠 Creating default rooms...");
    const createdRooms = await Room.insertMany(defaultRooms);
    console.log(`✅ Created ${createdRooms.length} default rooms`);
    console.log("   - general");
    console.log("   - random");
    console.log("   - introductions");

    console.log("\n✅ Database initialization complete!");
        console.log("👥 Users can now register and create their own rooms.\n");
      } catch (error) {
        console.error("❌ Error initializing database:", error);
        await mongoose.disconnect();
        process.exit(1);
      }
    }
    
    initializeDatabase();
      