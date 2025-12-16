import React, { useState } from "react";
import { generateAIVideo, getPlatformSettings } from "../api/video";
import type { AIVideoGenerationRequest } from "../api/video";
import { toast } from "./Toast";
import LoadingSpinner from "./LoadingSpinner";

interface AIVideoGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoGenerated?: (videoId: string) => void;
}

const AIVideoGenerator: React.FC<AIVideoGeneratorProps> = ({
  isOpen,
  onClose,
  onVideoGenerated
}) => {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram" | "universal">("youtube");
  const [duration, setDuration] = useState(15);
  const [style, setStyle] = useState<"modern" | "minimalist" | "energetic" | "professional" | "fun" | "dramatic">("modern");
  const [includeText, setIncludeText] = useState(true);
  const [includeMusic, setIncludeMusic] = useState(false);
  const [colorScheme, setColorScheme] = useState("#4F46E5");
  const [isGenerating, setIsGenerating] = useState(false);

  const platformSettings = getPlatformSettings(platform);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    setIsGenerating(true);

    try {
      const request: AIVideoGenerationRequest = {
        prompt: prompt.trim(),
        platform,
        duration,
        style,
        includeText,
        includeMusic,
        colorScheme
      };

      const response = await generateAIVideo(request);
      toast.success("AI video generation started! You'll be notified when it's ready.");
      
      if (onVideoGenerated) {
        onVideoGenerated(response.videoId);
      }
      
      onClose();
    } catch (error: any) {
      console.error("AI video generation failed:", error);
      toast.error(error.response?.data?.message || "Failed to generate AI video");
    } finally {
      setIsGenerating(false);
    }
  };

  const promptSuggestions = [
    "Create a motivational video about achieving goals",
    "Make a fun cooking tip video for social media",
    "Generate a tech review intro with modern graphics",
    "Create an educational video about space exploration",
    "Make a fitness motivation video with energetic vibes",
    "Generate a travel destination showcase video",
    "Create a product launch announcement video",
    "Make a behind-the-scenes content creator video"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-7 h-7 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Video Generator
              </h2>
              <p className="text-gray-400 mt-1">Create engaging videos from text descriptions using AI</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Video Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video Description *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create... (e.g., 'Create a motivational video about achieving your dreams with inspiring text and modern graphics')"
              className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">{prompt.length}/500 characters</span>
              <span className="text-xs text-gray-400">Be specific for better results</span>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Suggestions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => {
                  const newPlatform = e.target.value as typeof platform;
                  setPlatform(newPlatform);
                  const settings = getPlatformSettings(newPlatform);
                  setDuration(settings.recommendedDuration);
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="youtube">YouTube Shorts (9:16, up to 60s)</option>
                <option value="tiktok">TikTok (9:16, up to 60s)</option>
                <option value="instagram">Instagram Reels (9:16, up to 90s)</option>
                <option value="universal">Universal (16:9, flexible)</option>
              </select>
              <div className="mt-2 text-xs text-gray-400">
                Resolution: {platformSettings.resolution.width}x{platformSettings.resolution.height}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration: {duration}s
              </label>
              <input
                type="range"
                min="5"
                max={platformSettings.maxDuration}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5s</span>
                <span>Recommended: {platformSettings.recommendedDuration}s</span>
                <span>{platformSettings.maxDuration}s</span>
              </div>
            </div>
          </div>

          {/* Style and Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as typeof style)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="modern">Modern - Clean and contemporary</option>
                <option value="minimalist">Minimalist - Simple and elegant</option>
                <option value="energetic">Energetic - Bold and dynamic</option>
                <option value="professional">Professional - Business-focused</option>
                <option value="fun">Fun - Playful and colorful</option>
                <option value="dramatic">Dramatic - Cinematic and intense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color Scheme
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="#4F46E5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Content Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-300">Include animated text overlays</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeMusic}
                  onChange={(e) => setIncludeMusic(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-300">Add background music (coming soon)</span>
              </label>
            </div>
          </div>

          {/* AI Tips */}
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-200 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              AI Tips for Better Results
            </h3>
            <ul className="text-xs text-purple-100 space-y-1">
              <li>• Be specific about the mood and style you want</li>
              <li>• Mention key elements like "bold text", "smooth transitions", "vibrant colors"</li>
              <li>• Include the target audience (e.g., "for young entrepreneurs", "for fitness enthusiasts")</li>
              <li>• Specify the main message or call-to-action</li>
            </ul>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate AI Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVideoGenerator;