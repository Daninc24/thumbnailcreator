import User from "../models/User.js";

// AI-powered thumbnail text suggestions
const SUGGESTION_TEMPLATES = {
  gaming: [
    "EPIC {action} GAMEPLAY!",
    "YOU WON'T BELIEVE THIS {action}!",
    "INSANE {action} MOMENTS",
    "BEST {action} EVER?",
    "CRAZY {action} COMPILATION",
    "{action} GONE WRONG!",
    "ULTIMATE {action} GUIDE",
    "PRO {action} TIPS",
    "LEGENDARY {action}",
    "MIND-BLOWING {action}"
  ],
  vlog: [
    "MY {topic} EXPERIENCE",
    "DAILY {topic} ROUTINE",
    "HONEST {topic} REVIEW",
    "LIFE UPDATE: {topic}",
    "BEHIND THE SCENES {topic}",
    "REAL TALK ABOUT {topic}",
    "MY {topic} JOURNEY",
    "TRUTH ABOUT {topic}",
    "PERSONAL {topic} STORY",
    "AUTHENTIC {topic} VLOG"
  ],
  education: [
    "LEARN {topic} IN 5 MINUTES",
    "MASTER {topic} TODAY",
    "COMPLETE {topic} GUIDE",
    "BEGINNER'S {topic} TUTORIAL",
    "ADVANCED {topic} TIPS",
    "EVERYTHING ABOUT {topic}",
    "STEP-BY-STEP {topic}",
    "QUICK {topic} LESSON",
    "ESSENTIAL {topic} SKILLS",
    "PROFESSIONAL {topic} COURSE"
  ],
  business: [
    "GROW YOUR {topic} BUSINESS",
    "PROFITABLE {topic} STRATEGY",
    "SCALE YOUR {topic}",
    "SUCCESSFUL {topic} TIPS",
    "BUSINESS {topic} SECRETS",
    "ENTREPRENEUR'S {topic} GUIDE",
    "MAXIMIZE {topic} PROFITS",
    "EXPERT {topic} ADVICE",
    "PROVEN {topic} METHODS",
    "TRANSFORM YOUR {topic}"
  ],
  entertainment: [
    "HILARIOUS {topic} MOMENTS",
    "FUNNIEST {topic} EVER",
    "EPIC {topic} FAILS",
    "AMAZING {topic} COMPILATION",
    "INCREDIBLE {topic} SHOW",
    "BEST {topic} REACTIONS",
    "SHOCKING {topic} REVEAL",
    "UNBELIEVABLE {topic}",
    "VIRAL {topic} CONTENT",
    "TRENDING {topic} NOW"
  ],
  tech: [
    "LATEST {topic} REVIEW",
    "TECH {topic} EXPLAINED",
    "FUTURE OF {topic}",
    "INNOVATIVE {topic} TECH",
    "CUTTING-EDGE {topic}",
    "REVOLUTIONARY {topic}",
    "NEXT-GEN {topic}",
    "SMART {topic} SOLUTIONS",
    "ADVANCED {topic} FEATURES",
    "BREAKTHROUGH {topic} TECH"
  ],
  fitness: [
    "TRANSFORM WITH {topic}",
    "ULTIMATE {topic} WORKOUT",
    "GET FIT WITH {topic}",
    "POWERFUL {topic} ROUTINE",
    "EFFECTIVE {topic} TRAINING",
    "STRONG {topic} RESULTS",
    "HEALTHY {topic} LIFESTYLE",
    "FITNESS {topic} CHALLENGE",
    "MUSCLE-BUILDING {topic}",
    "FAT-BURNING {topic}"
  ],
  food: [
    "DELICIOUS {topic} RECIPE",
    "TASTY {topic} COOKING",
    "AMAZING {topic} DISH",
    "PERFECT {topic} MEAL",
    "HOMEMADE {topic} MAGIC",
    "CHEF'S {topic} SECRET",
    "EASY {topic} RECIPE",
    "GOURMET {topic} STYLE",
    "HEALTHY {topic} OPTION",
    "COMFORT {topic} FOOD"
  ]
};

const POWER_WORDS = [
  "AMAZING", "INCREDIBLE", "SHOCKING", "UNBELIEVABLE", "EPIC", "INSANE",
  "ULTIMATE", "PERFECT", "LEGENDARY", "MIND-BLOWING", "REVOLUTIONARY",
  "EXCLUSIVE", "SECRET", "HIDDEN", "PROVEN", "GUARANTEED", "INSTANT",
  "POWERFUL", "EFFECTIVE", "PROFESSIONAL", "EXPERT", "ADVANCED"
];

const EMOTIONAL_HOOKS = [
  "YOU WON'T BELIEVE", "THIS WILL SHOCK YOU", "EVERYONE IS TALKING ABOUT",
  "THE TRUTH ABOUT", "WHAT THEY DON'T TELL YOU", "FINALLY REVEALED",
  "THE SECRET TO", "NEVER SEEN BEFORE", "GAME-CHANGING", "LIFE-CHANGING"
];

// Generate AI suggestions based on category and keywords
export const generateThumbnailSuggestions = async (req, res) => {
  try {
    const { category, keywords, style = "engaging" } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse keywords
    const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : [];
    const mainKeyword = keywordList[0] || "content";

    // Get templates for category
    const templates = SUGGESTION_TEMPLATES[category] || SUGGESTION_TEMPLATES.entertainment;
    
    // Generate suggestions based on style
    let suggestions = [];

    if (style === "engaging") {
      // High-energy, clickbait style
      suggestions = templates.map(template => 
        template.replace(/{topic}|{action}/g, mainKeyword.toUpperCase())
      );
    } else if (style === "professional") {
      // More professional, educational style
      const professionalTemplates = [
        `Complete Guide to ${mainKeyword}`,
        `Mastering ${mainKeyword}: Expert Tips`,
        `Professional ${mainKeyword} Techniques`,
        `Advanced ${mainKeyword} Strategies`,
        `Essential ${mainKeyword} Skills`,
        `${mainKeyword} Best Practices`,
        `Comprehensive ${mainKeyword} Tutorial`,
        `Expert ${mainKeyword} Analysis`,
        `In-Depth ${mainKeyword} Review`,
        `${mainKeyword} Fundamentals Explained`
      ];
      suggestions = professionalTemplates;
    } else if (style === "creative") {
      // Creative, artistic style
      const creativeTemplates = [
        `The Art of ${mainKeyword}`,
        `${mainKeyword} Reimagined`,
        `Creative ${mainKeyword} Journey`,
        `Inspiring ${mainKeyword} Stories`,
        `${mainKeyword} Through My Eyes`,
        `Artistic ${mainKeyword} Expression`,
        `${mainKeyword} Masterpiece`,
        `Unique ${mainKeyword} Perspective`,
        `${mainKeyword} Innovation`,
        `Visionary ${mainKeyword} Approach`
      ];
      suggestions = creativeTemplates;
    }

    // Add power words and emotional hooks for engaging style
    if (style === "engaging") {
      const enhancedSuggestions = [];
      
      // Add some with power words
      keywordList.forEach(keyword => {
        const powerWord = POWER_WORDS[Math.floor(Math.random() * POWER_WORDS.length)];
        enhancedSuggestions.push(`${powerWord} ${keyword.toUpperCase()}`);
      });

      // Add some with emotional hooks
      keywordList.forEach(keyword => {
        const hook = EMOTIONAL_HOOKS[Math.floor(Math.random() * EMOTIONAL_HOOKS.length)];
        enhancedSuggestions.push(`${hook} ${keyword.toUpperCase()}`);
      });

      suggestions = [...suggestions, ...enhancedSuggestions];
    }

    // Limit to 10 unique suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 10);

    // Add metadata for each suggestion
    const suggestionsWithMetadata = uniqueSuggestions.map((text, index) => ({
      id: `suggestion_${Date.now()}_${index}`,
      text,
      category,
      style,
      confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7-1.0
      keywords: keywordList,
      length: text.length,
      wordCount: text.split(' ').length
    }));

    res.json({
      suggestions: suggestionsWithMetadata,
      metadata: {
        category,
        style,
        keywords: keywordList,
        totalSuggestions: suggestionsWithMetadata.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Generate suggestions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate suggestions based on image analysis (placeholder for future AI integration)
export const generateImageBasedSuggestions = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For now, return generic suggestions based on common image types
    // In the future, this could integrate with image recognition AI
    const genericSuggestions = [
      "AMAZING TRANSFORMATION",
      "INCREDIBLE RESULTS",
      "BEFORE & AFTER",
      "SHOCKING REVEAL",
      "UNBELIEVABLE CHANGE",
      "EPIC MAKEOVER",
      "MIND-BLOWING RESULTS",
      "PERFECT OUTCOME",
      "STUNNING TRANSFORMATION",
      "GAME-CHANGING RESULTS"
    ];

    const suggestions = genericSuggestions.map((text, index) => ({
      id: `img_suggestion_${Date.now()}_${index}`,
      text,
      category: "general",
      style: "engaging",
      confidence: Math.random() * 0.2 + 0.6, // Lower confidence for generic suggestions
      source: "image_analysis",
      length: text.length,
      wordCount: text.split(' ').length
    }));

    res.json({
      suggestions,
      metadata: {
        imageUrl,
        analysisType: "generic",
        totalSuggestions: suggestions.length,
        generatedAt: new Date().toISOString(),
        note: "Advanced image analysis coming soon!"
      }
    });

  } catch (error) {
    console.error("Generate image-based suggestions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get trending thumbnail text patterns
export const getTrendingPatterns = async (req, res) => {
  try {
    const trendingPatterns = [
      {
        pattern: "POV: You {action}",
        category: "social",
        popularity: 95,
        example: "POV: You discover the secret"
      },
      {
        pattern: "Day {number} of {challenge}",
        category: "challenge",
        popularity: 88,
        example: "Day 30 of fitness challenge"
      },
      {
        pattern: "Things {demographic} don't understand",
        category: "relatable",
        popularity: 82,
        example: "Things adults don't understand"
      },
      {
        pattern: "Why I {action} every day",
        category: "lifestyle",
        popularity: 79,
        example: "Why I meditate every day"
      },
      {
        pattern: "The {adjective} way to {action}",
        category: "tutorial",
        popularity: 76,
        example: "The fastest way to learn coding"
      }
    ];

    res.json({
      patterns: trendingPatterns,
      metadata: {
        totalPatterns: trendingPatterns.length,
        lastUpdated: new Date().toISOString(),
        source: "trending_analysis"
      }
    });

  } catch (error) {
    console.error("Get trending patterns error:", error);
    res.status(500).json({ message: error.message });
  }
};