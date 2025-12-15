import fs from "fs";
import path from "path";
import sharp from "sharp";
import User from "../models/User.js";

/* ================= UPLOAD ================= */
export const uploadImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const storedPath = path.join("uploads", file.filename);

    user.images.push({
      url: storedPath,
      processed: false,
    });

    await user.save();

    res.status(201).json({ message: "Image uploaded", file: storedPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET IMAGES ================= */
export const getUserImages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ images: user.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= REMOVE BG (SAFE FALLBACK) ================= */
export const removeBackground = async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const image = user.images.find((img) => img.url === imageUrl);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ⚠️ FALLBACK: Just mark as processed
    image.processed = true;
    await user.save();

    res.json({
      message:
        "Background removal simulated (API disabled). Upgrade to enable AI BG removal.",
      file: image.url,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GENERATE THUMBNAILS ================= */
export const generateThumbnail = async (req, res) => {
  const { imageUrl, style, text = "WATCH THIS" } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const image = user.images.find((img) => img.url === imageUrl);

    if (!image) return res.status(404).json({ message: "Image not found" });

    const inputPath = path.resolve(image.url);
    const outputs = [];

    for (let i = 0; i < 3; i++) {
      const outName = `thumb_${style}_${Date.now()}_${i}.png`;
      const outPath = path.join("uploads", outName);

      await sharp(inputPath)
        .resize(1280, 720)
        .modulate({ saturation: 1.3 })
        .composite([
          {
            input: Buffer.from(`
              <svg width="1280" height="720">
                <text x="50%" y="85%"
                  font-size="80"
                  fill="white"
                  text-anchor="middle"
                  font-weight="bold"
                  font-family="Arial">
                  ${text}
                </text>
              </svg>
            `),
          },
        ])
        .toFile(outPath);

      user.images.push({
        url: outPath,
        processed: true,
        style,
      });

      outputs.push(outPath);
    }

    await user.save();

    res.json({
      message: "Thumbnails generated",
      thumbnails: outputs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
