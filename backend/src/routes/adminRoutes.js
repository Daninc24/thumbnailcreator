import express from "express";
import {
  getAllUsers,
  updateUserPlan,
  updateUserRole,
  deleteUser,
  resetUserQuota,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

router.get("/users", getAllUsers);
router.put("/users/:userId/plan", updateUserPlan);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/reset-quota", resetUserQuota);

export default router;

