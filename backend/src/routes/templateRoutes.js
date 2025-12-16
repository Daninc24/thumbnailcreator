import express from "express";
import {
  getUserTemplates,
  getPublicTemplates,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  rateTemplate,
  downloadTemplate,
  getTemplateStats
} from "../controllers/templateController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/public", getPublicTemplates);
router.get("/stats", getTemplateStats);

// Protected routes
router.get("/my-templates", authMiddleware, getUserTemplates);
router.post("/save", authMiddleware, saveTemplate);
router.patch("/:templateId", authMiddleware, updateTemplate);
router.delete("/:templateId", authMiddleware, deleteTemplate);
router.post("/duplicate", authMiddleware, duplicateTemplate);
router.post("/:templateId/rate", authMiddleware, rateTemplate);
router.post("/:templateId/download", authMiddleware, downloadTemplate);

export default router;