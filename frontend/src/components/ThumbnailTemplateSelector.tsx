import React, { useState } from "react";
import { thumbnailTemplates, type ThumbnailTemplate } from "../types/templates";

interface ThumbnailTemplateSelectorProps {
  selectedTemplate: ThumbnailTemplate | null;
  onTemplateChange: (template: ThumbnailTemplate) => void;
}

const ThumbnailTemplateSelector: React.FC<ThumbnailTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", name: "All Templates", icon: "🎨" },
    { id: "gaming", name: "Gaming", icon: "🎮" },
    { id: "vlog", name: "Vlog", icon: "📹" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "business", name: "Business", icon: "💼" },
    { id: "entertainment", name: "Entertainment", icon: "🎭" },
    { id: "tech", name: "Tech", icon: "💻" },
    { id: "fitness", name: "Fitness", icon: "💪" },
    { id: "food", name: "Food", icon: "🍕" },
  ];

  const filteredTemplates = thumbnailTemplates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPreviewStyle = (template: ThumbnailTemplate) => {
    const { textConfig } = template;
    return {
      fontSize: `${Math.max(textConfig.fontSize * 0.2, 12)}px`,
      fontFamily: textConfig.fontFamily,
      color: textConfig.color,
      textShadow: textConfig.textShadow ? 
        textConfig.textShadow.replace(/(\d+)px/g, (_, num) => `${Math.max(parseInt(num) * 0.3, 1)}px`) : 
        undefined,
      WebkitTextStroke: textConfig.strokeColor && textConfig.strokeWidth ? 
        `${Math.max(textConfig.strokeWidth * 0.3, 0.5)}px ${textConfig.strokeColor}` : 
        undefined,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Choose Template</h3>
        <div className="text-sm text-gray-400">
          {filteredTemplates.length} templates available
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              selectedCategory === category.id
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedTemplate?.id === template.id
                ? "border-blue-500 bg-slate-700 ring-2 ring-blue-500 ring-opacity-50"
                : "border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700"
            }`}
          >
            {/* Template Preview */}
            <div className={`w-full h-20 rounded-md mb-3 ${template.preview} flex items-center justify-center relative overflow-hidden`}>
              {/* Background Effects Preview */}
              {template.backgroundEffects?.overlay && (
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
              
              {/* Sample Text */}
              <span 
                className="font-bold text-center z-10 relative px-2"
                style={getPreviewStyle(template)}
              >
                SAMPLE
              </span>
              
              {/* Decorative Elements Preview */}
              {template.decorativeElements?.shapes?.map((shape, index) => (
                <div
                  key={index}
                  className={`absolute w-2 h-2 ${
                    shape.type === "circle" ? "rounded-full" : 
                    shape.type === "triangle" ? "transform rotate-45" : ""
                  }`}
                  style={{
                    backgroundColor: shape.color,
                    [shape.position.includes("top") ? "top" : "bottom"]: "4px",
                    [shape.position.includes("left") ? "left" : "right"]: "4px",
                  }}
                />
              ))}
              
              {/* Border Preview */}
              {template.decorativeElements?.borders?.enabled && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    border: `1px ${template.decorativeElements.borders.style} ${template.decorativeElements.borders.color}`,
                  }}
                />
              )}
            </div>
            
            {/* Template Info */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">{template.name}</h4>
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{template.description}</p>
              
              {/* Category Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600 text-gray-300">
                  {categories.find(c => c.id === template.category)?.icon} {template.category}
                </span>
                
                {/* Selected Indicator */}
                {selectedTemplate?.id === template.id && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.5-2.709" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mt-2">No templates found</h3>
          <p className="text-gray-400 mt-1">Try adjusting your search or category filter</p>
        </div>
      )}

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-2">{selectedTemplate.name}</h4>
          <p className="text-sm text-gray-400 mb-3">{selectedTemplate.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium text-gray-300">Font:</span>
              <span className="text-gray-400 ml-2">{selectedTemplate.textConfig.fontFamily.split(',')[0]}</span>
            </div>
            <div>
              <span className="font-medium text-gray-300">Size:</span>
              <span className="text-gray-400 ml-2">{selectedTemplate.textConfig.fontSize}px</span>
            </div>
            <div>
              <span className="font-medium text-gray-300">Position:</span>
              <span className="text-gray-400 ml-2 capitalize">{selectedTemplate.textConfig.position}</span>
            </div>
            <div>
              <span className="font-medium text-gray-300">Max Lines:</span>
              <span className="text-gray-400 ml-2">{selectedTemplate.textConfig.maxLines}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailTemplateSelector;