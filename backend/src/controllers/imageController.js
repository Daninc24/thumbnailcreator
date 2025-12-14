import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import User from "../models/User.js";

export const removeBackground = async (req, res) => {
  const { imageUrl } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const image = user.images.find((img) => img.url === imageUrl);
    if (!image) return res.status(404).json({ message: "Image not found" });

    const inputPath = path.resolve(image.url);
    const outputFile = "bg_" + Date.now() + ".png";
    const outputPath = path.join("uploads", outputFile);

    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(inputPath));
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    user.images.push({ url: outputPath, processed: true });
    await user.save();

    res.json({ message: "Background removed", file: outputPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const storedPath = path.join("uploads", path.basename(file.path));
    user.images.push({ url: storedPath, processed: false });
    await user.save();

    res.status(201).json({ message: "Image uploaded", file: storedPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ images: user.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
