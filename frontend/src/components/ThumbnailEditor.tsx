import React, { useState } from "react";
import ThumbnailTemplateSelector from "./ThumbnailTemplateSelector";
import ThumbnailPreview from "./ThumbnailPreview";
import { toast } from "./Toast";
import { thumbnailTemplates, type ThumbnailTemplate } from "../types/templates";

interface ThumbnailEditorProps {
  imageUrl: string;
  onGenerate: (imageUrl: string, template: ThumbnailTemplate, text: string) => void;
  processing: boolean;
}

const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({
  imageUrl,
  onGenerate,
  processing
}) => {
  const [text, setText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate | null>(thumbnailTemplates[0]);
  const [showPreview, setShowPreview] = useState(true);

  const handleGenerate = () => {
    if (!text.trim()) {
      toast.error("Please enter some text for the thumbnail");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    onGenerate(imageUrl, selectedTemplate, text);
  };

  const getSuggestedTexts = () => {
    if (!selectedTemplate) return [];
    
    const categoryTexts = {
      gaming: ["EPIC WIN!", "GAME OVER", "LEGENDARY", "BOSS FIGHT", "NEW RECORD"],
      vlog: ["MY STORY", "DAILY LIFE", "BEHIND SCENES", "REAL TALK", "HONEST REVIEW"],
      education: ["LEARN THIS", "TUTORIAL", "STEP BY STEP", "EXPLAINED", "MASTERCLASS"],
      business: ["SUCCESS TIPS", "STRATEGY", "RESULTS", "GROWTH HACK", "PROFIT"],
      entertainment: ["HILARIOUS", "MUST WATCH", "SHOCKING", "INCREDIBLE", "VIRAL"],
      tech: ["REVIEW", "UNBOXING", "COMPARISON", "TECH NEWS", "INNOVATION"],
      fitness: ["WORKOUT", "TRANSFORM", "STRONG", "FITNESS TIPS", "RESULTS"],
      food: ["DELICIOUS", "RECIPE", "COOKING", "TASTY", "FOODIE"]
    };
    
    return categoryTexts[selectedTemplate.category] || [
      "AMAZING RESULTS!",
      "YOU WON'T BELIEVE THIS",
      "SHOCKING TRUTH",
      "MUST WATCH",
      "INCREDIBLE"
    ];
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Thumbnail Editor
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Template Selector */}
          <ThumbnailTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Thumbnail Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selectedTemplate ? 
                `Enter text for ${selectedTemplate.name} template...` : 
                "Enter your thumbnail text..."
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={selectedTemplate?.textConfig.maxLines || 3}
              maxLength={selectedTemplate?.textConfig.maxLines === 1 ? 50 : 100}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                {text.length}/{selectedTemplate?.textConfig.maxLines === 1 ? 50 : 100} characters
              </span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>
          </div>

          {/* Suggested Texts */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Suggestions for {selectedTemplate?.category || "General"}
            </label>
            <div className="flex flex-wrap gap-2">
              {getSuggestedTexts().map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setText(suggestion)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleGenerate}
              disabled={processing || !text.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Generate Thumbnail</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Live Preview
            </label>
            <ThumbnailPreview
              imageUrl={imageUrl}
              text={text}
              template={selectedTemplate}
              className="sticky top-4"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailEditor;