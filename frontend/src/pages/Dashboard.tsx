import { useEffect, useState } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import axiosInstance from "../api/axiosInstance";

//Types

interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
}

type StylePreset = "MrBeast" | "Vlog" | "Education" | "Gaming";

   //Component


const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<StylePreset>("MrBeast");
  const [error, setError] = useState<string | null>(null);

  
     //Fetch Images
 

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getUserImages();
      setImages(res.images);
    } catch (err) {
      setError("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);


     //Upload Image


  const handleUpload = async () => {
    if (!file) return alert("Please select an image");

    try {
      setLoading(true);
      const res = await uploadImage(file);
      alert(res.message);
      setFile(null);
      await fetchImages();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };


    // Remove Background


  const handleRemoveBG = async (imageUrl: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/upload/remove-bg", {
        imageUrl,
        style,
      });

      alert(res.data.message);
      await fetchImages();
    } catch (err) {
      alert("Background removal failed");
    } finally {
      setLoading(false);
    }
  };

    //  Render

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        AI Thumbnail Generator
      </h1>

      {/* Upload Section */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 space-y-4">
        <input
          type="file"
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
          className="block"
        />

        {/* Style Selector */}
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
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* Images Grid */}
      {loading && <p>Processing...</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div
            key={img._id || idx}
            className="bg-slate-800 rounded-lg p-2"
          >
            <img
              src={`http://localhost:5000/${img.url}`}
              className="rounded mb-2 object-cover h-40 w-full"
              alt="thumbnail"
            />

            <button
              onClick={() => handleRemoveBG(img.url)}
              className="w-full bg-purple-600 hover:bg-purple-700 py-1 rounded"
              disabled={loading}
            >
              Remove Background
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <p className="text-center text-slate-400 mt-10">
          No images uploaded yet
        </p>
      )}
    </div>
  );
};

export default Dashboard;
