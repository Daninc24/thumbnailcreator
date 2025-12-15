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
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { uploadLimiter, strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.get("/my-images", protect, getUserImages);
router.post("/upload-image", protect, uploadLimiter, upload.single("image"), uploadImage);
router.get("/images", protect, getUserImages);
router.post("/remove-bg", protect, strictLimiter, removeBackground);
router.post("/generate-thumbnail", protect, strictLimiter, generateThumbnail);
router.post("/remove-bg/bulk", protect, strictLimiter, removeBackgroundBulk);
router.post("/generate-thumbnail/bulk", protect, strictLimiter, generateThumbnailBulk);
router.post("/delete-image", protect, deleteImage);
router.get("/download", protect, downloadImage);

export default router;
