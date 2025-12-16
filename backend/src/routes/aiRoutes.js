import express from "express";
import {
  generateThumbnailSuggestions,
  generateImageBasedSuggestions,
  getTrendingPatterns,
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All AI routes require authentication
router.post("/suggestions/generate", authMiddleware, generateThumbnailSuggestions);
router.post("/suggestions/image-based", authMiddleware, generateImageBasedSuggestions);
router.get("/patterns/trending", authMiddleware, getTrendingPatterns);

export default router;