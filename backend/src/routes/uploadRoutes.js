import express from "express";
import multer from "multer";
import {
  uploadImage,
  getUserImages,
  removeBackground,
  generateThumbnail,
} from "../controllers/imageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", protect, upload.single("image"), uploadImage);
router.get("/my-images", protect, getUserImages);
router.post("/remove-bg", protect, removeBackground);
router.post("/generate-thumbnail", protect, generateThumbnail);

export default router;
