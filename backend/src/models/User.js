import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: String,
  processed: { type: Boolean, default: false }, // track BG-removed images
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  credits: { type: Number, default: 3 },
  images: [
  {
    url: String,
    processed: Boolean,
    type: {
      type: String,
      enum: ["original", "bg_removed", "thumbnail"],
      default: "original",
    },
    style: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
]

});

export default mongoose.model("User", userSchema);
