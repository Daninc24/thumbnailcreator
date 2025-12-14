import { useEffect, useState } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import axiosInstance from "../api/axiosInstance";

// Types
interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
}

type StylePreset = "MrBeast" | "Vlog" | "Education" | "Gaming";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<StylePreset>("MrBeast");
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>("");

  // Fetch images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getUserImages();
      setImages(res.images);
    } catch {
      setError("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Upload
  const handleUpload = async () => {
    if (!file) return alert("Select an image");

    try {
      setLoading(true);
      await uploadImage(file);
      setFile(null);
      await fetchImages();
    } catch {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Remove background
  const handleRemoveBG = async (imageUrl: string) => {
    try {
      setLoading(true);
      await axiosInstance.post("/upload/remove-bg", { imageUrl });
      await fetchImages();
    } catch {
      alert("Background removal failed");
    } finally {
      setLoading(false);
    }
  };

  // Generate thumbnails
const handleGenerateThumbnail = async (imageUrl: string) => {
  setLoading(true);
  await axiosInstance.post("/upload/generate-thumbnail", {
    imageUrl,
    style,
    text,
  });
  await fetchImages();
  setLoading(false);
};


  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">AI Thumbnail Generator</h1>

      {/* Upload */}
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
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 py-2 rounded w-full"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img._id} className="bg-slate-800 p-2 rounded">
            <img
              src={`http://localhost:5000/${img.url}`}
              className="rounded h-40 w-full object-cover mb-2"
            />

            <div className="space-y-2">
              <button
                onClick={() => handleRemoveBG(img.url)}
                className="bg-purple-600 w-full rounded py-1"
              >
                Remove BG
              </button>
              <input
                placeholder="Thumbnail text (optional)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
              />

              <input
                placeholder="Thumbnail text (optional)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
              />

              <button
                onClick={() => handleGenerateThumbnail(img.url)}
                className="w-full bg-green-600 hover:bg-green-700 py-1 rounded mt-2"
              >
                Generate Thumbnails
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && images.length === 0 && (
        <p className="text-center text-slate-400 mt-10">
          No images uploaded yet
        </p>
      )}
    </div>
  );
};

export default Dashboard;
