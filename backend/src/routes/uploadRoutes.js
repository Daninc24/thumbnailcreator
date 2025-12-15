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

const router = express.Router();
router.get("/my-images",protect, getUserImages);
router.post("/upload-image", protect, upload.single("image"), uploadImage);
router.get("/images", protect, getUserImages);
router.post("/remove-bg", protect, removeBackground);
router.post("/generate-thumbnail", protect, generateThumbnail);
router.post("/remove-bg/bulk", protect, removeBackgroundBulk);
router.post("/generate-thumbnail/bulk", protect, generateThumbnailBulk);
router.post("/delete-image", protect, deleteImage);


router.get("/download", protect, downloadImage);

export default router;
