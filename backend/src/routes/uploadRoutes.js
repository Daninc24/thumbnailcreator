import express from "express";
import {
  uploadImage,
  getUserImages,
  deleteImage,
  removeBackgroundBulk,
  generateThumbnailBulk,
  downloadImage,
  removeBackground,
  generateThumbnail
} from "../controllers/imageController.js";
import { pauseQueue, resumeQueue, cancelQueue, getQueueStatus } from "../controllers/queueController.js";
import { getUserAnalytics, exportReport } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { uploadLimiter, strictLimiter } from "../middleware/rateLimiter.js";
import { checkQuota, incrementQuota } from "../middleware/quotaMiddleware.js";

const router = express.Router();
router.get("/my-images", protect, getUserImages);
router.post("/upload-image", protect, uploadLimiter, checkQuota, upload.single("image"), uploadImage);
router.get("/images", protect, getUserImages);
router.post("/remove-bg", protect, strictLimiter, removeBackground);
router.post("/generate-thumbnail", protect, strictLimiter, generateThumbnail);
router.post("/remove-bg/bulk", protect, strictLimiter, removeBackgroundBulk);
router.post("/generate-thumbnail/bulk", protect, strictLimiter, generateThumbnailBulk);
router.post("/delete-image", protect, deleteImage);
router.get("/download", protect, downloadImage);

// Analytics routes
router.get("/analytics", protect, getUserAnalytics);
router.get("/export-report", protect, exportReport);

// Queue control routes
router.get("/queue/status", protect, getQueueStatus);
router.post("/queue/pause", protect, pauseQueue);
router.post("/queue/resume", protect, resumeQueue);
router.post("/queue/cancel", protect, cancelQueue);

export default router;
