import express from "express";
import { upload } from "../middleware/upload.js";
import {
	uploadImage,
	getUserImages,
	removeBackground,
} from "../controllers/imageController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("image"), uploadImage);
router.get("/my-images", authMiddleware, getUserImages);
router.post("/remove-bg", authMiddleware, removeBackground);

export default router;
