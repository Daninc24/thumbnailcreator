import fs from "fs";
import path from "path";
import User from "../models/User.js";

/* ================= UPLOAD ================= */
export const uploadImage = async (req, res) => {
  // existing code
};

/* ================= GET IMAGES ================= */
export const getUserImages = async (req, res) => {
  // existing code
};

/* ================= REMOVE BG ================= */
export const removeBackground = async (req, res) => {
  // existing code
};

/* ================= GENERATE THUMBNAIL ================= */
export const generateThumbnail = async (req, res) => {
  const { imageUrl, style, text = "" } = req.body;
  const userId = req.user.id;

  try {
    const allowedStyles = ["MrBeast", "Vlog", "Education", "Gaming"];
    if (!allowedStyles.includes(style)) {
      return res.status(400).json({ message: "Invalid style" });
    }

    const user = await User.findById(userId);
    const image = user.images.find((img) => img.url === imageUrl);
    if (!image) return res.status(404).json({ message: "Image not found" });

    const generatedFiles = [];

    for (let i = 1; i <= 3; i++) {
      const filename = `thumb_${style}_${Date.now()}_${i}.png`;
      const outputPath = path.join("uploads", filename);

      fs.copyFileSync(image.url, outputPath);

      user.images.push({
        url: outputPath,
        processed: true,
        style,
        text,
      });

      generatedFiles.push(outputPath);
    }

    await user.save();

    res.json({
      message: "Thumbnails generated",
      thumbnails: generatedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

