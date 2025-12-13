import React, { useEffect, useState } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import axiosInstance from "../api/axiosInstance";

interface ImageType {
  url: string;
  processed?: boolean; // optional flag for BG-removed images
}

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  // const [images, setImages] = useState<{ url: string; _id: string }[]>([]);


  // Fetch user images
  useEffect(() => {
    const fetchImages = async () => {
      const res = await getUserImages();
      setImages(res.images);
    };
    fetchImages();
  }, []);

  // Upload image
  const handleUpload = async () => {
    if (!file) return;
    const res = await uploadImage(file);
    alert(res.message);
    const updated = await getUserImages();
    setImages(updated.images);
  };

  // Remove background
  const handleRemoveBG = async (imgUrl: string) => {
    try {
      const res = await axiosInstance.post(
        "/upload/remove-bg",
        { imageUrl: imgUrl } // send path of existing image
      );
      alert(res.data.message);

      // Refresh images after BG removal
      const updated = await getUserImages();
      setImages(updated.images);
    } catch (err) {
      console.error(err);
      alert("Failed to remove background");
    }
  };

return (
  <div className="min-h-screen bg-slate-900 text-white p-6">
    <h1 className="text-2xl font-bold mb-6">Thumbnail Generator</h1>

    {/* Upload */}
    <div className="bg-slate-800 p-4 rounded-lg mb-6">
      <input
        type="file"
        onChange={(e) =>
          e.target.files && setFile(e.target.files[0])
        }
        className="mb-3"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Upload Image
      </button>
    </div>

    {/* Images */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="bg-slate-800 rounded-lg p-2"
        >
          <img
            src={`http://localhost:5000/${img.url}`}
            className="rounded mb-2"
          />

          <button
            onClick={() => handleRemoveBG(file!)}
            className="w-full bg-purple-600 hover:bg-purple-700 py-1 rounded"
          >
            Remove Background
          </button>
        </div>
      ))}
    </div>
  </div>
);

};

export default Dashboard;
