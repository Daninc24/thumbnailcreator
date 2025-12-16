import React, { useState, useEffect } from "react";
import { toast } from "./Toast";

interface ContentCreationAssistantProps {
  onTextSuggestion: (text: string) => void;
  onColorSuggestion: (color: string) => void;
  onTemplateSuggestion: (templateId: string) => void;
  currentText: string;
  category: string;
}

interface ContentAnalysis {
  readability: number;
  engagement: number;
  length: "short" | "medium" | "long";
  suggestions: string[];
  colorRecommendations: string[];
}

const ContentCreationAssistant: React.FC<ContentCreationAssistantProps> = ({
  onTextSuggestion,
  onColorSuggestion,
  onTemplateSuggestion,
  currentText,
  category
}) => {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Analyze text content for readability and engagement
  const analyzeContent = (text: string): ContentAnalysis => {
    const words = text.split(' ').filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    
    // Readability score (0-100)
    let readability = 100;
    if (wordCount > 8) readability -= (wordCount - 8) * 5; // Penalty for too many words
    if (charCount > 50) readability -= (charCount - 50) * 2; // Penalty for too many characters
    if (text.includes('!')) readability += 10; // Bonus for excitement
    if (text.toUpperCase() === text && text.length > 0) readability += 15; // Bonus for caps
    readability = Math.max(0, Math.min(100, readability));

    // Engagement score (0-100)
    let engagement = 50;
    const powerWords = ['AMAZING', 'INCREDIBLE', 'SHOCKING', 'EPIC', 'INSANE', 'ULTIMATE', 'SECRET', 'EXCLUSIVE'];
    const emotionalWords = ['YOU', 'YOUR', 'WON\'T', 'BELIEVE', 'MUST', 'SEE', 'NOW', 'TODAY'];
    
    powerWords.forEach(word => {
      if (text.toUpperCase().includes(word)) engagement += 8;
    });
    
    emotionalWords.forEach(word => {
      if (text.toUpperCase().includes(word)) engagement += 5;
    });
    
    if (text.includes('?')) engagement += 10; // Questions engage
    if (text.includes('!')) engagement += 8; // Excitement engages
    if (wordCount >= 3 && wordCount <= 6) engagement += 15; // Optimal length
    
    engagement = Math.max(0, Math.min(100, engagement));

    // Length classification
    let length: "short" | "medium" | "long" = "medium";
    if (wordCount <= 3) length = "short";
    else if (wordCount >= 8) length = "long";

    // Generate suggestions
    const suggestions: string[] = [];
    if (readability < 70) {
      suggestions.push("Consider shortening your text for better readability");
    }
    if (engagement < 60) {
      suggestions.push("Add power words like 'AMAZING' or 'INCREDIBLE' to increase engagement");
    }
    if (!text.includes('!') && !text.includes('?')) {
      suggestions.push("Add punctuation (! or ?) to make it more exciting");
    }
    if (text.toLowerCase() === text) {
      suggestions.push("Use UPPERCASE for key words to grab attention");
    }
    if (wordCount > 8) {
      suggestions.push("Try to keep it under 8 words for mobile readability");
    }

    // Color recommendations based on category and content
    const colorRecommendations = getCategoryColors(category, text);

    return {
      readability,
      engagement,
      length,
      suggestions,
      colorRecommendations
    };
  };

  const getCategoryColors = (category: string, text: string): string[] => {
    const categoryColors: Record<string, string[]> = {
      gaming: ["#FF0000", "#00FF00", "#FFD700", "#FF4500", "#9400D3"],
      vlog: ["#FF69B4", "#00BFFF", "#FFD700", "#32CD32", "#FF6347"],
      education: ["#4169E1", "#228B22", "#FF8C00", "#DC143C", "#8A2BE2"],
      business: ["#2F4F4F", "#B8860B", "#CD853F", "#4682B4", "#6B8E23"],
      entertainment: ["#FF1493", "#00CED1", "#FFD700", "#FF4500", "#9370DB"],
      tech: ["#00FFFF", "#7FFF00", "#FF6347", "#4169E1", "#FF8C00"],
      fitness: ["#32CD32", "#FF4500", "#FFD700", "#DC143C", "#00BFFF"],
      food: ["#FF6347", "#FFD700", "#32CD32", "#FF69B4", "#FF8C00"]
    };

    let colors = categoryColors[category] || categoryColors.entertainment;
    
    // Adjust colors based on text content
    if (text.toUpperCase().includes('HOT') || text.toUpperCase().includes('FIRE')) {
      colors = ["#FF0000", "#FF4500", "#FFD700"];
    } else if (text.toUpperCase().includes('COOL') || text.toUpperCase().includes('ICE')) {
      colors = ["#00BFFF", "#00FFFF", "#4169E1"];
    } else if (text.toUpperCase().includes('GOLD') || text.toUpperCase().includes('MONEY')) {
      colors = ["#FFD700", "#B8860B", "#DAA520"];
    }

    return colors;
  };

  useEffect(() => {
    if (currentText.trim()) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        const newAnalysis = analyzeContent(currentText);
        setAnalysis(newAnalysis);
        setIsAnalyzing(false);
      }, 500); // Debounce analysis

      return () => clearTimeout(timer);
    } else {
      setAnalysis(null);
    }
  }, [currentText]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const contentTips = [
    {
      title: "Keep it Short",
      description: "3-6 words work best for thumbnails",
      icon: "📏"
    },
    {
      title: "Use Power Words",
      description: "AMAZING, INCREDIBLE, SHOCKING grab attention",
      icon: "💪"
    },
    {
      title: "Add Emotion",
      description: "Use ! and ? to create excitement",
      icon: "😱"
    },
    {
      title: "Think Mobile",
      description: "Most viewers see thumbnails on phones",
      icon: "📱"
    },
    {
      title: "Test Colors",
      description: "High contrast colors stand out more",
      icon: "🎨"
    },
    {
      title: "Be Specific",
      description: "Specific promises perform better than vague ones",
      icon: "🎯"
    }
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Content Assistant
        </h3>
        
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Content Analysis */}
      {currentText.trim() && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">Content Analysis</h4>
          
          {isAnalyzing ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
              <span>Analyzing content...</span>
            </div>
          ) : analysis && (
            <div className="space-y-3">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.readability)}`}>
                    {Math.round(analysis.readability)}%
                  </div>
                  <div className="text-sm text-gray-400">Readability</div>
                  <div className={`text-xs ${getScoreColor(analysis.readability)}`}>
                    {getScoreLabel(analysis.readability)}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.engagement)}`}>
                    {Math.round(analysis.engagement)}%
                  </div>
                  <div className="text-sm text-gray-400">Engagement</div>
                  <div className={`text-xs ${getScoreColor(analysis.engagement)}`}>
                    {getScoreLabel(analysis.engagement)}
                  </div>
                </div>
              </div>

              {/* Text Stats */}
              <div className="flex justify-between text-sm text-gray-400">
                <span>Length: <span className="text-white">{analysis.length}</span></span>
                <span>Words: <span className="text-white">{currentText.split(' ').filter(w => w).length}</span></span>
                <span>Characters: <span className="text-white">{currentText.length}</span></span>
              </div>

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Suggestions:</h5>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-gray-400 flex items-start">
                        <span className="text-yellow-400 mr-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Color Recommendations */}
              {analysis.colorRecommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Recommended Colors:</h5>
                  <div className="flex space-x-2">
                    {analysis.colorRecommendations.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => onColorSuggestion(color)}
                        className="w-8 h-8 rounded border-2 border-slate-600 hover:border-slate-400 transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={`Use ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Tips */}
      {showTips && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">Pro Tips</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contentTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-lg">{tip.icon}</span>
                <div>
                  <h5 className="text-sm font-medium text-white">{tip.title}</h5>
                  <p className="text-xs text-gray-400">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTextSuggestion(currentText.toUpperCase())}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          MAKE UPPERCASE
        </button>
        <button
          onClick={() => onTextSuggestion(currentText + "!")}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          Add Excitement!
        </button>
        <button
          onClick={() => onTextSuggestion(currentText + "?")}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
        >
          Make Question?
        </button>
      </div>
    </div>
  );
};

export default ContentCreationAssistant;