import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";

// Flexible user interface
export interface IBaseUser {
  username: string;
  color?: string;
}

export interface IUser extends IBaseUser, Document {
  password?: string;
  comparePassword?(password: string): Promise<boolean>;
}

// Schema definition
const UserSchema: Schema<IUser> = new Schema({
  color: { required: false, type: String },
  password: { required: false, type: String },
  username: { required: true, type: String, unique: true },
});

// Password hashing only if password exists
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method only if password exists
UserSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
