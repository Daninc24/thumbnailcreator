import React, { useState } from "react";
import { toast } from "./Toast";
import axiosInstance from "../api/axiosInstance";
import LoadingSpinner from "./LoadingSpinner";

interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
  thumbnail?: string;
  type?: string;
  createdAt?: string;
}

interface ImageCardProps {
  image: ImageType;
  isSelected: boolean;
  onToggleSelect: (url: string) => void;
  onDelete: (url: string) => void;
  onRemoveBG: (url: string) => void;
  onGenerateThumbnail: (url: string) => void;
  onCustomize?: (url: string) => void;
  onCreateVideo?: (url: string) => void;
  processing: Record<string, boolean>;
  errors: Record<string, string>;
  texts: Record<string, string>;
  onTextChange: (url: string, text: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSelected,
  onToggleSelect,
  onDelete,
  onRemoveBG,
  onGenerateThumbnail,
  onCustomize,
  onCreateVideo,
  processing,
  errors,
  texts,
  onTextChange,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getStatusBadge = () => {
    if (image.thumbnail || image.type === "thumbnail") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Thumbnail
        </span>
      );
    }
    if (image.processed || image.type === "bg_removed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          ✓ BG Removed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Original
      </span>
    );
  };

  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(
        `/upload/download?imageUrl=${encodeURIComponent(image.url)}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.url.split("/").pop() || "image.png";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl ${
        isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""
      }`}
    >
      {/* Image Preview */}
      <div className="relative aspect-video bg-slate-700">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" text="Loading..." />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Failed to load</p>
            </div>
          </div>
        ) : (
          // Check if it's a video file
          image.url.endsWith('.mp4') || image.type === 'video' || image.type === 'ai-video' ? (
            <video
              src={`http://localhost:5000/${image.url}`}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoadedData={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={`http://localhost:5000/${image.thumbnail || image.url}`}
              alt="Thumbnail"
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )
        )}

        {/* Processing Overlay */}
        {processing[image.url] && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <LoadingSpinner size="md" text="Processing..." />
          </div>
        )}

        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(image.url)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* File Info */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white truncate flex-1">
            {image.url.split("/").pop()}
          </h3>
          {image.createdAt && (
            <span className="text-xs text-gray-400 ml-2">
              {formatDate(image.createdAt)}
            </span>
          )}
        </div>

        {/* Thumbnail Text Input */}
        <div>
          <input
            type="text"
            placeholder="Enter thumbnail text..."
            value={texts[image.url] || ""}
            onChange={(e) => onTextChange(image.url, e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRemoveBG(image.url)}
              disabled={
                processing[image.url] ||
                image.processed ||
                image.type === "bg_removed"
              }
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {processing[image.url] ? "..." : "Remove BG"}
            </button>

            <button
              onClick={() => onGenerateThumbnail(image.url)}
              disabled={
                processing[image.url] ||
                (!image.processed && image.type !== "bg_removed") ||
                image.type === "thumbnail"
              }
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {processing[image.url] ? "..." : "Generate"}
            </button>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-2 gap-2">
            {/* Advanced Customize Button */}
            {onCustomize && (image.processed || image.type === "bg_removed") && image.type !== "thumbnail" && (
              <button
                onClick={() => onCustomize(image.url)}
                disabled={processing[image.url]}
                className="px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-md hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Customize</span>
              </button>
            )}

            {/* Create Video Button */}
            {onCreateVideo && (image.type === "thumbnail" || image.thumbnail) && (
              <button
                onClick={() => onCreateVideo(image.url)}
                disabled={processing[image.url]}
                className="px-3 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-md hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Video</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Download
            </button>

            <button
              onClick={() => onDelete(image.url)}
              disabled={processing[image.url]}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errors[image.url] && (
          <div className="p-2 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
            <p className="text-red-400 text-xs">{errors[image.url]}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCard;