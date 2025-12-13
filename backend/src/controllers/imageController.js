import fs from "fs";
import path from "path";
import User from "../models/User.js";
import fetch from "node-fetch";

export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const storedPath = path.join("uploads", file.filename);
    user.images.push({ url: storedPath });
    await user.save();

    res.json({ message: "Uploaded", file: storedPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getUserImages = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ images: user.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const removeBackground = async (req, res) => {
  const { imageUrl } = req.body; // path of existing uploaded image
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const image = user.images.find((img) => img.url === imageUrl);
    if (!image) return res.status(404).json({ message: "Image not found" });

    const inputPath = path.join(process.cwd(), image.url);
    const outputPath = path.join("uploads", "bg_removed_" + path.basename(image.url));

    // Call Remove.bg API
    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(inputPath));
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    // Save new BG-removed image in DB
    user.images.push({ url: outputPath, processed: true });
    await user.save();

    res.json({ message: "Background removed", file: outputPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
