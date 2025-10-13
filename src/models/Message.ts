import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  room: string;
  sender: string;
  text: string;
  color: string;
  createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema({
  room: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
