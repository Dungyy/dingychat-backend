import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  ephemeral: boolean;
}

const RoomSchema: Schema<IRoom> = new Schema({
  createdAt: { default: Date.now, type: Date },
  ephemeral: { default: false, type: Boolean },
  expiresAt: { type: Date },
  name: { required: true, type: String, unique: true },
});

export default mongoose.model<IRoom>("Room", RoomSchema);
