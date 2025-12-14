import sharp from "sharp";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { stylePresets } from "../utils/styles.js";

export const generateThumbnail = async (req, res) => {
  const { imageUrl, style, text = "WATCH THIS!" } = req.body;
  const userId = req.user.id;

  try {
    const preset = stylePresets[style];
    if (!preset) return res.status(400).json({ message: "Invalid style" });

    const user = await User.findById(userId);
    const image = user.images.find((img) => img.url === imageUrl);

    const inputPath = path.join(process.cwd(), image.url);
    const outputs = [];

    for (let i = 0; i < 3; i++) {
      const outName = `thumb_${Date.now()}_${i}.png`;
      const outPath = path.join("uploads", outName);

      await sharp(inputPath)
        .modulate({ saturation: preset.saturation })
        .linear(preset.contrast)
        .resize(1280, 720)
        .composite([
          {
            input: Buffer.from(`
              <svg width="1280" height="720">
                <text x="50%" y="85%"
                  font-size="${preset.fontSize}"
                  fill="${preset.color}"
                  text-anchor="middle"
                  font-weight="bold"
                  font-family="Arial">
                  ${text}
                </text>
              </svg>
            `),
            gravity: "south",
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
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
