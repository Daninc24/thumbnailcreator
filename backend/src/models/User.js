import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  credits: { type: Number, default: 3 }
});

export default mongoose.model("User", userSchema);
