import express from "express";
import { upload } from "../middleware/upload.js";
import { removeBackground } from "../controllers/imageController.js";

router.post("/remove-bg", authMiddleware, removeBackground);
