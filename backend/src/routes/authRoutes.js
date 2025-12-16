import express from "express";
import { register, login, getProfile as getAuthProfile, getQuotaStatus } from "../controllers/authController.js";
import { getProfile, updateProfile, changePassword } from "../controllers/userController.js";
import { getSubscription, subscribeUser, resetQuota } from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);

// Profile routes (protected)
router.get("/profile", protect, getProfile);
router.get("/me", protect, getAuthProfile); // Alternative profile endpoint
router.get("/quota", protect, getQuotaStatus); // Quota status endpoint
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Subscription routes (protected)
router.get("/subscription", protect, getSubscription);
router.post("/subscribe", protect, subscribeUser);
router.post("/reset-quota", protect, resetQuota);

export default router;
