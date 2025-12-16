import React, { useState, useEffect, useRef } from "react";
import type { ThumbnailTemplate, CustomizableTemplate } from "../types/templates";

interface AdvancedTemplateEditorProps {
  template: ThumbnailTemplate;
  imageUrl: string;
  onTemplateChange: (template: CustomizableTemplate) => void;
  onSave: (template: CustomizableTemplate, name: string) => void;
  onClose: () => void;
}

interface Layer {
  id: string;
  type: "text" | "shape" | "image" | "effect";
  name: string;
  visible: boolean;
  locked: boolean;
  properties: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
}

const AdvancedTemplateEditor: React.FC<AdvancedTemplateEditorProps> = ({
  template,
  imageUrl,
  // onTemplateChange, // Unused parameter
  onSave,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"layers" | "properties" | "assets">("layers");
  const [templateName, setTemplateName] = useState(`${template.name} - Custom`);
  // const [isDragging, setIsDragging] = useState(false); // Unused state
  // const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Unused state
  const [zoom, setZoom] = useState(1);
  const [canvasSize] = useState({ width: 1280, height: 720 });

  // Initialize layers from template
  useEffect(() => {
    const initialLayers: Layer[] = [
      {
        id: "background",
        type: "image",
        name: "Background Image",
        visible: true,
        locked: false,
        properties: { src: imageUrl },
        position: { x: 0, y: 0 },
        size: { width: 1280, height: 720 },
        rotation: 0,
        opacity: 1,
        zIndex: 0
      },
      {
        id: "main-text",
        type: "text",
        name: "Main Text",
        visible: true,
        locked: false,
        properties: {
          text: "Your Text Here",
          fontSize: template.textConfig.fontSize || 90,
          fontFamily: template.textConfig.fontFamily || "Impact",
          color: template.textConfig.color || "#FFD700",
          strokeColor: template.textConfig.strokeColor || "#000000",
          strokeWidth: template.textConfig.strokeWidth || 8,
          textAlign: "center"
        },
        position: { x: 640, y: 360 },
        size: { width: 800, height: 200 },
        rotation: 0,
        opacity: 1,
        zIndex: 10
      }
    ];

    setLayers(initialLayers);
  }, [template, imageUrl]);

  // Render canvas
  useEffect(() => {
    renderCanvas();
  }, [layers, zoom]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width * zoom;
    canvas.height = canvasSize.height * zoom;
    
    // Scale context
    ctx.scale(zoom, zoom);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Sort layers by zIndex
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer
    sortedLayers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      // Apply transformations
      ctx.translate(layer.position.x, layer.position.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);

      switch (layer.type) {
        case "image":
          renderImageLayer(ctx, layer);
          break;
        case "text":
          renderTextLayer(ctx, layer);
          break;
        case "shape":
          renderShapeLayer(ctx, layer);
          break;
      }

      ctx.restore();

      // Draw selection outline
      if (selectedLayer === layer.id) {
        drawSelectionOutline(ctx, layer);
      }
    });
  };

  const renderImageLayer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    // For now, draw a placeholder rectangle
    ctx.fillStyle = "#333";
    ctx.fillRect(-layer.size.width / 2, -layer.size.height / 2, layer.size.width, layer.size.height);
    
    // Add image loading logic here
    if (layer.properties.src) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, -layer.size.width / 2, -layer.size.height / 2, layer.size.width, layer.size.height);
      };
      img.src = layer.properties.src;
    }
  };

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const props = layer.properties;
    
    ctx.font = `${props.fontSize}px ${props.fontFamily}`;
    ctx.textAlign = props.textAlign || "center";
    ctx.textBaseline = "middle";
    
    // Draw stroke
    if (props.strokeWidth > 0) {
      ctx.strokeStyle = props.strokeColor;
      ctx.lineWidth = props.strokeWidth;
      ctx.strokeText(props.text, 0, 0);
    }
    
    // Draw fill
    ctx.fillStyle = props.color;
    ctx.fillText(props.text, 0, 0);
  };

  const renderShapeLayer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const props = layer.properties;
    
    ctx.fillStyle = props.color || "#FF0000";
    
    switch (props.shape) {
      case "rectangle":
        ctx.fillRect(-layer.size.width / 2, -layer.size.height / 2, layer.size.width, layer.size.height);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(layer.size.width, layer.size.height) / 2, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -layer.size.height / 2);
        ctx.lineTo(-layer.size.width / 2, layer.size.height / 2);
        ctx.lineTo(layer.size.width / 2, layer.size.height / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }
  };

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    ctx.save();
    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    
    const x = layer.position.x - layer.size.width / 2;
    const y = layer.position.y - layer.size.height / 2;
    
    ctx.strokeRect(x, y, layer.size.width, layer.size.height);
    
    // Draw resize handles
    const handleSize = 8 / zoom;
    ctx.fillStyle = "#00BFFF";
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x + layer.size.width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x - handleSize / 2, y + layer.size.height - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x + layer.size.width - handleSize / 2, y + layer.size.height - handleSize / 2, handleSize, handleSize);
    
    ctx.restore();
  };

  const addLayer = (type: Layer["type"]) => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      visible: true,
      locked: false,
      properties: getDefaultProperties(type),
      position: { x: 640, y: 360 },
      size: { width: 200, height: 100 },
      rotation: 0,
      opacity: 1,
      zIndex: layers.length + 1
    };

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const getDefaultProperties = (type: Layer["type"]) => {
    switch (type) {
      case "text":
        return {
          text: "New Text",
          fontSize: 48,
          fontFamily: "Arial",
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 2,
          textAlign: "center"
        };
      case "shape":
        return {
          shape: "rectangle",
          color: "#FF0000",
          borderColor: "#000000",
          borderWidth: 0
        };
      case "image":
        return {
          src: "",
          fit: "cover"
        };
      default:
        return {};
    }
  };

  const updateLayerProperty = (layerId: string, property: string, value: any) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, properties: { ...layer.properties, [property]: value } }
        : layer
    ));
  };

  const updateLayerTransform = (layerId: string, transform: Partial<Pick<Layer, "position" | "size" | "rotation" | "opacity">>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, ...transform }
        : layer
    ));
  };

  const deleteLayer = (layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
  };

  const duplicateLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const newLayer: Layer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${layer.name} Copy`,
      position: { x: layer.position.x + 20, y: layer.position.y + 20 },
      zIndex: layers.length + 1
    };

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const moveLayer = (layerId: string, direction: "up" | "down") => {
    setLayers(prev => {
      const newLayers = [...prev];
      const index = newLayers.findIndex(l => l.id === layerId);
      if (index === -1) return prev;

      if (direction === "up" && index < newLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === "down" && index > 0) {
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }

      return newLayers;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Find clicked layer (reverse order to check top layers first)
    const clickedLayer = [...layers]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(layer => {
        if (!layer.visible) return false;
        
        const layerLeft = layer.position.x - layer.size.width / 2;
        const layerRight = layer.position.x + layer.size.width / 2;
        const layerTop = layer.position.y - layer.size.height / 2;
        const layerBottom = layer.position.y + layer.size.height / 2;
        
        return x >= layerLeft && x <= layerRight && y >= layerTop && y <= layerBottom;
      });

    setSelectedLayer(clickedLayer?.id || null);
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex overflow-hidden">
        
        {/* Left Sidebar - Tools & Layers */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Advanced Editor
            </h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Template name..."
            />
          </div>

          {/* Panel Tabs */}
          <div className="flex border-b border-slate-700">
            {[
              { id: "layers", name: "Layers", icon: "📚" },
              { id: "properties", name: "Properties", icon: "⚙️" },
              { id: "assets", name: "Assets", icon: "🎨" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                  activePanel === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === "layers" && (
              <div className="space-y-4">
                {/* Add Layer Buttons */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">Add Layer</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addLayer("text")}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center space-x-2"
                    >
                      <span>📝</span>
                      <span>Text</span>
                    </button>
                    <button
                      onClick={() => addLayer("shape")}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center space-x-2"
                    >
                      <span>🔷</span>
                      <span>Shape</span>
                    </button>
                  </div>
                </div>

                {/* Layers List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">Layers</h3>
                  <div className="space-y-1">
                    {layers.map(layer => (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayer(layer.id)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedLayer === layer.id
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayers(prev => prev.map(l => 
                                  l.id === layer.id ? { ...l, visible: !l.visible } : l
                                ));
                              }}
                              className="text-xs"
                            >
                              {layer.visible ? "👁️" : "🙈"}
                            </button>
                            <span className="text-sm font-medium">{layer.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, "up");
                              }}
                              className="text-xs hover:text-white"
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, "down");
                              }}
                              className="text-xs hover:text-white"
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateLayer(layer.id);
                              }}
                              className="text-xs hover:text-white"
                            >
                              📋
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLayer(layer.id);
                              }}
                              className="text-xs hover:text-red-400"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "properties" && selectedLayerData && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Layer Properties</h3>
                
                {/* Transform Properties */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-400 uppercase">Transform</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">X Position</label>
                      <input
                        type="number"
                        value={selectedLayerData.position.x}
                        onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                          position: { ...selectedLayerData.position, x: parseInt(e.target.value) }
                        })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Y Position</label>
                      <input
                        type="number"
                        value={selectedLayerData.position.y}
                        onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                          position: { ...selectedLayerData.position, y: parseInt(e.target.value) }
                        })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Width</label>
                      <input
                        type="number"
                        value={selectedLayerData.size.width}
                        onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                          size: { ...selectedLayerData.size, width: parseInt(e.target.value) }
                        })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Height</label>
                      <input
                        type="number"
                        value={selectedLayerData.size.height}
                        onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                          size: { ...selectedLayerData.size, height: parseInt(e.target.value) }
                        })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Rotation: {selectedLayerData.rotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedLayerData.rotation}
                      onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                        rotation: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Opacity: {Math.round(selectedLayerData.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedLayerData.opacity}
                      onChange={(e) => updateLayerTransform(selectedLayerData.id, {
                        opacity: parseFloat(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Type-specific Properties */}
                {selectedLayerData.type === "text" && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-400 uppercase">Text Properties</h4>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Text</label>
                      <textarea
                        value={selectedLayerData.properties.text}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "text", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Font Size: {selectedLayerData.properties.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="200"
                        value={selectedLayerData.properties.fontSize}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "fontSize", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Font Family</label>
                      <select
                        value={selectedLayerData.properties.fontFamily}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "fontFamily", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                      <input
                        type="color"
                        value={selectedLayerData.properties.color}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "color", e.target.value)}
                        className="w-full h-8 rounded border border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Stroke Color</label>
                      <input
                        type="color"
                        value={selectedLayerData.properties.strokeColor}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "strokeColor", e.target.value)}
                        className="w-full h-8 rounded border border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Stroke Width: {selectedLayerData.properties.strokeWidth}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={selectedLayerData.properties.strokeWidth}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "strokeWidth", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {selectedLayerData.type === "shape" && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-400 uppercase">Shape Properties</h4>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Shape Type</label>
                      <select
                        value={selectedLayerData.properties.shape}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "shape", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="circle">Circle</option>
                        <option value="triangle">Triangle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Fill Color</label>
                      <input
                        type="color"
                        value={selectedLayerData.properties.color}
                        onChange={(e) => updateLayerProperty(selectedLayerData.id, "color", e.target.value)}
                        className="w-full h-8 rounded border border-slate-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activePanel === "assets" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Assets</h3>
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Asset library coming soon!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Toolbar */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Zoom:</label>
                <select
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value={0.25}>25%</option>
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                  <option value={1.25}>125%</option>
                  <option value={1.5}>150%</option>
                  <option value={2}>200%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSave(
                  {
                    ...template,
                    isCustom: true,
                    customizations: { 
                      layers,
                      textConfig: template.textConfig || {},
                      backgroundEffects: template.backgroundEffects || {},
                      decorativeElements: template.decorativeElements || {}
                    }
                  } as CustomizableTemplate,
                  templateName
                )}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save Template</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 overflow-auto bg-gray-800 p-8">
            <div className="flex items-center justify-center min-h-full">
              <div className="bg-white p-4 rounded-lg shadow-2xl">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="border border-gray-300 cursor-crosshair"
                  style={{
                    width: canvasSize.width * zoom,
                    height: canvasSize.height * zoom
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplateEditor;