import { useEffect, useState, useRef } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import axiosInstance from "../api/axiosInstance";
import { io, Socket } from "socket.io-client";
import { toast } from "../components/Toast";

interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
  thumbnail?: string;
  type?: string;
  createdAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalImages: number;
  hasMore: boolean;
}

type StylePreset = "MrBeast" | "Vlog" | "Education" | "Gaming";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [style, setStyle] = useState<StylePreset>("MrBeast");
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [filterProcessed, setFilterProcessed] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);

  // Fetch user images with filters and pagination
  const fetchImages = async (page: number = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping image fetch. Please log in.");
      return;
    }

    try {
      const params: any = {
        page,
        limit: 20,
      };
      
      if (filterProcessed !== "all") {
        params.processed = filterProcessed === "processed";
      }
      
      if (filterType !== "all") {
        params.type = filterType;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const res = await getUserImages(params);
      setImages(res.images);
      setPagination(res.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast.error("Failed to fetch images");
        console.error("Failed to fetch images:", err);
      } else {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };

  // Socket.IO setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to Socket.IO
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server");
      // Extract user ID from token (simple decode - in production use proper JWT decode)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        socket.emit("join-user-room", payload.id);
      } catch (e) {
        console.error("Failed to extract user ID from token");
      }
    });

    socket.on("image-processed", (data: { type: string; imageUrl: string; originalUrl?: string }) => {
      toast.success(
        data.type === "background-removed"
          ? "Background removed successfully!"
          : data.type === "thumbnail-generated"
          ? "Thumbnail generated successfully!"
          : "Image uploaded successfully!"
      );
      fetchImages(currentPage); // Refresh current page
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [currentPage]);

  useEffect(() => {
    fetchImages(1);
  }, [filterProcessed, filterType, searchTerm]);

  // Upload image
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an image");
      return;
    }
    
    setUploading(true);
    try {
      await uploadImage(file);
      setFile(null);
      toast.success("Image uploaded successfully!");
      fetchImages(1); // Go to first page
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Upload failed";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Remove background
  const handleRemoveBG = async (imageUrl: string) => {
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    setErrors((prev) => ({ ...prev, [imageUrl]: "" }));
    try {
      await axiosInstance.post("/upload/remove-bg", { imageUrl });
      toast.success("Processing... You'll be notified when complete");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "BG removal failed";
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
      toast.error(errorMsg);
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
      toast.success("Processing... You'll be notified when complete");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Thumbnail generation failed";
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
      toast.error(errorMsg);
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
      toast.success("Image deleted");
      fetchImages(currentPage);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Delete failed";
      toast.error(errorMsg);
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
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
    if (selectedImages.length === 0) {
      toast.error("Select images first");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/upload/remove-bg/bulk", { imageUrls: selectedImages });
      toast.success(`Processing ${selectedImages.length} images...`);
      setSelectedImages([]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Bulk remove BG failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Generate Thumbnails
  const handleBulkGenerate = async () => {
    if (selectedImages.length === 0) {
      toast.error("Select images first");
      return;
    }
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
      toast.success(`Processing ${selectedImages.length} thumbnails...`);
      setSelectedImages([]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Bulk generate thumbnails failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Status badges
  const getStatusBadge = (img: ImageType) => {
    if (img.thumbnail || img.type === "thumbnail") return <span className="text-green-400 text-xs font-semibold">✓ Thumbnail</span>;
    if (img.processed || img.type === "bg_removed") return <span className="text-purple-400 text-xs font-semibold">✓ BG Removed</span>;
    return <span className="text-yellow-400 text-xs">Original</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Thumbnail Generator</h1>
          <a href="/profile" className="text-blue-400 hover:text-blue-300">Profile</a>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 space-y-3">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            className="bg-slate-700 p-2 rounded w-full"
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-gray-400">Selected: {file.name}</p>
          )}
          <div className="flex gap-3">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as StylePreset)}
              className="bg-slate-700 p-2 rounded flex-1"
            >
              <option>MrBeast</option>
              <option>Vlog</option>
              <option>Education</option>
              <option>Gaming</option>
            </select>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-blue-600 py-2 px-6 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 p-2 rounded"
          />
          <select
            value={filterProcessed}
            onChange={(e) => setFilterProcessed(e.target.value)}
            className="bg-slate-700 p-2 rounded"
          >
            <option value="all">All Images</option>
            <option value="processed">Processed</option>
            <option value="unprocessed">Unprocessed</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-700 p-2 rounded"
          >
            <option value="all">All Types</option>
            <option value="original">Original</option>
            <option value="bg_removed">BG Removed</option>
            <option value="thumbnail">Thumbnail</option>
          </select>
          <div className="text-sm text-gray-400 flex items-center">
            {pagination && `Total: ${pagination.totalImages} images`}
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {selectedImages.length > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleBulkRemoveBG}
              disabled={loading}
              className="bg-purple-600 py-2 px-4 rounded hover:bg-purple-800 disabled:opacity-50"
            >
              {loading ? "Processing..." : `Remove BG (${selectedImages.length})`}
            </button>
            <button
              onClick={handleBulkGenerate}
              disabled={loading}
              className="bg-green-600 py-2 px-4 rounded hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Processing..." : `Generate Thumbnails (${selectedImages.length})`}
            </button>
            <button
              onClick={() => setSelectedImages([])}
              className="bg-gray-600 py-2 px-4 rounded hover:bg-gray-700"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No images found. Upload an image to get started!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {images.map((img) => (
                <div
                  key={img._id || img.url}
                  className={`bg-slate-800 p-3 rounded space-y-2 transition ${
                    selectedImages.includes(img.url) ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={`http://localhost:5000/${img.thumbnail || img.url}`}
                      className="rounded h-40 w-full object-cover"
                      alt="Thumbnail"
                    />
                    {processing[img.url] && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  {/* Checkbox + filename + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
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
                    className="bg-slate-700 p-2 rounded w-full text-sm"
                  />

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRemoveBG(img.url)}
                      disabled={processing[img.url] || img.processed || img.type === "bg_removed"}
                      className="bg-purple-600 py-1.5 rounded hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {processing[img.url] ? "..." : "Remove BG"}
                    </button>

                    <button
                      onClick={() => handleGenerateThumbnail(img.url)}
                      disabled={processing[img.url] || (!img.processed && img.type !== "bg_removed") || img.type === "thumbnail"}
                      className="bg-green-600 py-1.5 rounded hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {processing[img.url] ? "..." : "Generate"}
                    </button>

                    <button
                      onClick={() => handleDelete(img.url)}
                      disabled={processing[img.url]}
                      className="bg-red-600 py-1.5 rounded hover:bg-red-800 disabled:opacity-40 text-sm"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `http://localhost:5000/upload/download?imageUrl=${encodeURIComponent(img.url)}`;
                        link.download = img.url.split("/").pop() || "image.png";
                        link.click();
                        toast.success("Download started");
                      }}
                      className="bg-blue-500 py-1.5 rounded hover:bg-blue-700 text-sm"
                    >
                      Download
                    </button>
                  </div>

                  {errors[img.url] && (
                    <p className="text-red-400 text-xs">{errors[img.url]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => fetchImages(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchImages(currentPage + 1)}
                  disabled={!pagination.hasMore}
                  className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
