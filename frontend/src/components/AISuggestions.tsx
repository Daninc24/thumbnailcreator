import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "./Toast";

interface Suggestion {
  id: string;
  text: string;
  category: string;
  style: string;
  confidence: number;
  keywords?: string[];
  length: number;
  wordCount: number;
}

interface AISuggestionsProps {
  category?: string;
  keywords?: string;
  onSuggestionSelect: (text: string) => void;
  className?: string;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({
  category = "entertainment",
  keywords = "",
  onSuggestionSelect,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<"engaging" | "professional" | "creative">("engaging");
  const [customKeywords, setCustomKeywords] = useState(keywords);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/ai/suggestions/generate", {
        category,
        keywords: customKeywords || keywords,
        style
      });
      
      setSuggestions(response.data.suggestions);
      toast.success(`Generated ${response.data.suggestions.length} AI suggestions!`);
    } catch (error: any) {
      console.error("Failed to generate suggestions:", error);
      toast.error(error?.response?.data?.message || "Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keywords) {
      setCustomKeywords(keywords);
    }
  }, [keywords]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">AI Suggestions</h3>
        </div>
        
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate</span>
            </>
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Keywords</label>
          <input
            type="text"
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            placeholder="Enter keywords separated by commas..."
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
          <div className="flex space-x-2">
            {[
              { value: "engaging", label: "Engaging", icon: "🔥" },
              { value: "professional", label: "Professional", icon: "💼" },
              { value: "creative", label: "Creative", icon: "🎨" }
            ].map((styleOption) => (
              <button
                key={styleOption.value}
                onClick={() => setStyle(styleOption.value as any)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                  style === styleOption.value
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                <span>{styleOption.icon}</span>
                <span>{styleOption.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Click to use:</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => onSuggestionSelect(suggestion.text)}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                      {suggestion.text}
                    </p>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                      <span>{suggestion.wordCount} words</span>
                      <span>{suggestion.length} chars</span>
                      <span className={getConfidenceColor(suggestion.confidence)}>
                        {getConfidenceLabel(suggestion.confidence)} confidence
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-400 text-sm">
            Click "Generate" to get AI-powered thumbnail text suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;