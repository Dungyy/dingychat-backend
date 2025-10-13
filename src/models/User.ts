import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  color: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  color: { type: String, required: true },
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
