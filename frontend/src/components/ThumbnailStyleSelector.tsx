import React from "react";

type StylePreset = "MrBeast" | "Vlog" | "Education" | "Gaming" | "Cinematic" | "Tech" | "Fitness" | "Food";

interface ThumbnailStyleSelectorProps {
  selectedStyle: StylePreset;
  onStyleChange: (style: StylePreset) => void;
}

const stylePresets = {
  MrBeast: {
    name: "MrBeast",
    description: "Bold yellow text with high impact",
    preview: "bg-gradient-to-r from-yellow-400 to-orange-500",
    textColor: "#FFD700",
    fontSize: 90,
    fontWeight: "900",
    shadow: "heavy"
  },
  Vlog: {
    name: "Vlog",
    description: "Clean white text for lifestyle content",
    preview: "bg-gradient-to-r from-gray-100 to-white",
    textColor: "#FFFFFF",
    fontSize: 70,
    fontWeight: "700",
    shadow: "medium"
  },
  Education: {
    name: "Education",
    description: "Professional cyan for learning content",
    preview: "bg-gradient-to-r from-cyan-400 to-blue-500",
    textColor: "#00FFAA",
    fontSize: 60,
    fontWeight: "600",
    shadow: "light"
  },
  Gaming: {
    name: "Gaming",
    description: "Vibrant red for gaming content",
    preview: "bg-gradient-to-r from-red-500 to-pink-600",
    textColor: "#FF004C",
    fontSize: 80,
    fontWeight: "800",
    shadow: "heavy"
  },
  Cinematic: {
    name: "Cinematic",
    description: "Elegant gold for movie reviews",
    preview: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    textColor: "#FFD700",
    fontSize: 65,
    fontWeight: "700",
    shadow: "medium"
  },
  Tech: {
    name: "Tech",
    description: "Modern blue for tech content",
    preview: "bg-gradient-to-r from-blue-500 to-indigo-600",
    textColor: "#00D4FF",
    fontSize: 70,
    fontWeight: "600",
    shadow: "light"
  },
  Fitness: {
    name: "Fitness",
    description: "Energetic green for fitness content",
    preview: "bg-gradient-to-r from-green-400 to-emerald-500",
    textColor: "#00FF88",
    fontSize: 75,
    fontWeight: "800",
    shadow: "medium"
  },
  Food: {
    name: "Food",
    description: "Warm orange for cooking content",
    preview: "bg-gradient-to-r from-orange-400 to-red-500",
    textColor: "#FF6B35",
    fontSize: 70,
    fontWeight: "700",
    shadow: "medium"
  }
};

const ThumbnailStyleSelector: React.FC<ThumbnailStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Thumbnail Style</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stylePresets).map(([key, style]) => (
          <button
            key={key}
            onClick={() => onStyleChange(key as StylePreset)}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedStyle === key
                ? "border-blue-500 bg-slate-700"
                : "border-slate-600 bg-slate-800 hover:border-slate-500"
            }`}
          >
            {/* Style Preview */}
            <div className={`w-full h-12 rounded-md mb-2 ${style.preview} flex items-center justify-center`}>
              <span 
                className="text-xs font-bold text-black"
                style={{ 
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  color: style.textColor === "#FFFFFF" ? "#000" : "#FFF"
                }}
              >
                SAMPLE
              </span>
            </div>
            
            {/* Style Info */}
            <div className="text-left">
              <h4 className="text-sm font-medium text-white">{style.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{style.description}</p>
            </div>
            
            {/* Selected Indicator */}
            {selectedStyle === key && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Style Details */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">
          {stylePresets[selectedStyle].name} Style Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <span className="font-medium">Font Size:</span> {stylePresets[selectedStyle].fontSize}px
          </div>
          <div>
            <span className="font-medium">Font Weight:</span> {stylePresets[selectedStyle].fontWeight}
          </div>
          <div>
            <span className="font-medium">Text Color:</span> {stylePresets[selectedStyle].textColor}
          </div>
          <div>
            <span className="font-medium">Shadow:</span> {stylePresets[selectedStyle].shadow}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailStyleSelector;
export type { StylePreset };