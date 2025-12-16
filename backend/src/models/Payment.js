import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Payment method specific IDs
  stripePaymentIntentId: {
    type: String,
    sparse: true, // Allow null values but maintain uniqueness when present
  },
  mpesaCheckoutRequestId: {
    type: String,
    sparse: true,
  },
  mpesaReceiptNumber: {
    type: String,
    sparse: true,
  },
  // Payment details
  paymentMethod: {
    type: String,
    enum: ["stripe", "mpesa"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ["usd", "kes"],
    required: true,
  },
  plan: {
    type: String,
    enum: ["pro", "premium"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  metadata: {
    customerEmail: String,
    customerName: String,
    description: String,
    phoneNumber: String, // For M-Pesa
    transactionRef: String,
    merchantRequestId: String,
    resultDesc: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
paymentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Payment", paymentSchema);