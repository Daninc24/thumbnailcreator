export interface ThumbnailTemplate {
  id: string;
  name: string;
  category: "gaming" | "vlog" | "education" | "business" | "entertainment" | "tech" | "fitness" | "food";
  description: string;
  preview: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  textConfig: {
    fontSize: number;
    fontFamily: string;
    color: string;
    strokeColor?: string;
    strokeWidth?: number;
    textShadow?: string;
    position: "top" | "center" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";
    alignment: "left" | "center" | "right";
    maxLines: number;
    lineHeight: number;
    letterSpacing?: number;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    fontWeight?: number;
    rotation?: number;
    padding: {
      x: number;
      y: number;
    };
    customPosition?: {
      x: number;
      y: number;
    };
  };
  backgroundEffects?: {
    overlay?: {
      type: "gradient" | "solid" | "pattern" | "none";
      color1: string;
      color2?: string;
      opacity: number;
      direction?: "horizontal" | "vertical" | "diagonal" | "radial";
      blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light";
    };
    blur?: {
      enabled: boolean;
      intensity: number;
    };
    brightness?: {
      enabled: boolean;
      value: number; // -100 to 100
    };
    contrast?: {
      enabled: boolean;
      value: number; // -100 to 100
    };
    saturation?: {
      enabled: boolean;
      value: number; // -100 to 100
    };
    hue?: {
      enabled: boolean;
      value: number; // 0 to 360
    };
    vignette?: {
      enabled: boolean;
      intensity: number;
      color: string;
    };
  };
  decorativeElements?: {
    arrows?: {
      enabled: boolean;
      color: string;
      size: number;
      position: string;
      style: "simple" | "bold" | "curved" | "double";
    } | boolean;
    shapes?: {
      type: "circle" | "rectangle" | "triangle" | "star" | "hexagon" | "diamond";
      color: string;
      position: string;
      size: number;
      opacity?: number;
      rotation?: number;
      borderColor?: string;
      borderWidth?: number;
    }[];
    borders?: {
      enabled: boolean;
      color: string;
      width: number;
      style: "solid" | "dashed" | "dotted" | "double";
      radius?: number;
      opacity?: number;
    };
    badges?: {
      text: string;
      position: string;
      color: string;
      backgroundColor: string;
      fontSize?: number;
      padding?: number;
      borderRadius?: number;
      opacity?: number;
    }[];
    particles?: {
      enabled: boolean;
      count: number;
      color: string;
      size: number;
      opacity: number;
      animation: "none" | "float" | "sparkle" | "pulse";
    };
  };
  animations?: {
    textEntrance?: "none" | "fade" | "slide" | "bounce" | "zoom";
    backgroundPulse?: boolean;
    particleMovement?: boolean;
  };
}

// Customizable template interface for advanced thumbnail customization
export interface CustomizableTemplate extends ThumbnailTemplate {
  isCustom: boolean;
  originalTemplateId?: string;
  customizations: {
    textConfig: Partial<ThumbnailTemplate['textConfig']>;
    backgroundEffects: Partial<ThumbnailTemplate['backgroundEffects']>;
    decorativeElements: Partial<ThumbnailTemplate['decorativeElements']>;
  };
}

export const thumbnailTemplates: ThumbnailTemplate[] = [
  {
    id: "mrbeast-classic",
    name: "MrBeast Classic",
    category: "entertainment",
    description: "Bold yellow text with heavy stroke, perfect for high-energy content",
    preview: "bg-gradient-to-r from-red-500 to-orange-500",
    tags: ["bold", "yellow", "stroke", "high-energy", "popular"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 90,
      fontFamily: "Impact, Arial Black, sans-serif",
      color: "#FFD700",
      strokeColor: "#000000",
      strokeWidth: 8,
      textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
      position: "bottom",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.1,
      letterSpacing: 0,
      textTransform: "uppercase",
      fontWeight: 900,
      rotation: 0,
      padding: { x: 40, y: 60 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,0,0,0.3)",
        color2: "rgba(0,0,0,0.7)",
        opacity: 0.8,
        direction: "vertical"
      }
    },
    decorativeElements: {
      arrows: {
        enabled: true,
        color: "#FFD700",
        size: 40,
        position: "top-right",
        style: "bold"
      },
      shapes: [
        {
          type: "circle",
          color: "#FFD700",
          position: "top-right",
          size: 60,
          opacity: 1,
          rotation: 0
        }
      ]
    }
  },
  {
    id: "gaming-neon",
    name: "Gaming Neon",
    category: "gaming",
    description: "Cyberpunk-style neon text with glowing effects",
    preview: "bg-gradient-to-r from-purple-600 to-pink-600",
    tags: ["neon", "cyberpunk", "glow", "gaming", "futuristic"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 80,
      fontFamily: "Orbitron, monospace",
      color: "#00FFFF",
      strokeColor: "#FF00FF",
      strokeWidth: 3,
      textShadow: "0 0 20px #00FFFF, 0 0 40px #00FFFF",
      position: "center",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.2,
      letterSpacing: 2,
      textTransform: "uppercase",
      fontWeight: 700,
      rotation: 0,
      padding: { x: 40, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,0,0,0.6)",
        color2: "rgba(75,0,130,0.4)",
        opacity: 0.9,
        direction: "diagonal"
      },
      contrast: {
        enabled: true,
        value: 20
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "rectangle",
          color: "#FF00FF",
          position: "top-left",
          size: 40,
          opacity: 1,
          rotation: 0
        },
        {
          type: "triangle",
          color: "#00FFFF",
          position: "bottom-right",
          size: 50,
          opacity: 1,
          rotation: 0
        }
      ],
      borders: {
        enabled: true,
        color: "#00FFFF",
        width: 4,
        style: "solid",
        radius: 0,
        opacity: 1
      }
    }
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    category: "business",
    description: "Professional clean design with subtle shadows",
    preview: "bg-gradient-to-r from-gray-100 to-white",
    tags: ["clean", "minimal", "professional", "business", "subtle"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 65,
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      color: "#2D3748",
      textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
      position: "center",
      alignment: "center",
      maxLines: 3,
      lineHeight: 1.3,
      padding: { x: 60, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "solid",
        color1: "rgba(255,255,255,0.9)",
        opacity: 0.9
      }
    }
  },
  {
    id: "retro-wave",
    name: "Retro Wave",
    category: "entertainment",
    description: "80s synthwave aesthetic with neon colors",
    preview: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500",
    tags: ["retro", "80s", "synthwave", "neon", "vintage"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 75,
      fontFamily: "Orbitron, monospace",
      color: "#FF1493",
      strokeColor: "#00CED1",
      strokeWidth: 2,
      textShadow: "0 0 10px #FF1493, 0 0 20px #FF1493",
      position: "top",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.1,
      padding: { x: 40, y: 80 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,0,0,0.4)",
        color2: "rgba(139,69,19,0.3)",
        opacity: 0.8,
        direction: "horizontal"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "star",
          color: "#FFD700",
          position: "top-left",
          size: 45
        },
        {
          type: "star",
          color: "#FF1493",
          position: "bottom-right",
          size: 35
        }
      ]
    }
  },
  {
    id: "education-pro",
    name: "Education Pro",
    category: "education",
    description: "Professional educational content with clean typography",
    preview: "bg-gradient-to-r from-blue-500 to-teal-500",
    tags: ["education", "professional", "clean", "learning", "academic"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 60,
      fontFamily: "Roboto, Arial, sans-serif",
      color: "#FFFFFF",
      strokeColor: "#1E40AF",
      strokeWidth: 2,
      textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
      position: "bottom",
      alignment: "left",
      maxLines: 3,
      lineHeight: 1.4,
      padding: { x: 50, y: 50 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(30,64,175,0.3)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "vertical"
      }
    },
    decorativeElements: {
      badges: [
        {
          text: "LEARN",
          position: "top-right",
          color: "#FFFFFF",
          backgroundColor: "#10B981"
        }
      ]
    }
  },
  {
    id: "tech-review",
    name: "Tech Review",
    category: "tech",
    description: "Modern tech aesthetic with futuristic elements",
    preview: "bg-gradient-to-r from-gray-800 to-blue-900",
    tags: ["tech", "review", "futuristic", "modern", "digital"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 70,
      fontFamily: "Roboto Mono, monospace",
      color: "#00D4FF",
      strokeColor: "#001F3F",
      strokeWidth: 1,
      textShadow: "0 0 15px rgba(0,212,255,0.5)",
      position: "center",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.2,
      padding: { x: 40, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,31,63,0.7)",
        color2: "rgba(0,0,0,0.5)",
        opacity: 0.9,
        direction: "diagonal"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "rectangle",
          color: "#00D4FF",
          position: "top-left",
          size: 30
        }
      ],
      borders: {
        enabled: true,
        color: "#00D4FF",
        width: 2,
        style: "solid"
      }
    }
  },
  {
    id: "fitness-energy",
    name: "Fitness Energy",
    category: "fitness",
    description: "High-energy fitness content with bold colors",
    preview: "bg-gradient-to-r from-green-400 to-lime-500",
    tags: ["fitness", "energy", "workout", "bold", "motivational"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 85,
      fontFamily: "Arial Black, sans-serif",
      color: "#00FF88",
      strokeColor: "#004D00",
      strokeWidth: 6,
      textShadow: "3px 3px 6px rgba(0,0,0,0.7)",
      position: "top",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.1,
      padding: { x: 40, y: 70 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,77,0,0.4)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "vertical"
      }
    },
    decorativeElements: {
      arrows: true,
      badges: [
        {
          text: "WORKOUT",
          position: "bottom-right",
          color: "#FFFFFF",
          backgroundColor: "#FF4500"
        }
      ]
    }
  },
  {
    id: "food-delicious",
    name: "Food Delicious",
    category: "food",
    description: "Warm and appetizing food content design",
    preview: "bg-gradient-to-r from-orange-400 to-red-500",
    tags: ["food", "delicious", "warm", "appetizing", "cooking"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 70,
      fontFamily: "Georgia, serif",
      color: "#FF6B35",
      strokeColor: "#8B0000",
      strokeWidth: 4,
      textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
      position: "bottom",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.3,
      padding: { x: 40, y: 60 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(139,0,0,0.3)",
        color2: "rgba(0,0,0,0.5)",
        opacity: 0.7,
        direction: "vertical"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "circle",
          color: "#FFD700",
          position: "top-right",
          size: 50
        }
      ]
    }
  },
  {
    id: "vlog-casual",
    name: "Vlog Casual",
    category: "vlog",
    description: "Casual vlogging style with friendly typography",
    preview: "bg-gradient-to-r from-pink-300 to-purple-400",
    tags: ["vlog", "casual", "friendly", "personal", "lifestyle"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 65,
      fontFamily: "Comic Sans MS, cursive",
      color: "#FFFFFF",
      strokeColor: "#8B008B",
      strokeWidth: 3,
      textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
      position: "center",
      alignment: "center",
      maxLines: 3,
      lineHeight: 1.4,
      padding: { x: 50, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(139,0,139,0.2)",
        color2: "rgba(0,0,0,0.4)",
        opacity: 0.6,
        direction: "diagonal"
      }
    }
  },
  {
    id: "horror-thriller",
    name: "Horror Thriller",
    category: "entertainment",
    description: "Dark and mysterious design for horror content",
    preview: "bg-gradient-to-r from-gray-900 to-red-900",
    tags: ["horror", "thriller", "dark", "scary", "mysterious"],
    difficulty: "advanced",
    textConfig: {
      fontSize: 75,
      fontFamily: "Creepster, cursive",
      color: "#FF0000",
      strokeColor: "#000000",
      strokeWidth: 5,
      textShadow: "0 0 20px #FF0000, 3px 3px 6px rgba(0,0,0,0.9)",
      position: "center",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.2,
      padding: { x: 40, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,0,0,0.8)",
        color2: "rgba(139,0,0,0.5)",
        opacity: 0.9,
        direction: "vertical"
      },
      brightness: {
        enabled: true,
        value: -30
      }
    }
  },
  {
    id: "comedy-fun",
    name: "Comedy Fun",
    category: "entertainment",
    description: "Playful and colorful design for comedy content",
    preview: "bg-gradient-to-r from-yellow-400 to-orange-500",
    tags: ["comedy", "fun", "playful", "colorful", "entertaining"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 80,
      fontFamily: "Fredoka One, cursive",
      color: "#FF69B4",
      strokeColor: "#FFD700",
      strokeWidth: 4,
      textShadow: "3px 3px 0px #FF1493, 6px 6px 10px rgba(0,0,0,0.3)",
      position: "top",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.1,
      padding: { x: 40, y: 80 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(255,215,0,0.3)",
        color2: "rgba(255,105,180,0.2)",
        opacity: 0.6,
        direction: "diagonal"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "star",
          color: "#FF1493",
          position: "bottom-left",
          size: 40
        },
        {
          type: "circle",
          color: "#FFD700",
          position: "top-right",
          size: 35
        }
      ]
    }
  },
  {
    id: "news-breaking",
    name: "Breaking News",
    category: "business",
    description: "Urgent news style with bold red accents",
    preview: "bg-gradient-to-r from-red-600 to-red-800",
    tags: ["news", "breaking", "urgent", "professional", "important"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 70,
      fontFamily: "Arial Black, sans-serif",
      color: "#FFFFFF",
      strokeColor: "#8B0000",
      strokeWidth: 3,
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      position: "center",
      alignment: "center",
      maxLines: 3,
      lineHeight: 1.3,
      padding: { x: 40, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(139,0,0,0.6)",
        color2: "rgba(0,0,0,0.7)",
        opacity: 0.9,
        direction: "horizontal"
      }
    },
    decorativeElements: {
      badges: [
        {
          text: "BREAKING",
          position: "top-left",
          color: "#FFFFFF",
          backgroundColor: "#FF0000"
        }
      ],
      borders: {
        enabled: true,
        color: "#FF0000",
        width: 6,
        style: "solid"
      }
    }
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    category: "business",
    description: "Premium luxury design with gold accents",
    preview: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    tags: ["luxury", "gold", "premium", "elegant", "sophisticated"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 65,
      fontFamily: "Playfair Display, serif",
      color: "#FFD700",
      strokeColor: "#B8860B",
      strokeWidth: 2,
      textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
      position: "center",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.4,
      padding: { x: 60, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(184,134,11,0.3)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "diagonal"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "rectangle",
          color: "#FFD700",
          position: "top-left",
          size: 25
        },
        {
          type: "rectangle",
          color: "#FFD700",
          position: "bottom-right",
          size: 25
        }
      ]
    }
  },
  {
    id: "anime-manga",
    name: "Anime Manga",
    category: "entertainment",
    description: "Anime-style design with vibrant colors",
    preview: "bg-gradient-to-r from-pink-500 to-violet-500",
    tags: ["anime", "manga", "vibrant", "japanese", "colorful"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 75,
      fontFamily: "Bangers, cursive",
      color: "#FF69B4",
      strokeColor: "#4B0082",
      strokeWidth: 4,
      textShadow: "3px 3px 0px #FFFFFF, 6px 6px 10px rgba(0,0,0,0.5)",
      position: "bottom",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.1,
      padding: { x: 40, y: 70 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(75,0,130,0.4)",
        color2: "rgba(255,105,180,0.3)",
        opacity: 0.7,
        direction: "vertical"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "star",
          color: "#FFD700",
          position: "top-left",
          size: 50
        },
        {
          type: "circle",
          color: "#FF1493",
          position: "top-right",
          size: 40
        }
      ]
    }
  },
  {
    id: "sports-action",
    name: "Sports Action",
    category: "fitness",
    description: "Dynamic sports design with motion effects",
    preview: "bg-gradient-to-r from-blue-600 to-green-500",
    tags: ["sports", "action", "dynamic", "athletic", "competitive"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 85,
      fontFamily: "Impact, Arial Black, sans-serif",
      color: "#FFFFFF",
      strokeColor: "#000080",
      strokeWidth: 5,
      textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
      position: "top",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.0,
      padding: { x: 40, y: 80 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,0,128,0.5)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "diagonal"
      }
    },
    decorativeElements: {
      arrows: true,
      shapes: [
        {
          type: "triangle",
          color: "#FFD700",
          position: "bottom-right",
          size: 60
        }
      ]
    }
  },
  {
    id: "travel-adventure",
    name: "Travel Adventure",
    category: "vlog",
    description: "Wanderlust-inspired design for travel content",
    preview: "bg-gradient-to-r from-teal-400 to-blue-500",
    tags: ["travel", "adventure", "wanderlust", "exploration", "journey"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 68,
      fontFamily: "Montserrat, sans-serif",
      color: "#FFFFFF",
      strokeColor: "#008B8B",
      strokeWidth: 3,
      textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
      position: "bottom",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.3,
      padding: { x: 50, y: 60 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(0,139,139,0.3)",
        color2: "rgba(0,0,0,0.5)",
        opacity: 0.7,
        direction: "vertical"
      }
    },
    decorativeElements: {
      badges: [
        {
          text: "EXPLORE",
          position: "top-right",
          color: "#FFFFFF",
          backgroundColor: "#FF6347"
        }
      ]
    }
  },
  {
    id: "music-beats",
    name: "Music Beats",
    category: "entertainment",
    description: "Musical design with rhythm and flow",
    preview: "bg-gradient-to-r from-purple-600 to-pink-600",
    tags: ["music", "beats", "rhythm", "musical", "creative"],
    difficulty: "intermediate",
    textConfig: {
      fontSize: 72,
      fontFamily: "Righteous, cursive",
      color: "#FF1493",
      strokeColor: "#4B0082",
      strokeWidth: 3,
      textShadow: "0 0 15px #FF1493, 3px 3px 6px rgba(0,0,0,0.7)",
      position: "center",
      alignment: "center",
      maxLines: 2,
      lineHeight: 1.2,
      padding: { x: 40, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(75,0,130,0.4)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "diagonal"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "circle",
          color: "#FFD700",
          position: "top-left",
          size: 45
        },
        {
          type: "circle",
          color: "#FF1493",
          position: "bottom-right",
          size: 35
        }
      ]
    }
  },
  {
    id: "diy-crafts",
    name: "DIY Crafts",
    category: "education",
    description: "Creative and crafty design for DIY content",
    preview: "bg-gradient-to-r from-green-400 to-yellow-400",
    tags: ["diy", "crafts", "creative", "handmade", "tutorial"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 62,
      fontFamily: "Kalam, cursive",
      color: "#228B22",
      strokeColor: "#FFFFFF",
      strokeWidth: 4,
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
      position: "top",
      alignment: "center",
      maxLines: 3,
      lineHeight: 1.4,
      padding: { x: 50, y: 70 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(255,255,255,0.4)",
        color2: "rgba(34,139,34,0.2)",
        opacity: 0.6,
        direction: "vertical"
      }
    },
    decorativeElements: {
      shapes: [
        {
          type: "star",
          color: "#FFD700",
          position: "bottom-left",
          size: 40
        },
        {
          type: "circle",
          color: "#FF69B4",
          position: "top-right",
          size: 35
        }
      ]
    }
  },
  {
    id: "corporate-professional",
    name: "Corporate Professional",
    category: "business",
    description: "Professional corporate design for business content",
    preview: "bg-gradient-to-r from-gray-700 to-blue-800",
    tags: ["corporate", "professional", "business", "formal", "clean"],
    difficulty: "beginner",
    textConfig: {
      fontSize: 58,
      fontFamily: "Open Sans, sans-serif",
      color: "#FFFFFF",
      strokeColor: "#2C5282",
      strokeWidth: 2,
      textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
      position: "center",
      alignment: "center",
      maxLines: 3,
      lineHeight: 1.5,
      padding: { x: 60, y: 40 }
    },
    backgroundEffects: {
      overlay: {
        type: "gradient",
        color1: "rgba(44,82,130,0.4)",
        color2: "rgba(0,0,0,0.6)",
        opacity: 0.8,
        direction: "horizontal"
      }
    },
    decorativeElements: {
      borders: {
        enabled: true,
        color: "#4299E1",
        width: 3,
        style: "solid"
      }
    }
  }
];