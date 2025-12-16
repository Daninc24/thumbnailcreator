export interface VideoTemplate {
  id: string;
  name: string;
  category: "intro" | "outro" | "transition" | "promotional" | "social" | "animated-thumbnail" | "youtube-shorts" | "tiktok" | "instagram-reels" | "ai-generated";
  description: string;
  preview: string;
  duration: number; // in seconds
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  frameRate: 30 | 60;
  platform?: "youtube" | "tiktok" | "instagram" | "universal";
  resolution: {
    width: number;
    height: number;
  };
  layers: VideoLayer[];
}

export interface VideoLayer {
  id: string;
  type: "text" | "image" | "shape" | "effect" | "audio" | "video";
  name: string;
  visible: boolean;
  locked: boolean;
  startTime: number; // in seconds
  duration: number; // in seconds
  properties: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  animations: VideoAnimation[];
}

export interface VideoAnimation {
  id: string;
  type: "fade" | "slide" | "zoom" | "rotate" | "bounce" | "pulse" | "shake";
  startTime: number;
  duration: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
  properties: {
    from: any;
    to: any;
  };
}

export interface VideoProject {
  id: string;
  name: string;
  template: VideoTemplate;
  customLayers: VideoLayer[];
  settings: {
    duration: number;
    backgroundColor: string;
    audioEnabled: boolean;
    audioUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoExportSettings {
  format: "mp4" | "gif" | "webm";
  quality: "low" | "medium" | "high" | "ultra";
  fps: 30 | 60;
  resolution: {
    width: number;
    height: number;
  };
  duration: number;
  platform?: "youtube" | "tiktok" | "instagram" | "universal";
  optimizeFor?: "engagement" | "quality" | "filesize";
}

export interface AIVideoRequest {
  prompt: string;
  platform: "youtube" | "tiktok" | "instagram" | "universal";
  duration: number;
  style: "modern" | "minimalist" | "energetic" | "professional" | "fun" | "dramatic";
  includeText: boolean;
  includeMusic: boolean;
  colorScheme?: string;
}

// Predefined video templates
export const videoTemplates: VideoTemplate[] = [
  {
    id: "intro-burst",
    name: "Intro Burst",
    category: "intro",
    description: "Dynamic intro with text burst animation",
    preview: "bg-gradient-to-r from-blue-600 to-purple-600",
    duration: 3,
    tags: ["intro", "burst", "dynamic", "text"],
    difficulty: "beginner",
    aspectRatio: "16:9",
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
    layers: [
      {
        id: "bg-layer",
        type: "shape",
        name: "Background",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 3,
        properties: {
          shape: "rectangle",
          color: "#1a1a2e",
          gradient: {
            type: "radial",
            colors: ["#16213e", "#0f3460"]
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "main-text",
        type: "text",
        name: "Main Title",
        visible: true,
        locked: false,
        startTime: 0.5,
        duration: 2.5,
        properties: {
          text: "YOUR CHANNEL",
          fontSize: 120,
          fontFamily: "Impact",
          color: "#ffffff",
          strokeColor: "#ff6b6b",
          strokeWidth: 4,
          textAlign: "center"
        },
        position: { x: 960, y: 540 },
        size: { width: 800, height: 200 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "text-fade-in",
            type: "fade",
            startTime: 0.5,
            duration: 0.5,
            easing: "ease-out",
            properties: {
              from: { opacity: 0, scale: 0.5 },
              to: { opacity: 1, scale: 1 }
            }
          },
          {
            id: "text-pulse",
            type: "pulse",
            startTime: 1,
            duration: 1,
            easing: "ease-in-out",
            properties: {
              from: { scale: 1 },
              to: { scale: 1.1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "social-promo",
    name: "Social Promo",
    category: "promotional",
    description: "Square format for social media promotion",
    preview: "bg-gradient-to-r from-pink-500 to-orange-500",
    duration: 5,
    tags: ["social", "promo", "square", "instagram"],
    difficulty: "beginner",
    aspectRatio: "1:1",
    frameRate: 30,
    resolution: { width: 1080, height: 1080 },
    layers: [
      {
        id: "bg-gradient",
        type: "shape",
        name: "Background Gradient",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 5,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "linear",
            colors: ["#ff6b6b", "#ffa500"],
            direction: "diagonal"
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1080 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "promo-text",
        type: "text",
        name: "Promo Text",
        visible: true,
        locked: false,
        startTime: 1,
        duration: 4,
        properties: {
          text: "NEW VIDEO\nOUT NOW!",
          fontSize: 80,
          fontFamily: "Arial Black",
          color: "#ffffff",
          strokeColor: "#000000",
          strokeWidth: 3,
          textAlign: "center"
        },
        position: { x: 540, y: 540 },
        size: { width: 600, height: 300 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "slide-up",
            type: "slide",
            startTime: 1,
            duration: 0.8,
            easing: "ease-out",
            properties: {
              from: { y: 800, opacity: 0 },
              to: { y: 540, opacity: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "animated-thumbnail",
    name: "Animated Thumbnail",
    category: "animated-thumbnail",
    description: "Convert static thumbnail to animated version",
    preview: "bg-gradient-to-r from-green-500 to-blue-500",
    duration: 2,
    tags: ["thumbnail", "animated", "loop", "engaging"],
    difficulty: "intermediate",
    aspectRatio: "16:9",
    frameRate: 30,
    resolution: { width: 1280, height: 720 },
    layers: [
      {
        id: "thumbnail-base",
        type: "image",
        name: "Thumbnail Image",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 2,
        properties: {
          src: "",
          fit: "cover"
        },
        position: { x: 0, y: 0 },
        size: { width: 1280, height: 720 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "animated-text",
        type: "text",
        name: "Animated Title",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 2,
        properties: {
          text: "CLICK TO WATCH",
          fontSize: 90,
          fontFamily: "Impact",
          color: "#FFD700",
          strokeColor: "#000000",
          strokeWidth: 8,
          textAlign: "center"
        },
        position: { x: 640, y: 600 },
        size: { width: 800, height: 120 },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animations: [
          {
            id: "bounce-loop",
            type: "bounce",
            startTime: 0,
            duration: 2,
            easing: "ease-in-out",
            properties: {
              from: { scale: 1 },
              to: { scale: 1.1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "youtube-shorts-hook",
    name: "YouTube Shorts Hook",
    category: "youtube-shorts",
    description: "Attention-grabbing hook for YouTube Shorts",
    preview: "bg-gradient-to-r from-red-600 to-red-800",
    duration: 15,
    tags: ["youtube", "shorts", "hook", "vertical", "engaging"],
    difficulty: "beginner",
    aspectRatio: "9:16",
    frameRate: 30,
    platform: "youtube",
    resolution: { width: 1080, height: 1920 },
    layers: [
      {
        id: "bg-gradient",
        type: "shape",
        name: "Background",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 15,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "linear",
            colors: ["#FF0000", "#CC0000"],
            direction: "vertical"
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "hook-text",
        type: "text",
        name: "Hook Text",
        visible: true,
        locked: false,
        startTime: 0.5,
        duration: 14,
        properties: {
          text: "DID YOU KNOW?",
          fontSize: 120,
          fontFamily: "Impact",
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 6,
          textAlign: "center"
        },
        position: { x: 540, y: 400 },
        size: { width: 900, height: 200 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "zoom-in",
            type: "zoom",
            startTime: 0.5,
            duration: 1,
            easing: "ease-out",
            properties: {
              from: { scale: 0.5, opacity: 0 },
              to: { scale: 1, opacity: 1 }
            }
          }
        ]
      },
      {
        id: "content-text",
        type: "text",
        name: "Content Text",
        visible: true,
        locked: false,
        startTime: 2,
        duration: 13,
        properties: {
          text: "This will blow your mind!",
          fontSize: 80,
          fontFamily: "Arial Black",
          color: "#FFFF00",
          strokeColor: "#000000",
          strokeWidth: 4,
          textAlign: "center"
        },
        position: { x: 540, y: 800 },
        size: { width: 800, height: 300 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "slide-up",
            type: "slide",
            startTime: 2,
            duration: 0.8,
            easing: "ease-out",
            properties: {
              from: { y: 1200, opacity: 0 },
              to: { y: 800, opacity: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "tiktok-trend",
    name: "TikTok Trend",
    category: "tiktok",
    description: "Trendy TikTok-style video with effects",
    preview: "bg-gradient-to-r from-pink-500 to-purple-600",
    duration: 30,
    tags: ["tiktok", "trend", "viral", "effects", "music"],
    difficulty: "intermediate",
    aspectRatio: "9:16",
    frameRate: 30,
    platform: "tiktok",
    resolution: { width: 1080, height: 1920 },
    layers: [
      {
        id: "bg-video",
        type: "shape",
        name: "Background",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 30,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "radial",
            colors: ["#FF1493", "#8A2BE2", "#4B0082"]
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: [
          {
            id: "color-shift",
            type: "pulse",
            startTime: 0,
            duration: 30,
            easing: "ease-in-out",
            properties: {
              from: { opacity: 0.8 },
              to: { opacity: 1 }
            }
          }
        ]
      },
      {
        id: "main-text",
        type: "text",
        name: "Main Text",
        visible: true,
        locked: false,
        startTime: 1,
        duration: 29,
        properties: {
          text: "POV: You discovered this hack",
          fontSize: 90,
          fontFamily: "Arial Black",
          color: "#FFFFFF",
          strokeColor: "#FF1493",
          strokeWidth: 4,
          textAlign: "center"
        },
        position: { x: 540, y: 300 },
        size: { width: 900, height: 200 },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animations: [
          {
            id: "bounce-in",
            type: "bounce",
            startTime: 1,
            duration: 2,
            easing: "bounce",
            properties: {
              from: { scale: 0 },
              to: { scale: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "instagram-reel-story",
    name: "Instagram Reel Story",
    category: "instagram-reels",
    description: "Story-style Instagram Reel with modern design",
    preview: "bg-gradient-to-r from-purple-400 to-pink-400",
    duration: 30,
    tags: ["instagram", "reels", "story", "modern", "lifestyle"],
    difficulty: "beginner",
    aspectRatio: "9:16",
    frameRate: 30,
    platform: "instagram",
    resolution: { width: 1080, height: 1920 },
    layers: [
      {
        id: "bg-gradient",
        type: "shape",
        name: "Background Gradient",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 30,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "linear",
            colors: ["#667eea", "#764ba2"],
            direction: "diagonal"
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "title-text",
        type: "text",
        name: "Title",
        visible: true,
        locked: false,
        startTime: 0.5,
        duration: 29,
        properties: {
          text: "Today's Vibe",
          fontSize: 100,
          fontFamily: "Helvetica Neue",
          color: "#FFFFFF",
          textAlign: "center"
        },
        position: { x: 540, y: 400 },
        size: { width: 800, height: 150 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "fade-in",
            type: "fade",
            startTime: 0.5,
            duration: 1,
            easing: "ease-out",
            properties: {
              from: { opacity: 0, y: 350 },
              to: { opacity: 1, y: 400 }
            }
          }
        ]
      },
      {
        id: "subtitle-text",
        type: "text",
        name: "Subtitle",
        visible: true,
        locked: false,
        startTime: 2,
        duration: 28,
        properties: {
          text: "Share your story",
          fontSize: 60,
          fontFamily: "Helvetica Neue",
          color: "#F0F0F0",
          textAlign: "center"
        },
        position: { x: 540, y: 600 },
        size: { width: 700, height: 100 },
        rotation: 0,
        opacity: 0,
        zIndex: 10,
        animations: [
          {
            id: "slide-in",
            type: "slide",
            startTime: 2,
            duration: 0.8,
            easing: "ease-out",
            properties: {
              from: { x: 800, opacity: 0 },
              to: { x: 540, opacity: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: "ai-generated-base",
    name: "AI Generated Base",
    category: "ai-generated",
    description: "Base template for AI-generated videos",
    preview: "bg-gradient-to-r from-blue-500 to-purple-600",
    duration: 15,
    tags: ["ai", "generated", "dynamic", "smart", "adaptive"],
    difficulty: "advanced",
    aspectRatio: "9:16",
    frameRate: 30,
    platform: "universal",
    resolution: { width: 1080, height: 1920 },
    layers: [
      {
        id: "ai-bg",
        type: "shape",
        name: "AI Background",
        visible: true,
        locked: false,
        startTime: 0,
        duration: 15,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "linear",
            colors: ["#4F46E5", "#7C3AED"],
            direction: "diagonal"
          }
        },
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      },
      {
        id: "ai-text",
        type: "text",
        name: "AI Generated Text",
        visible: true,
        locked: false,
        startTime: 0.5,
        duration: 14,
        properties: {
          text: "AI Generated Content",
          fontSize: 80,
          fontFamily: "Arial Black",
          color: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 3,
          textAlign: "center"
        },
        position: { x: 540, y: 960 },
        size: { width: 900, height: 200 },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animations: [
          {
            id: "ai-entrance",
            type: "fade",
            startTime: 0.5,
            duration: 1,
            easing: "ease-out",
            properties: {
              from: { opacity: 0, scale: 0.8 },
              to: { opacity: 1, scale: 1 }
            }
          }
        ]
      }
    ]
  }
];