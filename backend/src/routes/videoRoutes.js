import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { 
  createVideo, 
  getVideoStatus, 
  thumbnailToVideo,
  checkSystemCapabilities,
  generateAIVideo,
  uploadVideo,
  uploadAudio
} from "../controllers/videoController.js";

const router = express.Router();

// Upload video for editing
router.post("/upload", authMiddleware, (req, res, next) => {
  uploadVideo[0](req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: "File too large. Maximum size is 100MB.",
          error: "FILE_TOO_LARGE"
        });
      }
      if (err.message === 'Only video files are allowed') {
        return res.status(400).json({ 
          message: "Invalid file type. Please upload a video file.",
          error: "INVALID_FILE_TYPE"
        });
      }
      return res.status(500).json({ 
        message: "Upload failed", 
        error: err.message 
      });
    }
    // If no error, proceed to the controller
    uploadVideo[1](req, res, next);
  });
});

// Upload audio for video editing
router.post("/upload-audio", authMiddleware, uploadAudio);

// Create video from template and layers
router.post("/create", authMiddleware, createVideo);

// Convert thumbnail to animated video
router.post("/thumbnail-to-video", authMiddleware, thumbnailToVideo);

// Generate AI video from text prompt
router.post("/ai-generate", authMiddleware, generateAIVideo);

// Get video processing status
router.get("/status/:videoId", authMiddleware, getVideoStatus);

// Check system capabilities (FFmpeg availability)
router.get("/capabilities", checkSystemCapabilities);

export default router;