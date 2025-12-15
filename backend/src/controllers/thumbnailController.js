import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";
import User from "../models/User.js";

export const generateThumbnail = async (req, res) => {
  const { imageUrl, style, text } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const image = user.images.find((img) => img.url === imageUrl);
    if (!image) return res.status(404).json({ message: "Image not found" });

    const inputPath = path.resolve(image.url);
    const outputFile = `thumb_${Date.now()}.png`;
    const outputPath = path.join("uploads", outputFile);

    // Resize base image
    const baseBuffer = await sharp(inputPath)
      .resize(1280, 720)
      .toBuffer();

    const img = await loadImage(baseBuffer);
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, 1280, 720);

    // 🎨 Style presets
    const styleConfig = {
      MrBeast: { color: "#FFD700", size: 90 },
      Vlog: { color: "#FFFFFF", size: 70 },
      Education: { color: "#00FFAA", size: 60 },
      Gaming: { color: "#FF004C", size: 80 },
    };

    const preset = styleConfig[style] || styleConfig.MrBeast;

    // Text styling
    ctx.font = `bold ${preset.size}px Impact`;
    ctx.fillStyle = preset.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 8;
    ctx.textAlign = "center";

    ctx.strokeText(text, 640, 650);
    ctx.fillText(text, 640, 650);

    // Save thumbnail
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    user.images.push({ url: outputPath, processed: true });
    await user.save();

    res.json({
      message: "Thumbnail generated",
      file: outputPath,
    });
  } catch (err) {
    console.error("THUMBNAIL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
