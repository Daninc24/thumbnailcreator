import React, { useState, useEffect } from "react";
import type { ThumbnailTemplate } from "../types/templates";

interface ThumbnailPreviewProps {
  imageUrl?: string;
  text: string;
  template: ThumbnailTemplate | null;
  className?: string;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  imageUrl,
  text,
  template,
  className = ""
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  const getTextStyle = () => {
    if (!template) return {};
    
    const { textConfig } = template;
    return {
      fontSize: `clamp(${Math.max(textConfig.fontSize * 0.3, 14)}px, 4vw, ${Math.max(textConfig.fontSize * 0.5, 24)}px)`,
      fontFamily: textConfig.fontFamily,
      color: textConfig.color,
      textShadow: textConfig.textShadow,
      WebkitTextStroke: textConfig.strokeColor && textConfig.strokeWidth ? 
        `${Math.max(textConfig.strokeWidth * 0.4, 1)}px ${textConfig.strokeColor}` : 
        undefined,
      lineHeight: textConfig.lineHeight,
    };
  };

  const getTextPosition = () => {
    if (!template) return "items-end justify-center pb-8";
    
    const { position } = template.textConfig;
    switch (position) {
      case "top":
        return "items-start justify-center pt-8";
      case "center":
        return "items-center justify-center";
      case "bottom":
        return "items-end justify-center pb-8";
      case "top-left":
        return "items-start justify-start pt-8 pl-8";
      case "top-right":
        return "items-start justify-end pt-8 pr-8";
      case "bottom-left":
        return "items-end justify-start pb-8 pl-8";
      case "bottom-right":
        return "items-end justify-end pb-8 pr-8";
      default:
        return "items-end justify-center pb-8";
    }
  };

  const getTextAlignment = () => {
    if (!template) return "text-center";
    return `text-${template.textConfig.alignment}`;
  };

  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      // Check if imageUrl already includes the full URL
      if (imageUrl.startsWith('http')) {
        setPreviewUrl(imageUrl);
      } else {
        setPreviewUrl(`http://localhost:5000/${imageUrl}`);
      }
      console.log("ThumbnailPreview setting previewUrl:", imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl}`);
    } else {
      setPreviewUrl("");
      setImageLoading(false);
    }
  }, [imageUrl]);

  return (
    <div className={`relative bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      <div className="aspect-video relative bg-gradient-to-br from-slate-700 to-slate-800">
        {/* Background Image */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Image failed to load:", previewUrl);
              setImageLoading(false);
              setPreviewUrl("");
            }}
            onLoad={() => {
              console.log("Image loaded successfully:", previewUrl);
              setImageLoading(false);
            }}
          />
        ) : imageLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm">Loading image...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">{imageUrl ? "Failed to load image" : "No image selected"}</p>
              {imageUrl && (
                <p className="text-xs text-red-400 mt-2">
                  URL: {imageUrl}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Background Effects */}
        {template?.backgroundEffects?.overlay && (
          <div 
            className="absolute inset-0"
            style={{
              background: template.backgroundEffects.overlay.type === "gradient" 
                ? `linear-gradient(${template.backgroundEffects.overlay.direction === "vertical" ? "to bottom" : 
                    template.backgroundEffects.overlay.direction === "horizontal" ? "to right" : "45deg"}, 
                    ${template.backgroundEffects.overlay.color1}, 
                    ${template.backgroundEffects.overlay.color2 || template.backgroundEffects.overlay.color1})` 
                : template.backgroundEffects.overlay.color1,
              opacity: template.backgroundEffects.overlay.opacity
            }}
          />
        )}

        {/* Decorative Elements */}
        {template?.decorativeElements?.shapes?.map((shape, index) => (
          <div
            key={index}
            className={`absolute ${
              shape.type === "circle" ? "rounded-full" : 
              shape.type === "triangle" ? "transform rotate-45" : 
              shape.type === "star" ? "transform rotate-12" : ""
            }`}
            style={{
              width: `${shape.size * 0.3}px`,
              height: `${shape.size * 0.3}px`,
              backgroundColor: shape.color,
              [shape.position.includes("top") ? "top" : "bottom"]: "8px",
              [shape.position.includes("left") ? "left" : "right"]: "8px",
            }}
          />
        ))}

        {/* Badges */}
        {template?.decorativeElements?.badges?.map((badge, index) => (
          <div
            key={index}
            className={`absolute px-2 py-1 text-xs font-bold rounded`}
            style={{
              backgroundColor: badge.backgroundColor,
              color: badge.color,
              [badge.position.includes("top") ? "top" : "bottom"]: "8px",
              [badge.position.includes("left") ? "left" : "right"]: "8px",
            }}
          >
            {badge.text}
          </div>
        ))}

        {/* Text Overlay */}
        {text && template && (
          <div className={`absolute inset-0 flex ${getTextPosition()}`}>
            <div
              className={`font-black uppercase leading-tight px-4 ${getTextAlignment()}`}
              style={{
                ...getTextStyle(),
                maxWidth: "90%",
                wordWrap: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: template.textConfig.maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {text}
            </div>
          </div>
        )}

        {/* Template Badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {template?.name || "No Template"}
          </span>
        </div>

        {/* Border */}
        {template?.decorativeElements?.borders?.enabled && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              border: `${template.decorativeElements.borders.width}px ${template.decorativeElements.borders.style} ${template.decorativeElements.borders.color}`,
            }}
          />
        )}
      </div>

      {/* Preview Info */}
      <div className="p-3 bg-slate-800">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Preview</span>
          <span>1280 × 720</span>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailPreview;