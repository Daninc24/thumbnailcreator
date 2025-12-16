import React, { useState, useEffect } from "react";
import type { ThumbnailTemplate, CustomizableTemplate } from "../types/templates";
import ThumbnailPreview from "./ThumbnailPreview";

interface ThumbnailCustomizerProps {
  template: ThumbnailTemplate;
  text: string;
  imageUrl: string;
  onCustomizationChange: (customizedTemplate: CustomizableTemplate) => void;
  onGenerate: (template: CustomizableTemplate, text: string) => void;
  processing: boolean;
}

const ThumbnailCustomizer: React.FC<ThumbnailCustomizerProps> = ({
  template,
  text,
  imageUrl,
  onCustomizationChange,
  onGenerate,
  processing
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "background" | "decorative" | "effects">("text");
  const [customTemplate, setCustomTemplate] = useState<CustomizableTemplate>(() => ({
    ...template,
    isCustom: false,
    originalTemplateId: template.id,
    customizations: {
      textConfig: {},
      backgroundEffects: {},
      decorativeElements: {}
    }
  }));

  const [presets, setPresets] = useState({
    fontFamilies: [
      { name: "Impact", value: "Impact, Arial Black, sans-serif" },
      { name: "Arial Black", value: "Arial Black, sans-serif" },
      { name: "Helvetica", value: "Helvetica Neue, Arial, sans-serif" },
      { name: "Roboto", value: "Roboto, Arial, sans-serif" },
      { name: "Montserrat", value: "Montserrat, sans-serif" },
      { name: "Oswald", value: "Oswald, sans-serif" },
      { name: "Bebas Neue", value: "Bebas Neue, cursive" },
      { name: "Orbitron", value: "Orbitron, monospace" },
      { name: "Righteous", value: "Righteous, cursive" },
      { name: "Bangers", value: "Bangers, cursive" },
      { name: "Fredoka One", value: "Fredoka One, cursive" },
      { name: "Comic Sans", value: "Comic Sans MS, cursive" },
      { name: "Times New Roman", value: "Times New Roman, serif" },
      { name: "Georgia", value: "Georgia, serif" },
      { name: "Playfair Display", value: "Playfair Display, serif" }
    ],
    colors: [
      "#FFD700", "#FF0000", "#00FF00", "#0000FF", "#FF69B4", "#00FFFF",
      "#FF4500", "#9400D3", "#32CD32", "#FF1493", "#00CED1", "#FFB6C1",
      "#FFFFFF", "#000000", "#808080", "#C0C0C0", "#800000", "#008000",
      "#000080", "#800080", "#008080", "#FFA500", "#A52A2A", "#5F9EA0"
    ]
  });

  useEffect(() => {
    onCustomizationChange(customTemplate);
  }, [customTemplate, onCustomizationChange]);

  const updateTextConfig = (key: string, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      isCustom: true,
      textConfig: {
        ...prev.textConfig,
        [key]: value
      },
      customizations: {
        ...prev.customizations,
        textConfig: {
          ...prev.customizations.textConfig,
          [key]: value
        }
      }
    }));
  };

  const updateBackgroundEffects = (category: string, key: string, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      isCustom: true,
      backgroundEffects: {
        ...prev.backgroundEffects,
        [category]: {
          ...prev.backgroundEffects?.[category as keyof typeof prev.backgroundEffects],
          [key]: value
        }
      },
      customizations: {
        ...prev.customizations,
        backgroundEffects: {
          ...prev.customizations.backgroundEffects,
          [category]: {
            ...prev.customizations.backgroundEffects?.[category as keyof typeof prev.customizations.backgroundEffects],
            [key]: value
          }
        }
      }
    }));
  };

  const updateDecorativeElements = (category: string, key: string, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      isCustom: true,
      decorativeElements: {
        ...prev.decorativeElements,
        [category]: {
          ...prev.decorativeElements?.[category as keyof typeof prev.decorativeElements],
          [key]: value
        }
      },
      customizations: {
        ...prev.customizations,
        decorativeElements: {
          ...prev.customizations.decorativeElements,
          [category]: {
            ...prev.customizations.decorativeElements?.[category as keyof typeof prev.customizations.decorativeElements],
            [key]: value
          }
        }
      }
    }));
  };

  const resetToOriginal = () => {
    setCustomTemplate({
      ...template,
      isCustom: false,
      originalTemplateId: template.id,
      customizations: {
        textConfig: {},
        backgroundEffects: {},
        decorativeElements: {}
      }
    });
  };

  const tabs = [
    { id: "text", name: "Text", icon: "📝" },
    { id: "background", name: "Background", icon: "🎨" },
    { id: "decorative", name: "Elements", icon: "✨" },
    { id: "effects", name: "Effects", icon: "🎭" }
  ];

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Customize Thumbnail
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {customTemplate.isCustom ? "Custom Template" : template.name} • {template.category}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {customTemplate.isCustom && (
              <button
                onClick={resetToOriginal}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => onGenerate(customTemplate, text)}
              disabled={processing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-700 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-slate-600"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Text Customization */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Text Settings</h3>
              
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                <select
                  value={customTemplate.textConfig.fontFamily || template.textConfig.fontFamily}
                  onChange={(e) => updateTextConfig("fontFamily", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {presets.fontFamilies.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Font Size: {customTemplate.textConfig.fontSize || template.textConfig.fontSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={customTemplate.textConfig.fontSize || template.textConfig.fontSize}
                  onChange={(e) => updateTextConfig("fontSize", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Font Weight: {customTemplate.textConfig.fontWeight || template.textConfig.fontWeight}
                </label>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="100"
                  value={customTemplate.textConfig.fontWeight || template.textConfig.fontWeight}
                  onChange={(e) => updateTextConfig("fontWeight", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={customTemplate.textConfig.color || template.textConfig.color}
                    onChange={(e) => updateTextConfig("color", e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customTemplate.textConfig.color || template.textConfig.color}
                    onChange={(e) => updateTextConfig("color", e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {presets.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateTextConfig("color", color)}
                      className="w-8 h-8 rounded border-2 border-slate-600 hover:border-slate-400 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stroke Color</label>
                  <input
                    type="color"
                    value={customTemplate.textConfig.strokeColor || "#000000"}
                    onChange={(e) => updateTextConfig("strokeColor", e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stroke Width: {customTemplate.textConfig.strokeWidth || 0}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={customTemplate.textConfig.strokeWidth || 0}
                    onChange={(e) => updateTextConfig("strokeWidth", parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Position */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text Position</label>
                <select
                  value={customTemplate.textConfig.position}
                  onChange={(e) => updateTextConfig("position", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="custom">Custom Position</option>
                </select>
              </div>

              {/* Custom Position */}
              {customTemplate.textConfig.position === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      X Position: {customTemplate.textConfig.customPosition?.x || 640}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1280"
                      value={customTemplate.textConfig.customPosition?.x || 640}
                      onChange={(e) => updateTextConfig("customPosition", {
                        ...customTemplate.textConfig.customPosition,
                        x: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Y Position: {customTemplate.textConfig.customPosition?.y || 360}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="720"
                      value={customTemplate.textConfig.customPosition?.y || 360}
                      onChange={(e) => updateTextConfig("customPosition", {
                        ...customTemplate.textConfig.customPosition,
                        y: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Text Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text Alignment</label>
                <div className="flex space-x-2">
                  {["left", "center", "right"].map((align) => (
                    <button
                      key={align}
                      onClick={() => updateTextConfig("alignment", align)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        customTemplate.textConfig.alignment === align
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Transform */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text Transform</label>
                <select
                  value={customTemplate.textConfig.textTransform}
                  onChange={(e) => updateTextConfig("textTransform", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Letter Spacing: {customTemplate.textConfig.letterSpacing || template.textConfig.letterSpacing || 0}px
                </label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  value={customTemplate.textConfig.letterSpacing || template.textConfig.letterSpacing || 0}
                  onChange={(e) => updateTextConfig("letterSpacing", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Text Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Text Rotation: {customTemplate.textConfig.rotation || template.textConfig.rotation || 0}°
                </label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={customTemplate.textConfig.rotation || template.textConfig.rotation || 0}
                  onChange={(e) => updateTextConfig("rotation", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Background Customization */}
          {activeTab === "background" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Background Effects</h3>
              
              {/* Overlay Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-300">Overlay</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Overlay Type</label>
                  <select
                    value={customTemplate.backgroundEffects?.overlay?.type || "none"}
                    onChange={(e) => updateBackgroundEffects("overlay", "type", e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {customTemplate.backgroundEffects?.overlay?.type !== "none" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                      <input
                        type="color"
                        value={customTemplate.backgroundEffects?.overlay?.color1 || "#000000"}
                        onChange={(e) => updateBackgroundEffects("overlay", "color1", e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-600 cursor-pointer"
                      />
                    </div>

                    {customTemplate.backgroundEffects?.overlay?.type === "gradient" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                        <input
                          type="color"
                          value={customTemplate.backgroundEffects?.overlay?.color2 || "#FFFFFF"}
                          onChange={(e) => updateBackgroundEffects("overlay", "color2", e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-600 cursor-pointer"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Opacity: {Math.round((customTemplate.backgroundEffects?.overlay?.opacity || 0.5) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={customTemplate.backgroundEffects?.overlay?.opacity || 0.5}
                        onChange={(e) => updateBackgroundEffects("overlay", "opacity", parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {customTemplate.backgroundEffects?.overlay?.type === "gradient" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Gradient Direction</label>
                        <select
                          value={customTemplate.backgroundEffects?.overlay?.direction || "vertical"}
                          onChange={(e) => updateBackgroundEffects("overlay", "direction", e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="horizontal">Horizontal</option>
                          <option value="vertical">Vertical</option>
                          <option value="diagonal">Diagonal</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Image Adjustments */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-300">Image Adjustments</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brightness: {customTemplate.backgroundEffects?.brightness?.value || 0}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={customTemplate.backgroundEffects?.brightness?.value || 0}
                    onChange={(e) => {
                      updateBackgroundEffects("brightness", "enabled", parseInt(e.target.value) !== 0);
                      updateBackgroundEffects("brightness", "value", parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contrast: {customTemplate.backgroundEffects?.contrast?.value || 0}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={customTemplate.backgroundEffects?.contrast?.value || 0}
                    onChange={(e) => {
                      updateBackgroundEffects("contrast", "enabled", parseInt(e.target.value) !== 0);
                      updateBackgroundEffects("contrast", "value", parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Saturation: {customTemplate.backgroundEffects?.saturation?.value || 0}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={customTemplate.backgroundEffects?.saturation?.value || 0}
                    onChange={(e) => {
                      updateBackgroundEffects("saturation", "enabled", parseInt(e.target.value) !== 0);
                      updateBackgroundEffects("saturation", "value", parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blur: {customTemplate.backgroundEffects?.blur?.intensity || 0}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={customTemplate.backgroundEffects?.blur?.intensity || 0}
                    onChange={(e) => {
                      updateBackgroundEffects("blur", "enabled", parseInt(e.target.value) > 0);
                      updateBackgroundEffects("blur", "intensity", parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Decorative Elements */}
          {activeTab === "decorative" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Decorative Elements</h3>
              
              {/* Borders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-300">Border</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customTemplate.decorativeElements?.borders?.enabled || false}
                      onChange={(e) => updateDecorativeElements("borders", "enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {customTemplate.decorativeElements?.borders?.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Border Color</label>
                      <input
                        type="color"
                        value={customTemplate.decorativeElements?.borders?.color || "#FFFFFF"}
                        onChange={(e) => updateDecorativeElements("borders", "color", e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Border Width: {customTemplate.decorativeElements?.borders?.width || 2}px
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={customTemplate.decorativeElements?.borders?.width || 2}
                        onChange={(e) => updateDecorativeElements("borders", "width", parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Border Style</label>
                      <select
                        value={customTemplate.decorativeElements?.borders?.style || "solid"}
                        onChange={(e) => updateDecorativeElements("borders", "style", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Border Radius: {customTemplate.decorativeElements?.borders?.radius || 0}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={customTemplate.decorativeElements?.borders?.radius || 0}
                        onChange={(e) => updateDecorativeElements("borders", "radius", parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Effects Tab */}
          {activeTab === "effects" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Advanced Effects</h3>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">
                  Advanced effects like animations and particles will be available in the next update.
                  Current effects include text shadows, borders, and background overlays.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Live Preview</h3>
          <ThumbnailPreview
            imageUrl={imageUrl}
            text={text}
            template={customTemplate}
            className="sticky top-4"
          />
          
          {/* Template Info */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-2">Template Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={customTemplate.isCustom ? "text-yellow-400" : "text-green-400"}>
                  {customTemplate.isCustom ? "Customized" : "Original"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white capitalize">{template.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Difficulty:</span>
                <span className="text-white capitalize">{template.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailCustomizer;