import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";

// free user
export interface IFreeUser {
  username: string;
  color?: string;
}

export interface IUser extends Document {
  username: string;
  password: string;
  color: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  color: { required: false, type: String },
  password: { required: true, type: String },
  username: { required: true, type: String, unique: true },
});

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
