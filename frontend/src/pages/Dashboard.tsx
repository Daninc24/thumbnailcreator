import { useEffect, useState } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import axiosInstance from "../api/axiosInstance";

interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
  thumbnail?: string;
}

type StylePreset = "MrBeast" | "Vlog" | "Education" | "Gaming";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [style, setStyle] = useState<StylePreset>("MrBeast");
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user images
  const fetchImages = async () => {
    // Check if user is authenticated before making request
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping image fetch. Please log in.");
      return;
    }

    try {
      const res = await getUserImages();
      setImages(res.images);
    } catch (err: any) {
      // Only log if it's not a 401 (unauthorized) error
      if (err?.response?.status !== 401) {
        console.error("Failed to fetch images:", err);
      } else {
        // User is not authenticated, clear invalid token and redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Upload image
  const handleUpload = async () => {
    if (!file) return alert("Select an image");
    try {
      await uploadImage(file);
      setFile(null);
      fetchImages();
    } catch (err) {
      alert("Upload failed");
    }
  };

  // Remove background
  const handleRemoveBG = async (imageUrl: string) => {
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    setErrors((prev) => ({ ...prev, [imageUrl]: "" }));
    try {
      await axiosInstance.post("/upload/remove-bg", { imageUrl });
      fetchImages();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [imageUrl]: "BG removal failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Generate thumbnail
  const handleGenerateThumbnail = async (imageUrl: string) => {
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    setErrors((prev) => ({ ...prev, [imageUrl]: "" }));
    try {
      await axiosInstance.post("/upload/generate-thumbnail", {
        imageUrl,
        style,
        text: texts[imageUrl] || "",
      });
      fetchImages();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [imageUrl]: "Thumbnail generation failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Delete image
  const handleDelete = async (imageUrl: string) => {
    if (!confirm("Delete this image?")) return;
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    try {
      await axiosInstance.post("/upload/delete-image", { imageUrl });
      fetchImages();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [imageUrl]: "Delete failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Toggle selection for bulk actions
  const toggleSelect = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Bulk Remove BG
  const handleBulkRemoveBG = async () => {
    if (selectedImages.length === 0) return alert("Select images first");
    setLoading(true);
    try {
      await axiosInstance.post("/upload/remove-bg/bulk", { imageUrls: selectedImages });
      await fetchImages();
    } catch (err) {
      console.error("Bulk remove BG failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Generate Thumbnails
  const handleBulkGenerate = async () => {
    if (selectedImages.length === 0) return alert("Select images first");
    const textsPayload = selectedImages.reduce((acc, url) => {
      acc[url] = texts[url] || "";
      return acc;
    }, {} as Record<string, string>);
    setLoading(true);
    try {
      await axiosInstance.post("/upload/generate-thumbnail/bulk", {
        imageUrls: selectedImages,
        style,
        texts: textsPayload,
      });
      await fetchImages();
    } catch (err) {
      console.error("Bulk generate thumbnails failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Status badges
  const getStatusBadge = (img: ImageType) => {
    if (img.thumbnail) return <span className="text-green-400 text-xs">Thumbnail Ready</span>;
    if (img.processed) return <span className="text-purple-400 text-xs">BG Removed</span>;
    return <span className="text-yellow-400 text-xs">Original</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">AI Thumbnail Generator</h1>

      {/* Upload Section */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 space-y-3">
        <input
          type="file"
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
        />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as StylePreset)}
          className="bg-slate-700 p-2 rounded w-full"
        >
          <option>MrBeast</option>
          <option>Vlog</option>
          <option>Education</option>
          <option>Gaming</option>
        </select>
        <button
          onClick={handleUpload}
          className="bg-blue-600 py-2 rounded w-full hover:bg-blue-700 transition"
        >
          Upload Image
        </button>
      </div>

      {/* Bulk Action Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleBulkRemoveBG}
          disabled={selectedImages.length === 0 || loading}
          className="bg-purple-600 py-2 px-4 rounded hover:bg-purple-800 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Bulk Remove BG"}
        </button>
        <button
          onClick={handleBulkGenerate}
          disabled={selectedImages.length === 0 || loading}
          className="bg-green-600 py-2 px-4 rounded hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Bulk Generate Thumbnails"}
        </button>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img._id} className="bg-slate-800 p-3 rounded space-y-2">
            <img
              src={`http://localhost:5000/${img.thumbnail || img.url}`}
              className="rounded h-40 w-full object-cover"
            />

            {/* Checkbox + filename */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedImages.includes(img.url)}
                  onChange={() => toggleSelect(img.url)}
                  className="accent-blue-500"
                />
                <p className="text-sm truncate">{img.url.split("/").pop()}</p>
              </div>
              {getStatusBadge(img)}
            </div>

            <input
              placeholder="Thumbnail text"
              value={texts[img.url] || ""}
              onChange={(e) =>
                setTexts((prev) => ({ ...prev, [img.url]: e.target.value }))
              }
              className="bg-slate-700 p-2 rounded w-full"
            />

            {/* Single Image Action Buttons */}
            <button
              onClick={() => handleRemoveBG(img.url)}
              disabled={processing[img.url] || img.processed}
              className="bg-purple-600 w-full py-1 rounded hover:bg-purple-800 disabled:opacity-40"
            >
              {processing[img.url] && !img.processed ? "Removing..." : "Remove BG"}
            </button>

            <button
              onClick={() => handleGenerateThumbnail(img.url)}
              disabled={processing[img.url] || !img.processed}
              className="bg-green-600 w-full py-1 rounded hover:bg-green-800 disabled:opacity-40"
            >
              {processing[img.url] && img.processed ? "Generating..." : "Generate Thumbnail"}
            </button>

            <button
              onClick={() => handleDelete(img.url)}
              disabled={processing[img.url]}
              className="bg-red-600 w-full py-1 rounded hover:bg-red-800 disabled:opacity-40"
            >
              {processing[img.url] ? "Deleting..." : "Delete"}
            </button>

            {errors[img.url] && (
              <p className="text-red-400 text-xs">{errors[img.url]}</p>
              
            )}
            <button
  onClick={() => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/upload/download?imageUrl=${encodeURIComponent(img.url)}`;
    link.download = img.url.split("/").pop() || "image.png";
    link.click();
  }}
  className="bg-blue-500 w-full py-1 rounded hover:bg-blue-700 mt-1"
>
  Download
</button>

{/* Show error message if exists */}
{errors[img.url] && (
  <p className="text-red-400 text-xs">{errors[img.url]}</p>
)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
