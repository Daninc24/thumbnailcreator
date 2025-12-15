import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import sharp from "sharp";
import User from "../models/User.js";

/* ===============================
   UPLOAD IMAGE
================================ */
export const uploadImage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Store relative path with forward slashes for URLs (works on all platforms)
    const filename = path.basename(file.path);
    const storedPath = `uploads/${filename}`.replace(/\\/g, '/');

    user.images.push({
      url: storedPath,
      processed: false,
      type: "original",
    });

    await user.save();

    res.status(201).json({
      message: "Image uploaded successfully",
      file: storedPath,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET USER IMAGES
================================ */
export const getUserImages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return images array from the user document
    res.json({ images: user.images });
  } catch (err) {
    console.error("GET IMAGES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// Helper to remove background for a single image
export const removeBackgroundLogic = async (userId, imageUrl) => {
  // Resolve the image path - imageUrl from DB is like "uploads/filename.jpg"
  const inputPath = path.resolve(process.cwd(), imageUrl);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Image file not found: ${inputPath}`);
  }

  const outputFile = `bg_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
  const outputFullPath = path.resolve(process.cwd(), outputPath);

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
    const errorText = await response.text();
    throw new Error(`Remove.bg failed: ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFullPath, buffer);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  // Find the original image and update it with processed version
  const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
  if (imageIndex !== -1) {
    // Update existing image to mark as processed and store the processed file path
    user.images[imageIndex].processed = true;
    user.images[imageIndex].type = "bg_removed";
    user.images[imageIndex].url = outputPath; // Update to the processed image
  } else {
    // If not found, add new entry
    user.images.push({ url: outputPath, processed: true, type: "bg_removed" });
  }
  await user.save();
};

// Route handler for remove background
export const removeBackground = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id || req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    await removeBackgroundLogic(userId, imageUrl);
    res.json({ message: "Background removed successfully" });
  } catch (err) {
    console.error("REMOVE BG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Helper to generate thumbnail for a single image
export const generateThumbnailLogic = async (userId, imageUrl, style, text) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Find the processed/bg-removed image to use
  const image = user.images.find((img) => img.url === imageUrl && img.processed);
  if (!image) {
    throw new Error("Processed image not found. Please remove background first.");
  }

  // Resolve the image path - imageUrl from DB is like "uploads/filename.jpg"
  const inputPath = path.resolve(process.cwd(), image.url);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Image file not found: ${inputPath}`);
  }

  const outputFile = `thumb_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
  const outputFullPath = path.resolve(process.cwd(), outputPath);

  const styles = {
    MrBeast: { fontSize: 90, color: "yellow" },
    Vlog: { fontSize: 60, color: "white" },
    Education: { fontSize: 55, color: "cyan" },
    Gaming: { fontSize: 70, color: "lime" },
  };

  const selected = styles[style] || styles.MrBeast;

  const svgText = `
    <svg width="1280" height="720">
      <style>
        .title { fill: ${selected.color}; font-size: ${selected.fontSize}px; font-weight: 900; font-family: Impact, Arial; }
      </style>
      <text x="50%" y="85%" text-anchor="middle" class="title">
        ${text.toUpperCase()}
      </text>
    </svg>
  `;

  await sharp(inputPath)
    .resize(1280, 720)
    .composite([{ input: Buffer.from(svgText) }])
    .png()
    .toFile(outputFullPath);

  // Update the image to mark it as having a thumbnail
  const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
  if (imageIndex !== -1) {
    user.images[imageIndex].thumbnail = outputPath;
  }
  
  // Also add as new entry
  user.images.push({ 
    url: outputPath, 
    processed: true, 
    type: "thumbnail",
    thumbnail: outputPath,
    style: style 
  });
  await user.save();
};

// Route handler for generate thumbnail
export const generateThumbnail = async (req, res) => {
  try {
    const { imageUrl, style, text } = req.body;
    const userId = req.user._id || req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    await generateThumbnailLogic(userId, imageUrl, style, text || "");
    res.json({ message: "Thumbnail generated successfully" });
  } catch (err) {
    console.error("GENERATE THUMBNAIL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE IMAGE
export const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
    if (imageIndex === -1) return res.status(404).json({ message: "Image not found" });

    // Remove file from disk - imageUrl is relative like "uploads/filename.jpg"
    const filePath = path.resolve(process.cwd(), user.images[imageIndex].url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from user.images array
    user.images.splice(imageIndex, 1);
    await user.save();

    res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk remove background
export const removeBackgroundBulk = async (req, res) => {
  try {
    const { imageUrls } = req.body; // array of URLs
    const userId = req.user._id || req.user.id;
    const results = [];

    for (let url of imageUrls) {
      try {
        // reuse existing removeBackground logic
        await removeBackgroundLogic(userId, url); 
        results.push({ url, status: "success" });
      } catch (err) {
        results.push({ url, status: "failed", error: err.message });
      }
    }
    res.json({ results });
  } catch (err) {
    console.error("BULK REMOVE BG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk generate thumbnails
export const generateThumbnailBulk = async (req, res) => {
  try {
    const { imageUrls, style, texts } = req.body;
    const userId = req.user._id || req.user.id;
    const results = [];

    for (let url of imageUrls) {
      try {
        await generateThumbnailLogic(userId, url, style, texts[url] || "");
        results.push({ url, status: "success" });
      } catch (err) {
        results.push({ url, status: "failed", error: err.message });
      }
    }
    res.json({ results });
  } catch (err) {
    console.error("BULK GENERATE THUMBNAIL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Download processed image
export const downloadImage = async (req, res) => {
  try {
    const { imageUrl } = req.query;
    
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    // imageUrl is relative like "uploads/filename.jpg", resolve it
    const filePath = path.resolve(process.cwd(), imageUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    console.error("DOWNLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};