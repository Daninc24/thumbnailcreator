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
    <div className="p-4">
      <input
        type="file"
        onChange={(e) => e.target.files && setFile(e.target.files[0])}
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white p-2 m-2"
      >
        Upload
      </button>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {images.map((img, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <img
              src={`http://localhost:5000/${img.url}`}
              alt="Uploaded"
              className="w-full h-32 object-cover mb-2"
            />
            {!img.processed && (
              <button
                onClick={() => handleRemoveBG(img.url)}
                className="bg-green-500 text-white p-1 text-sm"
              >
                Remove Background
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
