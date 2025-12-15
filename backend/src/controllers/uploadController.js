import ImageModel from "../models/ImageModel.js"; // your image schema

// Fetch user images
export const getUserImages = async (req, res) => {
  try {
    // If you have auth, replace `userId` with `req.user.id`
    const images = await ImageModel.find({}); 
    res.json({ images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch images" });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    await ImageModel.deleteOne({ url: imageUrl });
    res.json({ message: "Image deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// Add other controllers (upload, remove-bg, generate-thumbnail, etc.) as needed
