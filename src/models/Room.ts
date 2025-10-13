import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  ephemeral: boolean;
}

const RoomSchema: Schema<IRoom> = new Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  ephemeral: { type: Boolean, default: false },
});

export default mongoose.model<IRoom>("Room", RoomSchema);
