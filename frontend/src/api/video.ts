import axiosInstance from "./axiosInstance";
import type { VideoTemplate, VideoLayer, VideoExportSettings } from "../types/video";

export interface CreateVideoRequest {
  template: VideoTemplate;
  layers: VideoLayer[];
  settings: {
    duration: number;
    backgroundColor: string;
    audioEnabled: boolean;
    audioUrl?: string;
  };
  exportSettings: VideoExportSettings;
}

export interface CreateVideoResponse {
  message: string;
  videoId: string;
  estimatedTime: number;
}

export interface VideoStatusResponse {
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  downloadUrl?: string;
  createdAt?: string;
  error?: string;
}

export interface ThumbnailToVideoRequest {
  imageUrl: string;
  animationType: "fade" | "zoom" | "pulse" | "slide";
  duration: number;
}

export interface AIVideoGenerationRequest {
  prompt: string;
  platform: "youtube" | "tiktok" | "instagram" | "universal";
  duration: number;
  style: "modern" | "minimalist" | "energetic" | "professional" | "fun" | "dramatic";
  includeText: boolean;
  includeMusic: boolean;
  colorScheme?: string;
}

// Create video from template and layers
export const createVideo = async (data: CreateVideoRequest): Promise<CreateVideoResponse> => {
  const response = await axiosInstance.post("/videos/create", data);
  return response.data;
};

// Convert thumbnail to animated video
export const thumbnailToVideo = async (data: ThumbnailToVideoRequest): Promise<CreateVideoResponse> => {
  const response = await axiosInstance.post("/videos/thumbnail-to-video", data);
  return response.data;
};

// Get video processing status
export const getVideoStatus = async (videoId: string): Promise<VideoStatusResponse> => {
  const response = await axiosInstance.get(`/videos/status/${videoId}`);
  return response.data;
};



// Generate AI video from text prompt
export const generateAIVideo = async (data: AIVideoGenerationRequest): Promise<CreateVideoResponse> => {
  const response = await axiosInstance.post("/videos/ai-generate", data);
  return response.data;
};

// Get platform-optimized export settings
export const getPlatformSettings = (platform: string) => {
  const settings = {
    youtube: {
      aspectRatio: "9:16" as const,
      resolution: { width: 1080, height: 1920 },
      maxDuration: 60,
      recommendedDuration: 15,
      format: "mp4" as const,
      fps: 30
    },
    tiktok: {
      aspectRatio: "9:16" as const,
      resolution: { width: 1080, height: 1920 },
      maxDuration: 60,
      recommendedDuration: 15,
      format: "mp4" as const,
      fps: 30
    },
    instagram: {
      aspectRatio: "9:16" as const,
      resolution: { width: 1080, height: 1920 },
      maxDuration: 90,
      recommendedDuration: 30,
      format: "mp4" as const,
      fps: 30
    },
    universal: {
      aspectRatio: "16:9" as const,
      resolution: { width: 1920, height: 1080 },
      maxDuration: 300,
      recommendedDuration: 60,
      format: "mp4" as const,
      fps: 30
    }
  };
  
  return settings[platform as keyof typeof settings] || settings.universal;
};

// Download video
export const downloadVideo = async (videoUrl: string): Promise<void> => {
  const response = await axiosInstance.get(`/upload/download?imageUrl=${videoUrl}`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', videoUrl.split('/').pop() || 'video.mp4');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};