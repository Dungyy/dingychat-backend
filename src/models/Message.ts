import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  room: string;
  sender: string;
  text: string;
  color?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  color: { default: "#cccccc", type: String },
  createdAt: { default: Date.now, type: Date },
  room: { required: true, type: String },
  sender: { required: true, type: String },
  text: { required: true, type: String },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
