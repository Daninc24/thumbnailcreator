import { useEffect, useState, useRef } from "react";
import { uploadImage, getUserImages } from "../api/upload";
import { getSubscription } from "../api/subscription";
import type { Subscription } from "../api/subscription";
import axiosInstance from "../api/axiosInstance";
import { io, Socket } from "socket.io-client";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageCard from "../components/ImageCard";
import ThumbnailTemplateSelector from "../components/ThumbnailTemplateSelector";
import ThumbnailCustomizer from "../components/ThumbnailCustomizer";
import AdvancedTemplateEditor from "../components/AdvancedTemplateEditor";
import TemplateManager from "../components/TemplateManager";
import ImageUpload from "../components/ImageUpload";
import VideoCreator from "../components/VideoCreator";
import AIVideoGenerator from "../components/AIVideoGenerator";
import QuotaDisplay from "../components/QuotaDisplay";
import subscriptionService from "../services/subscriptionService";
import { thumbnailTemplates } from "../types/templates";
import type { ThumbnailTemplate, CustomizableTemplate } from "../types/templates";

interface ImageType {
  _id?: string;
  url: string;
  processed?: boolean;
  thumbnail?: string;
  type?: string;
  createdAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalImages: number;
  hasMore: boolean;
}



const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate | null>(thumbnailTemplates[0]);
  const [customizedTemplate, setCustomizedTemplate] = useState<CustomizableTemplate | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerImage, setCustomizerImage] = useState<string>("");
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<ThumbnailTemplate | null>(null);
  const [editorImage, setEditorImage] = useState<string>("");
  const [showVideoCreator, setShowVideoCreator] = useState(false);
  const [videoCreatorImage, setVideoCreatorImage] = useState<string>("");
  const [showAIVideoGenerator, setShowAIVideoGenerator] = useState(false);
  
  // Bulk progress tracking
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkType, setBulkType] = useState<"bg" | "thumbnail" | null>(null);
  const [bulkStats, setBulkStats] = useState({ completed: 0, total: 0 });
  const [bulkPaused, setBulkPaused] = useState(false);
  
  // Subscription/quota
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [filterProcessed, setFilterProcessed] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);

  // Fetch user images with filters and pagination
  const fetchImages = async (page: number = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping image fetch. Please log in.");
      return;
    }

    try {
      const params: any = {
        page,
        limit: 20,
      };
      
      if (filterProcessed !== "all") {
        params.processed = filterProcessed === "processed";
      }
      
      if (filterType !== "all") {
        params.type = filterType;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const res = await getUserImages(params);
      setImages(res.images);
      setPagination(res.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        toast.error("Failed to fetch images");
        console.error("Failed to fetch images:", err);
      } else {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };

  // Socket.IO setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to Socket.IO
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server");
      // Extract user ID from token (simple decode - in production use proper JWT decode)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        socket.emit("join-user-room", payload.id);
      } catch (e) {
        console.error("Failed to extract user ID from token");
      }
    });

    socket.on("image-processed", (data: { type: string; imageUrl: string; originalUrl?: string }) => {
      toast.success(
        data.type === "background-removed"
          ? "Background removed successfully!"
          : data.type === "thumbnail-generated"
          ? "Thumbnail generated successfully!"
          : "Image uploaded successfully!"
      );
      fetchImages(currentPage); // Refresh current page
      
      // Refresh quota after successful operation
      subscriptionService.refreshSubscriptionData();
    });

    // Listen for video processing events
    socket.on("video-processing-start", (data: { message: string; estimatedTime: number }) => {
      toast.success(`${data.message} (Est. ${data.estimatedTime}s)`);
    });

    socket.on("video-processing-progress", (data: { progress: number; stage: string; frame?: number; totalFrames?: number }) => {
      toast.info(`${data.stage} - ${data.progress}%`);
    });

    socket.on("video-processing-complete", (data: { message: string; videoUrl: string; downloadUrl: string }) => {
      toast.success(data.message);
      fetchImages(currentPage); // Refresh to show new video
      subscriptionService.refreshSubscriptionData();
    });

    socket.on("video-processing-error", (data: { message: string; error: string }) => {
      toast.error(`${data.message}: ${data.error}`);
    });

    // Listen for bulk progress events
    socket.on("bulk-progress", (data: {
      type: string;
      imageUrl: string;
      progress: number;
      completed: number;
      total: number;
      status: string;
      error?: string;
    }) => {
      setBulkProgress(data.progress);
      setBulkStats({ completed: data.completed, total: data.total });
      
      if (data.status === "success") {
        if (data.type === "bg-removed") {
          toast.success(`BG removed: ${data.completed}/${data.total}`);
        } else if (data.type === "thumbnail-generated") {
          toast.success(`Thumbnail generated: ${data.completed}/${data.total}`);
        }
      } else if (data.status === "failed") {
        toast.error(`Failed: ${data.imageUrl.split("/").pop()} - ${data.error}`);
      }
      
      // Refresh images periodically
      if (data.completed % 5 === 0 || data.completed === data.total) {
        fetchImages(currentPage);
      }
    });

    // Listen for bulk completion
    socket.on("bulk-complete", (data: {
      type: string;
      results: any[];
      total: number;
      successful: number;
      failed: number;
    }) => {
      setBulkProcessing(false);
      setBulkProgress(100);
      setBulkType(null);
      toast.success(
        `Bulk operation complete! Successful: ${data.successful}, Failed: ${data.failed}`
      );
      fetchImages(currentPage);
      
      // Reset progress after a delay
      setTimeout(() => {
        setBulkProgress(0);
        setBulkStats({ completed: 0, total: 0 });
      }, 3000);
    });

    // Listen for bulk errors
    socket.on("bulk-error", (data: { type: string; error: string }) => {
      setBulkProcessing(false);
      setBulkProgress(0);
      setBulkType(null);
      toast.error(`Bulk operation failed: ${data.error}`);
    });

    // Listen for queue control events
    socket.on("queue-paused", () => {
      setBulkPaused(true);
      toast.info("Bulk operation paused");
    });

    socket.on("queue-resumed", () => {
      setBulkPaused(false);
      toast.info("Bulk operation resumed");
    });

    socket.on("queue-cancelled", () => {
      setBulkProcessing(false);
      setBulkProgress(0);
      setBulkType(null);
      setBulkPaused(false);
      toast.info("Bulk operation cancelled");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [currentPage]);

  useEffect(() => {
    fetchImages(1);
    fetchSubscription();
  }, [filterProcessed, filterType, searchTerm]);

  const fetchSubscription = async () => {
    try {
      const res = await getSubscription();
      setSubscription(res.subscription);
      setQuotaExceeded(res.subscription.remaining <= 0);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  // Upload image
  const handleUpload = async (uploadFile?: File) => {
    const fileToUpload = uploadFile || file;
    if (!fileToUpload) {
      toast.error("Please select an image");
      return;
    }
    
    setUploading(true);
    try {
      await uploadImage(fileToUpload);
      setFile(null);
      toast.success("Image uploaded successfully!");
      fetchImages(1); // Go to first page
      
      // Refresh quota after successful upload
      subscriptionService.refreshSubscriptionData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Upload failed";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Remove background
  const handleRemoveBG = async (imageUrl: string) => {
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    setErrors((prev) => ({ ...prev, [imageUrl]: "" }));
    try {
      await axiosInstance.post("/upload/remove-bg", { imageUrl });
      toast.success("Processing... You'll be notified when complete");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "BG removal failed";
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Generate thumbnail
  const handleGenerateThumbnail = async (imageUrl: string) => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    setErrors((prev) => ({ ...prev, [imageUrl]: "" }));
    try {
      const templateToUse = customizedTemplate || selectedTemplate;
      await axiosInstance.post("/upload/generate-thumbnail", {
        imageUrl,
        template: templateToUse,
        text: texts[imageUrl] || "",
      });
      toast.success("Processing... You'll be notified when complete");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Thumbnail generation failed";
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Open customizer for specific image
  const handleOpenCustomizer = (imageUrl: string) => {
    setCustomizerImage(imageUrl);
    setShowCustomizer(true);
  };

  // Open video creator for specific image
  const handleOpenVideoCreator = (imageUrl: string) => {
    setVideoCreatorImage(imageUrl);
    setShowVideoCreator(true);
  };

  // Handle customization changes
  const handleCustomizationChange = (customTemplate: CustomizableTemplate) => {
    setCustomizedTemplate(customTemplate);
  };

  // Generate thumbnail from customizer
  const handleCustomizerGenerate = async (template: CustomizableTemplate, text: string) => {
    if (!customizerImage) return;
    
    setProcessing((prev) => ({ ...prev, [customizerImage]: true }));
    setErrors((prev) => ({ ...prev, [customizerImage]: "" }));
    try {
      await axiosInstance.post("/upload/generate-thumbnail", {
        imageUrl: customizerImage,
        template: template,
        text: text,
      });
      toast.success("Processing... You'll be notified when complete");
      setShowCustomizer(false);
      setCustomizerImage("");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Thumbnail generation failed";
      setErrors((prev) => ({ ...prev, [customizerImage]: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({ ...prev, [customizerImage]: false }));
    }
  };

  // Delete image
  const handleDelete = async (imageUrl: string) => {
    if (!confirm("Delete this image?")) return;
    setProcessing((prev) => ({ ...prev, [imageUrl]: true }));
    try {
      await axiosInstance.post("/upload/delete-image", { imageUrl });
      toast.success("Image deleted");
      fetchImages(currentPage);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Delete failed";
      toast.error(errorMsg);
      setErrors((prev) => ({ ...prev, [imageUrl]: errorMsg }));
    } finally {
      setProcessing((prev) => ({ ...prev, [imageUrl]: false }));
    }
  };

  // Toggle selection for bulk actions
  const toggleSelect = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Bulk Remove BG
  const handleBulkRemoveBG = async () => {
    if (selectedImages.length === 0) {
      toast.error("Select images first");
      return;
    }
    setBulkProcessing(true);
    setBulkType("bg");
    setBulkProgress(0);
    setBulkStats({ completed: 0, total: selectedImages.length });
    setBulkPaused(false);
    setLoading(true);
    try {
      await axiosInstance.post("/upload/remove-bg/bulk", { imageUrls: selectedImages });
      toast.success(`Processing ${selectedImages.length} images...`);
      // Don't clear selection yet - user might want to see progress
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Bulk remove BG failed";
      toast.error(errorMsg);
      setBulkProcessing(false);
      setBulkType(null);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Generate Thumbnails
  const handleBulkGenerate = async () => {
    if (selectedImages.length === 0) {
      toast.error("Select images first");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    
    const textsPayload = selectedImages.reduce((acc, url) => {
      acc[url] = texts[url] || "";
      return acc;
    }, {} as Record<string, string>);
    setBulkProcessing(true);
    setBulkType("thumbnail");
    setBulkProgress(0);
    setBulkStats({ completed: 0, total: selectedImages.length });
    setBulkPaused(false);
    setLoading(true);
    try {
      const templateToUse = customizedTemplate || selectedTemplate;
      await axiosInstance.post("/upload/generate-thumbnail/bulk", {
        imageUrls: selectedImages,
        template: templateToUse,
        texts: textsPayload,
      });
      toast.success(`Processing ${selectedImages.length} thumbnails...`);
      // Don't clear selection yet - user might want to see progress
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Bulk generate thumbnails failed";
      toast.error(errorMsg);
      setBulkProcessing(false);
      setBulkType(null);
    } finally {
      setLoading(false);
    }
  };

  // Queue control functions
  const handlePauseQueue = async () => {
    try {
      await axiosInstance.post("/upload/queue/pause");
    } catch (err: any) {
      toast.error("Failed to pause queue");
    }
  };

  const handleResumeQueue = async () => {
    try {
      await axiosInstance.post("/upload/queue/resume");
    } catch (err: any) {
      toast.error("Failed to resume queue");
    }
  };

  const handleCancelQueue = async () => {
    try {
      await axiosInstance.post("/upload/queue/cancel");
      setBulkProcessing(false);
      setBulkProgress(0);
      setBulkType(null);
      setBulkPaused(false);
      setBulkStats({ completed: 0, total: 0 });
    } catch (err: any) {
      toast.error("Failed to cancel queue");
    }
  };

  // Advanced Template Editor handlers
  const handleOpenAdvancedEditor = (template: ThumbnailTemplate, imageUrl: string) => {
    setEditorTemplate(template);
    setEditorImage(imageUrl);
    setShowAdvancedEditor(true);
  };

  const handleAdvancedTemplateChange = (template: CustomizableTemplate) => {
    // Handle template changes in advanced editor
    console.log("Advanced template changed:", template);
  };

  const handleSaveAdvancedTemplate = async (template: CustomizableTemplate, name: string) => {
    try {
      await axiosInstance.post("/templates/save", {
        name,
        category: template.category,
        difficulty: template.difficulty,
        textConfig: template.textConfig,
        backgroundEffects: template.backgroundEffects,
        decorativeElements: template.decorativeElements,
        layers: (template as any).customizations?.layers || [],
        isPublic: false
      });

      toast.success("Template saved successfully!");
      setShowAdvancedEditor(false);
    } catch (error: any) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    }
  };

  // Template Manager handlers
  const handleTemplateSelect = (template: ThumbnailTemplate) => {
    setSelectedTemplate(template);
    toast.success(`Selected template: ${template.name}`);
  };

  const handleTemplateEdit = (template: ThumbnailTemplate) => {
    if (customizerImage) {
      handleOpenAdvancedEditor(template, customizerImage);
    } else {
      toast.error("Please select an image first");
    }
  };



  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Thumbnail Generator
          </h1>
          <p className="text-gray-400 mt-2">Create stunning thumbnails with AI-powered tools</p>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload New Image
          </h2>
          
          <div className="space-y-6">
            {/* File Upload */}
            <ImageUpload
              onUpload={handleUpload}
              uploading={uploading}
              disabled={quotaExceeded}
            />

            {/* Template Selector */}
            <ThumbnailTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />

            {/* Advanced Template Tools */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setShowTemplateManager(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Templates</span>
              </button>
              
              <button
                onClick={() => {
                  if (selectedTemplate && customizerImage) {
                    handleOpenAdvancedEditor(selectedTemplate, customizerImage);
                  } else {
                    toast.error("Please select a template and image first");
                  }
                }}
                disabled={!selectedTemplate || !customizerImage}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editor</span>
              </button>
            </div>

            {/* Video Creation Tools */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowVideoCreator(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Video Editor</span>
              </button>

              <button
                onClick={() => setShowAIVideoGenerator(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI Videos</span>
              </button>
            </div>

            {/* Quota Warning */}
            {quotaExceeded && subscription && (
              <div className="bg-gradient-to-r from-yellow-900 to-orange-900 border border-yellow-600 text-yellow-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Monthly quota exceeded</p>
                    <p className="text-sm">
                      You've used {subscription.used}/{subscription.quota} images.{" "}
                      <a href="/profile" className="underline hover:text-yellow-100 font-medium">
                        Upgrade your plan
                      </a>{" "}
                      to continue uploading.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quota Display */}
            <QuotaDisplay 
              onQuotaUpdate={(quotaData) => {
                setQuotaExceeded(quotaData.quota.remaining <= 0);
              }}
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filter & Search
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterProcessed}
              onChange={(e) => setFilterProcessed(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Images</option>
              <option value="processed">Processed</option>
              <option value="unprocessed">Unprocessed</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="original">Original</option>
              <option value="bg_removed">BG Removed</option>
              <option value="thumbnail">Thumbnail</option>
            </select>
            
            <div className="flex items-center justify-center bg-slate-700 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">
                {pagination ? `${pagination.totalImages} images total` : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {selectedImages.length > 0 && !bulkProcessing && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bulk Actions ({selectedImages.length} selected)
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBulkRemoveBG}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Remove BG ({selectedImages.length})</span>
              </button>
              
              <button
                onClick={handleBulkGenerate}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Generate Thumbnails ({selectedImages.length})</span>
              </button>
              
              <button
                onClick={() => setSelectedImages([])}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Selection</span>
              </button>
            </div>
          </div>
        )}

        {/* Bulk Progress and Controls */}
        {bulkProcessing && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">
                    Processing {bulkType === "bg" ? "Background Removal" : "Thumbnail Generation"}
                  </span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {bulkStats.completed} of {bulkStats.total} completed
                </p>
              </div>
              <div className="flex gap-2">
                {!bulkPaused ? (
                  <button
                    onClick={handlePauseQueue}
                    className="bg-yellow-600 hover:bg-yellow-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResumeQueue}
                    className="bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Resume</span>
                  </button>
                )}
                <button
                  onClick={handleCancelQueue}
                  className="bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </div>
            
            <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="font-medium">{bulkProgress}%</span>
            </div>
          </div>
        )}

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300 mt-4">No images found</h3>
            <p className="text-gray-400 mt-2">Upload your first image to get started with AI thumbnail generation!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {images.map((img) => (
                <ImageCard
                  key={img._id || img.url}
                  image={img}
                  isSelected={selectedImages.includes(img.url)}
                  onToggleSelect={toggleSelect}
                  onDelete={handleDelete}
                  onRemoveBG={handleRemoveBG}
                  onGenerateThumbnail={handleGenerateThumbnail}
                  onCustomize={handleOpenCustomizer}
                  onCreateVideo={handleOpenVideoCreator}
                  processing={processing}
                  errors={errors}
                  texts={texts}
                  onTextChange={(url, text) =>
                    setTexts((prev) => ({ ...prev, [url]: text }))
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => fetchImages(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Page</span>
                  <span className="bg-slate-700 px-3 py-1 rounded-lg font-medium">
                    {pagination.currentPage}
                  </span>
                  <span className="text-sm text-gray-400">of {pagination.totalPages}</span>
                </div>
                
                <button
                  onClick={() => fetchImages(currentPage + 1)}
                  disabled={!pagination.hasMore}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Advanced Thumbnail Customizer Modal */}
        {showCustomizer && customizerImage && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Advanced Thumbnail Customizer</h2>
                <button
                  onClick={() => {
                    setShowCustomizer(false);
                    setCustomizerImage("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <ThumbnailCustomizer
                  template={selectedTemplate}
                  text={texts[customizerImage] || ""}
                  imageUrl={customizerImage}
                  onCustomizationChange={handleCustomizationChange}
                  onGenerate={handleCustomizerGenerate}
                  onTextChange={(newText) => setTexts(prev => ({ ...prev, [customizerImage]: newText }))}
                  processing={processing[customizerImage] || false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Advanced Template Editor Modal */}
        {showAdvancedEditor && editorTemplate && editorImage && (
          <AdvancedTemplateEditor
            template={editorTemplate}
            imageUrl={editorImage}
            onTemplateChange={handleAdvancedTemplateChange}
            onSave={handleSaveAdvancedTemplate}
            onClose={() => setShowAdvancedEditor(false)}
          />
        )}

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <TemplateManager
            isOpen={showTemplateManager}
            onClose={() => setShowTemplateManager(false)}
            onTemplateSelect={handleTemplateSelect}
            onTemplateEdit={handleTemplateEdit}
          />
        )}

        {/* Video Creator Modal */}
        {showVideoCreator && (
          <VideoCreator
            isOpen={showVideoCreator}
            onClose={() => {
              setShowVideoCreator(false);
              setVideoCreatorImage("");
            }}
            initialImage={videoCreatorImage}
          />
        )}

        {/* AI Video Generator Modal */}
        {showAIVideoGenerator && (
          <AIVideoGenerator
            isOpen={showAIVideoGenerator}
            onClose={() => setShowAIVideoGenerator(false)}
            onVideoGenerated={(videoId) => {
              toast.success(`AI video generation started! Video ID: ${videoId}`);
              fetchImages(currentPage); // Refresh to show processing status
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
