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
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },
  stripeCustomerId: { type: String, default: null },
  subscription: {
    plan: { 
      type: String, 
      enum: ["free", "pro", "premium"], 
      default: "free" 
    },
    quota: { type: Number, default: 10 }, // max images per month
    used: { type: Number, default: 0 },   // images used this month
    expiresAt: { type: Date, default: null },
    resetAt: { type: Date, default: null }, // next quota reset date
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  },
  images: [
  {
    url: String,
    processed: Boolean,
    type: {
      type: String,
      enum: ["original", "bg_removed", "thumbnail", "uploaded-video", "video", "ai-video"],
      default: "original",
    },
    style: String,
    thumbnail: String,
    template: String, // For video templates
    downloaded: { type: Boolean, default: false },
    metadata: {
      duration: Number,
      width: Number,
      height: Number,
      fps: Number,
      codec: String,
      bitrate: Number,
      size: Number,
      note: String
    },
    aiGenerated: { type: Boolean, default: false },
    aiPrompt: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    bgRemovedAt: Date,
    thumbnailGeneratedAt: Date,
    downloadedAt: Date,
  },
]

});

export default mongoose.model("User", userSchema);
