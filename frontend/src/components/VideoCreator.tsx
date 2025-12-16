import React, { useState, useRef, useEffect } from "react";
import type { VideoTemplate, VideoLayer, VideoProject, VideoExportSettings } from "../types/video";
import { videoTemplates } from "../types/video";
import { createVideo } from "../api/video";
import { toast } from "./Toast";
import LoadingSpinner from "./LoadingSpinner";
import AIVideoGenerator from "./AIVideoGenerator";
import { generateProjectId, generateVideoId } from "../utils/uniqueId";

interface VideoCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  initialVideo?: string;
  initialTemplate?: VideoTemplate;
}

const VideoCreator: React.FC<VideoCreatorProps> = ({
  isOpen,
  onClose,
  initialImage,
  initialVideo,
  initialTemplate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(
    initialTemplate || videoTemplates[0]
  );
  const [project, setProject] = useState<VideoProject | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"templates" | "layers" | "timeline" | "export" | "ai" | "upload" | "ai-results">("templates");
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"youtube" | "tiktok" | "instagram" | "universal">("youtube");
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(initialVideo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"canvas" | "video">("canvas");
  const [exportSettings, setExportSettings] = useState<VideoExportSettings>({
    format: "mp4",
    quality: "high",
    fps: 30,
    resolution: { width: 1280, height: 720 },
    duration: 3
  });
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:5">("16:9");
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [systemCapabilities, setSystemCapabilities] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);


  // Check system capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/videos/capabilities');
        const capabilities = await response.json();
        setSystemCapabilities(capabilities);
        
        if (!capabilities.ffmpeg) {
          toast.error("FFmpeg not installed. Basic video features available. Install FFmpeg for full functionality.");
        }
      } catch (error) {
        console.error('Failed to check system capabilities:', error);
      }
    };
    
    if (isOpen) {
      checkCapabilities();
    }
  }, [isOpen]);

  // Initialize project when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const newProject: VideoProject = {
        id: generateProjectId(),
        name: `${selectedTemplate.name} Project`,
        template: selectedTemplate,
        customLayers: [...selectedTemplate.layers],
        settings: {
          duration: selectedTemplate.duration,
          backgroundColor: "#000000",
          audioEnabled: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If initial image is provided, replace the first image layer
      if (initialImage) {
        const imageLayerIndex = newProject.customLayers.findIndex(layer => layer.type === "image");
        if (imageLayerIndex !== -1) {
          newProject.customLayers[imageLayerIndex].properties.src = initialImage;
        } else {
          // Add image layer if none exists
          newProject.customLayers.unshift({
            id: "user-image",
            type: "image",
            name: "User Image",
            visible: true,
            locked: false,
            startTime: 0,
            duration: selectedTemplate.duration,
            properties: { src: initialImage, fit: "cover" },
            position: { x: 0, y: 0 },
            size: { width: selectedTemplate.resolution.width, height: selectedTemplate.resolution.height },
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            animations: []
          });
        }
      }

      setProject(newProject);
      setExportSettings(prev => ({
        ...prev,
        resolution: selectedTemplate.resolution,
        duration: selectedTemplate.duration
      }));
    }
  }, [selectedTemplate, initialImage]);

  // Animation loop for preview
  useEffect(() => {
    let animationFrame: number;
    
    if (isPlaying && project) {
      const animate = () => {
        setCurrentTime(prev => {
          const newTime = prev + 1/30; // 30 FPS
          if (newTime >= project.settings.duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, project]);

  // Cleanup video and image elements on unmount
  useEffect(() => {
    return () => {
      // Clean up any video elements created for canvas rendering
      const videoElements = document.querySelectorAll('video[id^="video-"]');
      videoElements.forEach(video => {
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      });
      
      // Clean up any image elements created for canvas rendering
      const imageElements = document.querySelectorAll('img[id^="image-"]');
      imageElements.forEach(image => {
        if (image.parentNode) {
          image.parentNode.removeChild(image);
        }
      });
    };
  }, []);

  // Render canvas preview
  useEffect(() => {
    if (project && canvasRef.current) {
      renderFrame();
    }
  }, [project, currentTime]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = project.template.resolution.width;
    canvas.height = project.template.resolution.height;

    // Clear canvas
    ctx.fillStyle = project.settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sort layers by zIndex
    const visibleLayers = project.customLayers
      .filter(layer => layer.visible && currentTime >= layer.startTime && currentTime <= layer.startTime + layer.duration)
      .sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer
    visibleLayers.forEach(layer => {
      ctx.save();
      
      // Apply layer transformations
      const layerTime = currentTime - layer.startTime;
      const animatedProps = calculateAnimatedProperties(layer, layerTime);
      
      ctx.globalAlpha = animatedProps.opacity;
      ctx.translate(animatedProps.position.x, animatedProps.position.y);
      ctx.rotate((animatedProps.rotation * Math.PI) / 180);
      ctx.scale(animatedProps.scale || 1, animatedProps.scale || 1);

      switch (layer.type) {
        case "text":
          renderTextLayer(ctx, layer, animatedProps);
          break;
        case "shape":
          renderShapeLayer(ctx, layer, animatedProps);
          break;
        case "image":
          renderImageLayer(ctx, layer, animatedProps);
          break;
        case "video":
          renderVideoLayer(ctx, layer, animatedProps);
          break;
      }

      ctx.restore();

      // Draw selection outline
      if (selectedLayer === layer.id) {
        drawSelectionOutline(ctx, layer, animatedProps);
      }
    });
  };

  const calculateAnimatedProperties = (layer: VideoLayer, layerTime: number) => {
    let props = {
      position: { ...layer.position },
      rotation: layer.rotation,
      opacity: layer.opacity,
      scale: 1
    };

    // Apply animations
    layer.animations.forEach(animation => {
      if (layerTime >= animation.startTime && layerTime <= animation.startTime + animation.duration) {
        const progress = (layerTime - animation.startTime) / animation.duration;
        const easedProgress = applyEasing(progress, animation.easing);

        switch (animation.type) {
          case "fade":
            if (animation.properties.from.opacity !== undefined) {
              props.opacity = lerp(animation.properties.from.opacity, animation.properties.to.opacity, easedProgress);
            }
            if (animation.properties.from.scale !== undefined) {
              props.scale = lerp(animation.properties.from.scale, animation.properties.to.scale, easedProgress);
            }
            break;
          case "slide":
            if (animation.properties.from.x !== undefined) {
              props.position.x = lerp(animation.properties.from.x, animation.properties.to.x, easedProgress);
            }
            if (animation.properties.from.y !== undefined) {
              props.position.y = lerp(animation.properties.from.y, animation.properties.to.y, easedProgress);
            }
            break;
          case "pulse":
          case "bounce":
            const pulseScale = lerp(animation.properties.from.scale, animation.properties.to.scale, 
              Math.sin(easedProgress * Math.PI * 2) * 0.5 + 0.5);
            props.scale = pulseScale;
            break;
        }
      }
    });

    return props;
  };

  const lerp = (start: number, end: number, progress: number) => {
    return start + (end - start) * progress;
  };

  const applyEasing = (progress: number, easing: string) => {
    switch (easing) {
      case "ease-in":
        return progress * progress;
      case "ease-out":
        return 1 - Math.pow(1 - progress, 2);
      case "ease-in-out":
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case "bounce":
        return 1 - Math.pow(1 - progress, 3) * Math.cos(progress * Math.PI * 4);
      default:
        return progress;
    }
  };

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: VideoLayer, _props: any) => {
    const textProps = layer.properties;
    
    ctx.font = `${textProps.fontSize}px ${textProps.fontFamily}`;
    ctx.textAlign = textProps.textAlign || "center";
    ctx.textBaseline = "middle";
    
    // Draw stroke
    if (textProps.strokeWidth > 0) {
      ctx.strokeStyle = textProps.strokeColor;
      ctx.lineWidth = textProps.strokeWidth;
      ctx.strokeText(textProps.text, 0, 0);
    }
    
    // Draw fill
    ctx.fillStyle = textProps.color;
    ctx.fillText(textProps.text, 0, 0);
  };

  const renderShapeLayer = (ctx: CanvasRenderingContext2D, layer: VideoLayer, _props: any) => {
    const shapeProps = layer.properties;
    
    if (shapeProps.gradient) {
      const gradient = shapeProps.gradient.type === "linear" 
        ? ctx.createLinearGradient(-layer.size.width/2, -layer.size.height/2, layer.size.width/2, layer.size.height/2)
        : ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(layer.size.width, layer.size.height)/2);
      
      shapeProps.gradient.colors.forEach((color: string, index: number) => {
        gradient.addColorStop(index / (shapeProps.gradient.colors.length - 1), color);
      });
      
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = shapeProps.color;
    }
    
    ctx.fillRect(-layer.size.width/2, -layer.size.height/2, layer.size.width, layer.size.height);
  };

  const renderImageLayer = (ctx: CanvasRenderingContext2D, layer: VideoLayer, _props: any) => {
    // Create image element if it doesn't exist
    const imageId = `image-${layer.id}`;
    let imageElement = document.getElementById(imageId) as HTMLImageElement;
    
    if (!imageElement && layer.properties.src) {
      imageElement = document.createElement('img');
      imageElement.id = imageId;
      imageElement.src = layer.properties.src.startsWith('http') 
        ? layer.properties.src 
        : `http://localhost:5000/${layer.properties.src}`;
      imageElement.crossOrigin = 'anonymous';
      imageElement.style.display = 'none';
      document.body.appendChild(imageElement);
    }
    
    if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
      // Draw the actual image
      try {
        ctx.drawImage(
          imageElement,
          -layer.size.width/2, 
          -layer.size.height/2, 
          layer.size.width, 
          layer.size.height
        );
      } catch (error) {
        // Fallback to placeholder if image can't be drawn
        renderImagePlaceholder(ctx, layer);
      }
    } else {
      // Show placeholder while image loads
      renderImagePlaceholder(ctx, layer);
    }
  };

  const renderImagePlaceholder = (ctx: CanvasRenderingContext2D, layer: VideoLayer) => {
    // Draw image placeholder
    ctx.fillStyle = "#333";
    ctx.fillRect(-layer.size.width/2, -layer.size.height/2, layer.size.width, layer.size.height);
    
    // Draw image icon
    ctx.fillStyle = "#4a90e2";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🖼️", 0, 0);
    
    // Draw image name
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.fillText("LOADING IMAGE", 0, 30);
  };

  const renderVideoLayer = (ctx: CanvasRenderingContext2D, layer: VideoLayer, _props: any) => {
    // Create video element if it doesn't exist
    const videoId = `video-${layer.id}`;
    let videoElement = document.getElementById(videoId) as HTMLVideoElement;
    
    if (!videoElement && layer.properties.src) {
      videoElement = document.createElement('video');
      videoElement.id = videoId;
      videoElement.src = layer.properties.src.startsWith('http') 
        ? layer.properties.src 
        : `http://localhost:5000/${layer.properties.src}`;
      videoElement.crossOrigin = 'anonymous';
      videoElement.muted = true;
      videoElement.style.display = 'none';
      document.body.appendChild(videoElement);
      
      // Set video time to match current timeline
      videoElement.currentTime = currentTime - layer.startTime;
      videoElement.volume = layer.properties.volume || 0.5;
      videoElement.playbackRate = layer.properties.playbackRate || 1;
    }
    
    if (videoElement && videoElement.readyState >= 2) {
      // Update video time
      const layerTime = currentTime - layer.startTime;
      if (Math.abs(videoElement.currentTime - layerTime) > 0.1) {
        videoElement.currentTime = layerTime;
      }
      
      // Draw the actual video frame
      try {
        ctx.drawImage(
          videoElement,
          -layer.size.width/2, 
          -layer.size.height/2, 
          layer.size.width, 
          layer.size.height
        );
      } catch (error) {
        // Fallback to placeholder if video can't be drawn
        renderVideoPlaceholder(ctx, layer);
      }
    } else {
      // Show placeholder while video loads
      renderVideoPlaceholder(ctx, layer);
    }
  };

  const renderVideoPlaceholder = (ctx: CanvasRenderingContext2D, layer: VideoLayer) => {
    // Draw video placeholder
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-layer.size.width/2, -layer.size.height/2, layer.size.width, layer.size.height);
    
    // Draw video icon
    ctx.fillStyle = "#4a90e2";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▶", 0, 0);
    
    // Draw video name
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.fillText("LOADING VIDEO", 0, 30);
  };

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, layer: VideoLayer, props: any) => {
    ctx.save();
    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const x = props.position.x - layer.size.width / 2;
    const y = props.position.y - layer.size.height / 2;
    
    ctx.strokeRect(x, y, layer.size.width, layer.size.height);
    ctx.restore();
  };

  const handlePlay = () => {
    if (previewMode === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!project) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const newTime = (clickX / timelineWidth) * project.settings.duration;
    
    setCurrentTime(Math.max(0, Math.min(newTime, project.settings.duration)));
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a valid video file");
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Video file too large. Maximum size is 100MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('http://localhost:5000/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setUploadedVideo(result.videoUrl);
      setPreviewMode("video");
      
      // Show success message with FFmpeg status
      if (result.ffmpegAvailable) {
        toast.success("Video uploaded successfully! Full metadata extracted.");
      } else {
        toast.success("Video uploaded successfully! (Basic mode - install FFmpeg for full features)");
      }
      
      // Auto-add video as background layer if no project exists
      if (!project && selectedTemplate) {
        const videoLayer = {
          id: generateVideoId(),
          type: "video" as const,
          name: "Background Video",
          visible: true,
          locked: false,
          startTime: 0,
          duration: result.metadata?.duration || selectedTemplate.duration,
          properties: { 
            src: result.videoUrl,
            volume: 0.5,
            playbackRate: 1
          },
          position: { x: selectedTemplate.resolution.width / 2, y: selectedTemplate.resolution.height / 2 },
          size: { width: selectedTemplate.resolution.width, height: selectedTemplate.resolution.height },
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          animations: []
        };
        
        // Update project with video layer
        setProject(prev => prev ? ({
          ...prev,
          customLayers: [videoLayer, ...prev.customLayers.map(layer => ({ ...layer, zIndex: layer.zIndex + 1 }))]
        }) : prev);
      }
      
    } catch (error) {
      console.error('Video upload error:', error);
      
      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
      
      if (errorMessage.includes('FILE_TOO_LARGE')) {
        toast.error("File too large! Maximum size is 100MB.");
      } else if (errorMessage.includes('INVALID_FILE_TYPE')) {
        toast.error("Invalid file type! Please upload a video file.");
      } else if (errorMessage.includes('No subscription')) {
        toast.error("Please subscribe to upload videos.");
      } else {
        toast.error(`Upload failed: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    if (!project) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportData = {
        template: project.template,
        layers: project.customLayers,
        settings: project.settings,
        exportSettings
      };

      const response = await createVideo(exportData);
      toast.success(`Video export started! Video ID: ${response.videoId}`);
      
      // Simulate progress tracking
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setExportProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          setIsExporting(false);
          setExportProgress(0);
          toast.success("Video exported successfully!");
        }
      }, 1000);

    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || "Export failed");
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const updateLayerProperty = (layerId: string, property: string, value: any) => {
    if (!project) return;

    setProject(prev => ({
      ...prev!,
      customLayers: prev!.customLayers.map(layer =>
        layer.id === layerId
          ? { ...layer, properties: { ...layer.properties, [property]: value } }
          : layer
      ),
      updatedAt: new Date()
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find the topmost layer at click position
    const visibleLayers = project.customLayers
      .filter(layer => layer.visible && currentTime >= layer.startTime && currentTime <= layer.startTime + layer.duration)
      .sort((a, b) => b.zIndex - a.zIndex); // Sort by zIndex descending (top to bottom)

    for (const layer of visibleLayers) {
      const layerTime = currentTime - layer.startTime;
      const animatedProps = calculateAnimatedProperties(layer, layerTime);
      
      const left = animatedProps.position.x - layer.size.width / 2;
      const right = animatedProps.position.x + layer.size.width / 2;
      const top = animatedProps.position.y - layer.size.height / 2;
      const bottom = animatedProps.position.y + layer.size.height / 2;

      if (clickX >= left && clickX <= right && clickY >= top && clickY <= bottom) {
        setSelectedLayer(layer.id);
        setActivePanel("layers");
        toast.success(`Selected layer: ${layer.name}`);
        return;
      }
    }

    // If no layer was clicked, deselect
    setSelectedLayer(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Creator
            </h2>
            <p className="text-gray-400 text-sm mt-1">Create animated videos and thumbnails</p>
            
            {/* System Status Indicator */}
            {systemCapabilities && (
              <div className={`mt-2 px-3 py-1 rounded-full text-xs flex items-center space-x-2 ${
                systemCapabilities.ffmpeg 
                  ? "bg-green-900 text-green-200 border border-green-700" 
                  : "bg-yellow-900 text-yellow-200 border border-yellow-700"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemCapabilities.ffmpeg ? "bg-green-400" : "bg-yellow-400"
                }`}></div>
                <span>
                  {systemCapabilities.ffmpeg 
                    ? "Full Video Features Available" 
                    : "Basic Mode - Install FFmpeg for Full Features"
                  }
                </span>
              </div>
            )}
            

          </div>

          {/* Panel Tabs */}
          <div className="flex border-b border-slate-700">
            {[
              { id: "upload", name: "Upload", icon: "📁" },
              { id: "templates", name: "Templates", icon: "🎬" },
              { id: "ai", name: "AI Generate", icon: "🤖" },
              { id: "ai-results", name: "AI Results", icon: "✨" },
              { id: "layers", name: "Layers", icon: "📚" },
              { id: "timeline", name: "Timeline", icon: "⏱️" },
              { id: "export", name: "Export", icon: "📤" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors flex flex-col items-center space-y-1 ${
                  activePanel === tab.id
                    ? "bg-red-600 text-white"
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
            {activePanel === "upload" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Upload Video</h3>
                
                {/* Aspect Ratio Selection */}
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "16:9", label: "16:9 (Landscape)", size: "1920×1080" },
                      { value: "9:16", label: "9:16 (Portrait)", size: "1080×1920" },
                      { value: "1:1", label: "1:1 (Square)", size: "1080×1080" },
                      { value: "4:5", label: "4:5 (Instagram)", size: "1080×1350" }
                    ].map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => {
                          setAspectRatio(ratio.value as any);
                          const resolutions = {
                            "16:9": { width: 1920, height: 1080 },
                            "9:16": { width: 1080, height: 1920 },
                            "1:1": { width: 1080, height: 1080 },
                            "4:5": { width: 1080, height: 1350 }
                          };
                          setExportSettings(prev => ({
                            ...prev,
                            resolution: resolutions[ratio.value as keyof typeof resolutions]
                          }));
                        }}
                        className={`p-2 text-xs rounded border transition-colors ${
                          aspectRatio === ratio.value
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600"
                        }`}
                      >
                        <div className="font-medium">{ratio.label}</div>
                        <div className="text-xs opacity-75">{ratio.size}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  
                  {isUploading ? (
                    <div className="space-y-4">
                      <LoadingSpinner size="lg" />
                      <p className="text-gray-400">Uploading video...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div>
                        <p className="text-gray-300 font-medium">Upload a video to edit</p>
                        <p className="text-gray-400 text-sm mt-1">MP4, MOV, AVI up to 100MB</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Choose Video File
                      </button>
                    </div>
                  )}
                </div>

                {uploadedVideo && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Uploaded Video</h4>
                    <video
                      src={`http://localhost:5000/${uploadedVideo}`}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: "200px" }}
                    />
                    <div className="mt-3 space-y-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreviewMode("video")}
                          className={`px-3 py-1 text-xs rounded ${
                            previewMode === "video" 
                              ? "bg-blue-600 text-white" 
                              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                          }`}
                        >
                          Video Preview
                        </button>
                        <button
                          onClick={() => setPreviewMode("canvas")}
                          className={`px-3 py-1 text-xs rounded ${
                            previewMode === "canvas" 
                              ? "bg-blue-600 text-white" 
                              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                          }`}
                        >
                          Canvas Preview
                        </button>
                      </div>
                      
                      {/* Video Editing Controls */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-400">Video Editing</h5>
                        <button
                          onClick={() => {
                            // Add video as a layer to the project
                            if (project) {
                              const videoLayer = {
                                id: generateVideoId(),
                                type: "video" as const,
                                name: "Uploaded Video",
                                visible: true,
                                locked: false,
                                startTime: 0,
                                duration: project.settings.duration,
                                properties: { 
                                  src: uploadedVideo,
                                  volume: 1,
                                  playbackRate: 1
                                },
                                position: { x: project.template.resolution.width / 2, y: project.template.resolution.height / 2 },
                                size: { width: project.template.resolution.width, height: project.template.resolution.height },
                                rotation: 0,
                                opacity: 1,
                                zIndex: 1,
                                animations: []
                              };
                              
                              setProject(prev => ({
                                ...prev!,
                                customLayers: [...prev!.customLayers, videoLayer]
                              }));
                              
                              toast.success("Video added as layer");
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
                        >
                          Add Video as Layer
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 px-2 rounded transition-colors">
                            Trim Video
                          </button>
                          <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 px-2 rounded transition-colors">
                            Add Effects
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Upload Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Audio & Music</h4>
                  
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const audioUrl = URL.createObjectURL(file);
                          setAudioFile(audioUrl);
                          toast.success("Audio file loaded");
                        }
                      }}
                      className="hidden"
                      id="audio-upload"
                    />
                    <button
                      onClick={() => document.getElementById('audio-upload')?.click()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <span>Upload Music</span>
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (isRecording) {
                          mediaRecorder?.stop();
                          setIsRecording(false);
                        } else {
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            const recorder = new MediaRecorder(stream);
                            const chunks: BlobPart[] = [];
                            
                            recorder.ondataavailable = (e) => chunks.push(e.data);
                            recorder.onstop = () => {
                              const blob = new Blob(chunks, { type: 'audio/wav' });
                              const audioUrl = URL.createObjectURL(blob);
                              setAudioFile(audioUrl);
                              toast.success("Voice recording saved");
                            };
                            
                            recorder.start();
                            setMediaRecorder(recorder);
                            setIsRecording(true);
                            toast.success("Recording started");
                          } catch (error) {
                            toast.error("Could not access microphone");
                          }
                        }
                      }}
                      className={`w-full text-white text-xs font-medium py-2 px-3 rounded transition-colors flex items-center justify-center space-x-2 ${
                        isRecording 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span>{isRecording ? "Stop Recording" : "Record Voice"}</span>
                    </button>
                    
                    {audioFile && (
                      <div className="bg-slate-800 rounded p-2">
                        <audio controls className="w-full" src={audioFile} />
                        <button
                          onClick={() => {
                            setAudioFile(null);
                            toast.success("Audio removed");
                          }}
                          className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
                        >
                          Remove Audio
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* FFmpeg Installation Helper */}
                {systemCapabilities && !systemCapabilities.ffmpeg && (
                  <div className="bg-gradient-to-r from-orange-900 to-red-900 border border-orange-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h4 className="text-sm font-medium text-orange-200">Install FFmpeg for Full Features</h4>
                    </div>
                    <p className="text-xs text-orange-100 mb-3">
                      Currently in basic mode. Install FFmpeg to unlock MP4/GIF export, audio mixing, and advanced video processing.
                    </p>
                    <div className="space-y-2">
                      <div className="bg-slate-800 rounded p-2">
                        <p className="text-xs text-gray-300 mb-1">Windows (PowerShell as Admin):</p>
                        <code className="text-xs text-green-300 bg-slate-900 px-2 py-1 rounded block">
                          choco install ffmpeg
                        </code>
                      </div>
                      <p className="text-xs text-orange-200">
                        After installation, restart the backend server to enable full video features.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Video Editing Features</h4>
                  <ul className="text-xs text-blue-100 space-y-1">
                    <li>• Add text overlays and animations</li>
                    <li>• Apply filters and effects</li>
                    <li>• Trim and cut video segments</li>
                    <li>• Add background music {!systemCapabilities?.ffmpeg && "(Requires FFmpeg)"}</li>
                    <li>• Export in multiple formats {!systemCapabilities?.ffmpeg && "(Basic mode: JSON only)"}</li>
                  </ul>
                </div>
              </div>
            )}

            {activePanel === "templates" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">Video Templates</h3>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
                    className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="universal">Universal</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  {videoTemplates
                    .filter(template => 
                      selectedPlatform === "universal" || 
                      template.platform === selectedPlatform || 
                      template.platform === "universal"
                    )
                    .map(template => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center space-x-2">
                          {template.platform && (
                            <span className="text-xs bg-blue-600 px-2 py-1 rounded capitalize">
                              {template.platform}
                            </span>
                          )}
                          <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                            {template.duration}s
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-75">{template.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs capitalize">{template.category.replace('-', ' ')}</span>
                        <span className="text-xs">{template.aspectRatio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "ai" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">AI Video Generation</h3>
                
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 mr-2 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h4 className="text-sm font-medium text-purple-200">Create with AI</h4>
                  </div>
                  <p className="text-xs text-purple-100 mb-4">
                    Describe your video idea and let AI create a professional video for social media platforms.
                  </p>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate AI Video</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-400 uppercase">Quick AI Templates</h4>
                  {[
                    { name: "Motivational Quote", prompt: "Create a motivational video with inspiring text and modern graphics" },
                    { name: "Product Showcase", prompt: "Make a product showcase video with smooth transitions and professional look" },
                    { name: "Tutorial Intro", prompt: "Create an engaging tutorial introduction with clear text and friendly design" },
                    { name: "Brand Story", prompt: "Generate a brand story video with elegant typography and corporate colors" }
                  ].map((quickTemplate, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // TODO: Auto-fill AI generator with this prompt
                        setShowAIGenerator(true);
                      }}
                      className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <div className="font-medium">{quickTemplate.name}</div>
                      <div className="text-xs opacity-75 mt-1">{quickTemplate.prompt}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "ai-results" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">AI Generated Videos</h3>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-green-900 to-blue-900 border border-green-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-sm font-medium text-green-200">AI Videos Ready</h4>
                    </div>
                    <p className="text-xs text-green-100 mb-3">
                      Your AI-generated videos will appear here once processing is complete.
                    </p>
                    
                    {/* Placeholder for AI-generated videos */}
                    <div className="space-y-2">
                      <div className="bg-slate-800 rounded p-3 border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Motivational Video #1</span>
                          <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">Ready</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Generated from: "Create inspiring content"</p>
                        <div className="flex space-x-2">
                          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors">
                            Use as Template
                          </button>
                          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors">
                            Download
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 rounded p-3 border border-slate-600 opacity-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Product Showcase</span>
                          <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-white">Processing</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Generated from: "Professional product demo"</p>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full w-3/4 transition-all duration-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setActivePanel("ai")}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Generate New AI Video
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePanel === "layers" && project && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Layers</h3>
                <div className="space-y-1">
                  {project.customLayers.map(layer => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedLayer === layer.id
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProject(prev => ({
                                ...prev!,
                                customLayers: prev!.customLayers.map(l =>
                                  l.id === layer.id ? { ...l, visible: !l.visible } : l
                                )
                              }));
                            }}
                            className="text-xs"
                          >
                            {layer.visible ? "👁️" : "🙈"}
                          </button>
                          <span className="text-sm font-medium">{layer.name}</span>
                        </div>
                        <span className="text-xs capitalize">{layer.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layer Management */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-400 uppercase">Layer Management</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (project) {
                          const newLayer = {
                            id: generateVideoId(),
                            type: "text" as const,
                            name: "New Text",
                            visible: true,
                            locked: false,
                            startTime: 0,
                            duration: project.settings.duration,
                            properties: {
                              text: "New Text",
                              fontSize: 48,
                              fontFamily: "Arial",
                              color: "#ffffff",
                              strokeColor: "#000000",
                              strokeWidth: 2,
                              textAlign: "center"
                            },
                            position: { x: project.template.resolution.width / 2, y: project.template.resolution.height / 2 },
                            size: { width: 300, height: 100 },
                            rotation: 0,
                            opacity: 1,
                            zIndex: project.customLayers.length,
                            animations: []
                          };
                          
                          setProject(prev => ({
                            ...prev!,
                            customLayers: [...prev!.customLayers, newLayer]
                          }));
                          
                          setSelectedLayer(newLayer.id);
                          toast.success("Text layer added");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add Text
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedLayer && project) {
                          setProject(prev => ({
                            ...prev!,
                            customLayers: prev!.customLayers.filter(l => l.id !== selectedLayer)
                          }));
                          setSelectedLayer(null);
                          toast.success("Layer deleted");
                        }
                      }}
                      disabled={!selectedLayer}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Delete Layer
                    </button>
                  </div>
                </div>

                {/* Layer Properties */}
                {selectedLayer && project.customLayers.find(l => l.id === selectedLayer) && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Layer Properties</h4>
                    {(() => {
                      const layer = project.customLayers.find(l => l.id === selectedLayer)!;
                      
                      // Universal layer controls (position, size, opacity, rotation)
                      const universalControls = (
                        <div className="space-y-3 mb-4 p-3 bg-slate-800 rounded border border-slate-600">
                          <h5 className="text-xs font-medium text-gray-400 uppercase">Transform</h5>
                          
                          {/* Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">X: {layer.position.x}</label>
                              <input
                                type="range"
                                min="0"
                                max={project.template.resolution.width}
                                value={layer.position.x}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, position: { ...l.position, x: parseInt(e.target.value) } } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Y: {layer.position.y}</label>
                              <input
                                type="range"
                                min="0"
                                max={project.template.resolution.height}
                                value={layer.position.y}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, position: { ...l.position, y: parseInt(e.target.value) } } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Size */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Width: {layer.size.width}</label>
                              <input
                                type="range"
                                min="10"
                                max={project.template.resolution.width}
                                value={layer.size.width}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, size: { ...l.size, width: parseInt(e.target.value) } } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Height: {layer.size.height}</label>
                              <input
                                type="range"
                                min="10"
                                max={project.template.resolution.height}
                                value={layer.size.height}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, size: { ...l.size, height: parseInt(e.target.value) } } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Opacity and Rotation */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Opacity: {Math.round(layer.opacity * 100)}%</label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={layer.opacity}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Rotation: {layer.rotation}°</label>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={layer.rotation}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, rotation: parseInt(e.target.value) } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      );
                      
                      if (layer.type === "text") {
                        return (
                          <div className="space-y-3">
                            {universalControls}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Text</label>
                              <textarea
                                value={layer.properties.text}
                                onChange={(e) => updateLayerProperty(layer.id, "text", e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm resize-none"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Font Size: {layer.properties.fontSize}px
                              </label>
                              <input
                                type="range"
                                min="12"
                                max="200"
                                value={layer.properties.fontSize}
                                onChange={(e) => updateLayerProperty(layer.id, "fontSize", parseInt(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Color</label>
                              <input
                                type="color"
                                value={layer.properties.color}
                                onChange={(e) => updateLayerProperty(layer.id, "color", e.target.value)}
                                className="w-full h-8 rounded border border-slate-600"
                              />
                            </div>
                          </div>
                        );
                      }
                      
                      if (layer.type === "video") {
                        return (
                          <div className="space-y-3">
                            {universalControls}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Video Source</label>
                              <div className="text-xs text-gray-300 bg-slate-700 p-2 rounded">
                                {layer.properties.src?.split('/').pop() || 'No video selected'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Volume: {Math.round((layer.properties.volume || 1) * 100)}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={layer.properties.volume || 1}
                                onChange={(e) => updateLayerProperty(layer.id, "volume", parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Playback Speed: {layer.properties.playbackRate || 1}x
                              </label>
                              <input
                                type="range"
                                min="0.25"
                                max="2"
                                step="0.25"
                                value={layer.properties.playbackRate || 1}
                                onChange={(e) => updateLayerProperty(layer.id, "playbackRate", parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => {
                                  // TODO: Implement trim functionality
                                  toast.success("Trim feature coming soon!");
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
                              >
                                Trim Video
                              </button>
                              <button 
                                onClick={() => {
                                  // TODO: Implement effects
                                  toast.success("Effects feature coming soon!");
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-2 rounded transition-colors"
                              >
                                Add Effects
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1">
                              <button 
                                onClick={() => {
                                  updateLayerProperty(layer.id, "playbackRate", 0.5);
                                  toast.success("Speed set to 0.5x");
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 px-1 rounded transition-colors"
                              >
                                0.5x
                              </button>
                              <button 
                                onClick={() => {
                                  updateLayerProperty(layer.id, "playbackRate", 1);
                                  toast.success("Speed set to 1x");
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 px-1 rounded transition-colors"
                              >
                                1x
                              </button>
                              <button 
                                onClick={() => {
                                  updateLayerProperty(layer.id, "playbackRate", 2);
                                  toast.success("Speed set to 2x");
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 px-1 rounded transition-colors"
                              >
                                2x
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      // For other layer types (shape, image, etc.)
                      return (
                        <div className="space-y-3">
                          {universalControls}
                          <div className="text-xs text-gray-400">
                            {layer.type === "image" && "Image layer selected"}
                            {layer.type === "shape" && "Shape layer selected"}
                            {!["text", "video", "image", "shape"].includes(layer.type) && "Layer selected"}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {activePanel === "timeline" && project && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Timeline Editor</h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Project Settings</h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Duration: {project.settings.duration}s
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="60"
                          value={project.settings.duration}
                          onChange={(e) => {
                            const newDuration = parseInt(e.target.value);
                            setProject(prev => ({
                              ...prev!,
                              settings: { ...prev!.settings, duration: newDuration }
                            }));
                            setExportSettings(prev => ({ ...prev, duration: newDuration }));
                          }}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={project.settings.backgroundColor}
                          onChange={(e) => {
                            setProject(prev => ({
                              ...prev!,
                              settings: { ...prev!.settings, backgroundColor: e.target.value }
                            }));
                          }}
                          className="w-full h-8 rounded border border-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Layer Timeline</h4>
                    
                    <div className="space-y-2">
                      {project.customLayers.map(layer => (
                        <div key={layer.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300">{layer.name}</span>
                            <span className="text-xs text-gray-400">
                              {layer.startTime}s - {layer.startTime + layer.duration}s
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Start: {layer.startTime}s</label>
                              <input
                                type="range"
                                min="0"
                                max={project.settings.duration - 0.1}
                                step="0.1"
                                value={layer.startTime}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, startTime: parseFloat(e.target.value) } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Duration: {layer.duration}s</label>
                              <input
                                type="range"
                                min="0.1"
                                max={project.settings.duration - layer.startTime}
                                step="0.1"
                                value={layer.duration}
                                onChange={(e) => {
                                  setProject(prev => ({
                                    ...prev!,
                                    customLayers: prev!.customLayers.map(l =>
                                      l.id === layer.id ? { ...l, duration: parseFloat(e.target.value) } : l
                                    )
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-900 to-blue-900 border border-green-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-200 mb-2">Timeline Tips</h4>
                    <ul className="text-xs text-green-100 space-y-1">
                      <li>• Click on canvas to select layers</li>
                      <li>• Adjust layer timing with sliders</li>
                      <li>• Use timeline scrubber to preview</li>
                      <li>• Layers with higher Z-index appear on top</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activePanel === "export" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Export Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Platform Optimization</label>
                    <select
                      value={exportSettings.platform || "universal"}
                      onChange={(e) => {
                        const platform = e.target.value as any;
                        const platformSettings = {
                          youtube: { width: 1080, height: 1920 },
                          tiktok: { width: 1080, height: 1920 },
                          instagram: { width: 1080, height: 1920 },
                          universal: { width: 1920, height: 1080 }
                        };
                        setExportSettings(prev => ({ 
                          ...prev, 
                          platform,
                          resolution: platformSettings[platform as keyof typeof platformSettings]
                        }));
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="universal">Universal (16:9)</option>
                      <option value="youtube">YouTube Shorts (9:16)</option>
                      <option value="tiktok">TikTok (9:16)</option>
                      <option value="instagram">Instagram Reels (9:16)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                    <div className="text-sm text-gray-300 bg-slate-700 p-2 rounded">
                      {exportSettings.resolution.width} × {exportSettings.resolution.height}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Format</label>
                    <select
                      value={exportSettings.format}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="mp4">MP4 Video</option>
                      <option value="gif">GIF Animation</option>
                      <option value="webm">WebM Video</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Quality</label>
                    <select
                      value={exportSettings.quality}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="ultra">Ultra (Slow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frame Rate</label>
                    <select
                      value={exportSettings.fps}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Duration: {exportSettings.duration}s
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={exportSettings.duration}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Exporting... {exportProgress}%</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Video</span>
                      </>
                    )}
                  </button>

                  {isExporting && (
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlay}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              {/* Skip to Start */}
              <button
                onClick={() => {
                  setCurrentTime(0);
                  if (previewMode === "video" && videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Skip to End */}
              <button
                onClick={() => {
                  const duration = project?.settings.duration || 0;
                  setCurrentTime(duration);
                  if (previewMode === "video" && videoRef.current) {
                    videoRef.current.currentTime = duration;
                  }
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="text-sm text-gray-300">
                {currentTime.toFixed(1)}s / {project?.settings.duration || 0}s
              </div>
              
              {/* Preview Mode Indicator */}
              {uploadedVideo && (
                <div className="text-xs text-gray-400 bg-slate-700 px-2 py-1 rounded">
                  {previewMode === "video" ? "Video Mode" : "Canvas Mode"}
                </div>
              )}
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

          {/* Canvas/Video Area */}
          <div className="flex-1 bg-gray-900 p-8 flex items-center justify-center">
            <div className="bg-black p-4 rounded-lg shadow-2xl relative">
              {previewMode === "video" && uploadedVideo ? (
                <video
                  ref={videoRef}
                  src={`http://localhost:5000/${uploadedVideo}`}
                  controls
                  className="border border-gray-600 max-w-full max-h-full"
                  style={{
                    width: aspectRatio === "9:16" ? "360px" : aspectRatio === "1:1" ? "450px" : "800px",
                    height: aspectRatio === "9:16" ? "640px" : aspectRatio === "1:1" ? "450px" : "450px",
                    objectFit: "contain"
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setCurrentTime(video.currentTime);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  className="border border-gray-600 max-w-full max-h-full cursor-pointer"
                  style={{
                    width: aspectRatio === "9:16" ? "360px" : aspectRatio === "1:1" ? "450px" : "800px",
                    height: aspectRatio === "9:16" ? "640px" : aspectRatio === "1:1" ? "450px" : "450px"
                  }}
                  onClick={handleCanvasClick}
                />
              )}
              
              {/* Preview Mode Toggle */}
              {uploadedVideo && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => setPreviewMode("canvas")}
                    className={`px-3 py-1 text-xs rounded ${
                      previewMode === "canvas" 
                        ? "bg-blue-600 text-white" 
                        : "bg-black bg-opacity-50 text-gray-300 hover:bg-opacity-70"
                    }`}
                  >
                    Canvas
                  </button>
                  <button
                    onClick={() => setPreviewMode("video")}
                    className={`px-3 py-1 text-xs rounded ${
                      previewMode === "video" 
                        ? "bg-blue-600 text-white" 
                        : "bg-black bg-opacity-50 text-gray-300 hover:bg-opacity-70"
                    }`}
                  >
                    Video
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-800 border-t border-slate-700 p-4">
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1">Timeline</div>
              <div
                className="relative bg-slate-700 h-8 rounded cursor-pointer"
                onClick={handleTimelineClick}
              >
                {/* Timeline background */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded"></div>
                
                {/* Current time indicator */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-500 rounded"
                  style={{
                    left: `${project ? (currentTime / project.settings.duration) * 100 : 0}%`
                  }}
                ></div>
                
                {/* Layer indicators */}
                {project?.customLayers.map(layer => (
                  <div
                    key={layer.id}
                    className="absolute top-1 bottom-1 bg-blue-500 bg-opacity-50 rounded"
                    style={{
                      left: `${(layer.startTime / (project?.settings.duration || 1)) * 100}%`,
                      width: `${(layer.duration / (project?.settings.duration || 1)) * 100}%`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Video Generator Modal */}
      <AIVideoGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onVideoGenerated={(videoId) => {
          toast.success(`AI video generation started! Video ID: ${videoId}`);
        }}
      />
    </div>
  );
};

export default VideoCreator;