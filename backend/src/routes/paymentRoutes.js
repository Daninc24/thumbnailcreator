import express from "express";
import {
  createPaymentIntent,
  confirmSubscription,
  getPaymentHistory,
  cancelSubscription,
  handleStripeWebhook,
  getPlans,
} from "../controllers/paymentController.js";
import {
  initiateMpesaPayment,
  handleMpesaCallback,
  checkMpesaPaymentStatus,
  getMpesaPricing,
} from "../controllers/mpesaController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/plans", getPlans);
router.get("/mpesa/plans", getMpesaPricing);

// Webhook routes (no auth required)
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
router.post("/mpesa/callback", handleMpesaCallback);

// Protected routes - Stripe
router.post("/create-payment-intent", authMiddleware, createPaymentIntent);
router.post("/confirm-subscription", authMiddleware, confirmSubscription);
router.get("/history", authMiddleware, getPaymentHistory);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

// Protected routes - M-Pesa
router.post("/mpesa/initiate", authMiddleware, initiateMpesaPayment);
router.get("/mpesa/status/:checkoutRequestId", authMiddleware, checkMpesaPaymentStatus);

export default router;