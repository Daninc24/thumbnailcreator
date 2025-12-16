import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import sharp from "sharp";
import User from "../models/User.js";

// Import io dynamically to avoid circular dependency
let ioInstance = null;
export const setIO = (io) => {
  ioInstance = io;
};

/* ===============================
   UPLOAD IMAGE
================================ */
export const uploadImage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path); // Delete invalid file
      return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      fs.unlinkSync(file.path); // Delete oversized file
      return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check quota before allowing upload (skip for admins)
    if (user.role !== "admin") {
      if (!user.subscription) {
        fs.unlinkSync(file.path); // Delete file
        return res.status(403).json({ message: "No subscription found" });
      }
      
      const quotaUsed = user.subscription.used || 0;
      const quotaLimit = user.subscription.quota || 10;
      
      if (quotaUsed >= quotaLimit) {
        fs.unlinkSync(file.path); // Delete file
        return res.status(403).json({ 
          message: `Quota exceeded. You have used ${quotaUsed}/${quotaLimit} images this month. Please upgrade your plan.`,
          quotaUsed,
          quotaLimit
        });
      }
    }

    // Optimize image: resize if too large and compress
    const optimizedFilename = `opt_${Date.now()}${path.extname(file.originalname)}`;
    const optimizedPath = path.join(path.dirname(file.path), optimizedFilename);
    
    try {
      // Resize if width > 1920px, maintain aspect ratio, and compress
      await sharp(file.path)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(optimizedPath);

      // Delete original and use optimized version
      fs.unlinkSync(file.path);
      
      // Store relative path with forward slashes for URLs
      const storedPath = `uploads/${optimizedFilename}`.replace(/\\/g, '/');

      user.images.push({
        url: storedPath,
        processed: false,
        type: "original",
        createdAt: new Date()
      });

      // Increment quota usage (skip for admins)
      if (user.role !== "admin" && user.subscription) {
        user.subscription.used = (user.subscription.used || 0) + 1;
      }

      await user.save();

      // Emit Socket.IO notification
      if (ioInstance) {
        ioInstance.to(`user-${userId}`).emit("image-processed", {
          type: "image-uploaded",
          imageUrl: storedPath
        });
      }

      res.status(201).json({
        message: "Image uploaded and optimized successfully",
        file: storedPath,
      });
    } catch (optimizeError) {
      // If optimization fails, use original file
      console.error("Optimization error, using original:", optimizeError);
      const filename = path.basename(file.path);
      const storedPath = `uploads/${filename}`.replace(/\\/g, '/');
      
      user.images.push({
        url: storedPath,
        processed: false,
        type: "original",
        createdAt: new Date()
      });

      // Increment quota usage (skip for admins)
      if (user.role !== "admin" && user.subscription) {
        user.subscription.used = (user.subscription.used || 0) + 1;
      }

      await user.save();

      res.status(201).json({
        message: "Image uploaded successfully",
        file: storedPath,
      });
    }
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET USER IMAGES with Pagination and Filters
================================ */
export const getUserImages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let images = [...user.images]; // Copy array to avoid mutating original

    // Filter by processed status
    if (req.query.processed !== undefined) {
      const processed = req.query.processed === 'true';
      images = images.filter(img => img.processed === processed);
    }

    // Filter by type
    if (req.query.type) {
      images = images.filter(img => img.type === req.query.type);
    }

    // Filter by has thumbnail
    if (req.query.hasThumbnail === 'true') {
      images = images.filter(img => img.thumbnail);
    }

    // Search by filename (if needed)
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      images = images.filter(img => 
        img.url.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by date (newest first)
    images.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedImages = images.slice(startIndex, endIndex);

    res.json({
      images: paginatedImages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(images.length / limit),
        totalImages: images.length,
        hasMore: endIndex < images.length
      }
    });
  } catch (err) {
    console.error("GET IMAGES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// Helper to remove background for a single image
export const removeBackgroundLogic = async (userId, imageUrl) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Check quota before processing (skip for admins)
  if (user.role !== "admin") {
    if (!user.subscription) {
      throw new Error("No subscription found");
    }
    
    const quotaUsed = user.subscription.used || 0;
    const quotaLimit = user.subscription.quota || 10;
    
    if (quotaUsed >= quotaLimit) {
      throw new Error(`Quota exceeded. You have used ${quotaUsed}/${quotaLimit} images this month. Please upgrade your plan.`);
    }
  }

  // Resolve the image path - imageUrl from DB is like "uploads/filename.jpg"
  const inputPath = path.resolve(process.cwd(), imageUrl);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Image file not found: ${inputPath}`);
  }

  const outputFile = `bg_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
  const outputFullPath = path.resolve(process.cwd(), outputPath);

  const formData = new FormData();
  formData.append("image_file", fs.createReadStream(inputPath));
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.REMOVEBG_API_KEY,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Remove.bg failed: ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFullPath, buffer);
  
  // Find the original image and update it with processed version
  const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
  if (imageIndex !== -1) {
    // Update existing image to mark as processed and store the processed file path
    user.images[imageIndex].processed = true;
    user.images[imageIndex].type = "bg_removed";
    user.images[imageIndex].url = outputPath; // Update to the processed image
    user.images[imageIndex].bgRemovedAt = new Date();
  } else {
    // If not found, add new entry
    user.images.push({ 
      url: outputPath, 
      processed: true, 
      type: "bg_removed",
      bgRemovedAt: new Date()
    });
  }

  // Increment quota usage (skip for admins)
  if (user.role !== "admin" && user.subscription) {
    user.subscription.used = (user.subscription.used || 0) + 1;
  }

  await user.save();
};

// Route handler for remove background
export const removeBackground = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id || req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    await removeBackgroundLogic(userId, imageUrl);
    res.json({ message: "Background removed successfully" });
  } catch (err) {
    console.error("REMOVE BG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Helper to generate thumbnail for a single image
export const generateThumbnailLogic = async (userId, imageUrl, templateData, text) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Find the processed/bg-removed image to use
  const image = user.images.find((img) => img.url === imageUrl && img.processed);
  if (!image) {
    throw new Error("Processed image not found. Please remove background first.");
  }

  // Resolve the image path - imageUrl from DB is like "uploads/filename.jpg"
  const inputPath = path.resolve(process.cwd(), image.url);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Image file not found: ${inputPath}`);
  }

  const outputFile = `thumb_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
  const outputFullPath = path.resolve(process.cwd(), outputPath);

  // Handle both regular templates and customized templates
  let template = templateData;
  
  // If it's a customized template, merge customizations with base template
  if (templateData?.isCustom && templateData?.customizations) {
    template = {
      ...templateData,
      textConfig: {
        ...templateData.textConfig,
        ...templateData.customizations.textConfig
      },
      backgroundEffects: {
        ...templateData.backgroundEffects,
        ...templateData.customizations.backgroundEffects
      },
      decorativeElements: {
        ...templateData.decorativeElements,
        ...templateData.customizations.decorativeElements
      }
    };
  }
  
  // Fallback to MrBeast style if no template provided
  if (!template) {
    template = {
      textConfig: {
        fontSize: 90,
        fontFamily: "Impact, Arial Black, sans-serif",
        color: "#FFD700",
        strokeColor: "#000000",
        strokeWidth: 8,
        textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
        position: "bottom",
        alignment: "center",
        padding: { x: 40, y: 60 }
      }
    };
  }

  const { textConfig } = template;

  // Calculate text position based on template
  const getTextPosition = () => {
    const { position, padding, customPosition } = textConfig;
    const baseX = 640; // Center X
    let x = baseX;
    let y = 360; // Center Y
    
    // Handle custom position first
    if (position === "custom" && customPosition) {
      return { x: customPosition.x, y: customPosition.y };
    }
    
    switch (position) {
      case "top":
        y = (padding?.y || 60) + textConfig.fontSize;
        break;
      case "center":
        y = 360;
        break;
      case "bottom":
        y = 720 - (padding?.y || 60);
        break;
      case "top-left":
        x = padding?.x || 40;
        y = (padding?.y || 60) + textConfig.fontSize;
        break;
      case "top-right":
        x = 1280 - (padding?.x || 40);
        y = (padding?.y || 60) + textConfig.fontSize;
        break;
      case "bottom-left":
        x = padding?.x || 40;
        y = 720 - (padding?.y || 60);
        break;
      case "bottom-right":
        x = 1280 - (padding?.x || 40);
        y = 720 - (padding?.y || 60);
        break;
      default:
        y = 720 - (padding?.y || 60);
    }
    
    return { x, y };
  };

  const textPosition = getTextPosition();
  const textAnchor = textConfig.alignment === "left" ? "start" : 
                    textConfig.alignment === "right" ? "end" : "middle";

  // Apply text transformations
  let displayText = text;
  if (textConfig.textTransform) {
    switch (textConfig.textTransform) {
      case "uppercase":
        displayText = text.toUpperCase();
        break;
      case "lowercase":
        displayText = text.toLowerCase();
        break;
      case "capitalize":
        displayText = text.replace(/\b\w/g, l => l.toUpperCase());
        break;
      default:
        displayText = text;
    }
  }

  // Create sophisticated SVG with template-based styling
  const svgText = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="4" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.8)"/>
        </filter>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${textConfig.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(textConfig.color, -20)};stop-opacity:1" />
        </linearGradient>
        ${template.backgroundEffects?.overlay && template.backgroundEffects.overlay.type !== "none" ? `
        <linearGradient id="bgOverlay" x1="0%" y1="0%" x2="${template.backgroundEffects.overlay.direction === 'horizontal' ? '100%' : '0%'}" y2="${template.backgroundEffects.overlay.direction === 'vertical' ? '100%' : '0%'}">
          <stop offset="0%" style="stop-color:${template.backgroundEffects.overlay.color1};stop-opacity:${template.backgroundEffects.overlay.opacity || 0.5}" />
          <stop offset="100%" style="stop-color:${template.backgroundEffects.overlay.color2 || template.backgroundEffects.overlay.color1};stop-opacity:${template.backgroundEffects.overlay.opacity || 0.5}" />
        </linearGradient>
        ` : ''}
      </defs>
      
      ${template.backgroundEffects?.overlay && template.backgroundEffects.overlay.type !== "none" ? `
      <rect width="1280" height="720" fill="${template.backgroundEffects.overlay.type === 'gradient' ? 'url(#bgOverlay)' : template.backgroundEffects.overlay.color1}" opacity="${template.backgroundEffects.overlay.opacity || 0.5}" />
      ` : ''}
      
      ${template.decorativeElements?.shapes?.map((shape, index) => {
        const shapeX = shape.position?.includes("left") ? 50 : shape.position?.includes("right") ? 1230 : 640;
        const shapeY = shape.position?.includes("top") ? 50 : shape.position?.includes("bottom") ? 670 : 360;
        const size = shape.size || 40;
        const opacity = shape.opacity || 1;
        const rotation = shape.rotation || 0;
        
        let shapeElement = '';
        switch (shape.type) {
          case "circle":
            shapeElement = `<circle cx="${shapeX}" cy="${shapeY}" r="${size/2}" fill="${shape.color}" opacity="${opacity}" />`;
            break;
          case "rectangle":
            shapeElement = `<rect x="${shapeX - size/2}" y="${shapeY - size/2}" width="${size}" height="${size}" fill="${shape.color}" opacity="${opacity}" transform="rotate(${rotation} ${shapeX} ${shapeY})" />`;
            break;
          case "triangle":
            shapeElement = `<polygon points="${shapeX},${shapeY - size/2} ${shapeX - size/2},${shapeY + size/2} ${shapeX + size/2},${shapeY + size/2}" fill="${shape.color}" opacity="${opacity}" transform="rotate(${rotation} ${shapeX} ${shapeY})" />`;
            break;
          case "star":
            const starPoints = generateStarPoints(shapeX, shapeY, size/2, size/4, 5);
            shapeElement = `<polygon points="${starPoints}" fill="${shape.color}" opacity="${opacity}" transform="rotate(${rotation} ${shapeX} ${shapeY})" />`;
            break;
          case "diamond":
            shapeElement = `<polygon points="${shapeX},${shapeY - size/2} ${shapeX + size/2},${shapeY} ${shapeX},${shapeY + size/2} ${shapeX - size/2},${shapeY}" fill="${shape.color}" opacity="${opacity}" transform="rotate(${rotation} ${shapeX} ${shapeY})" />`;
            break;
        }
        
        if (shape.borderColor && shape.borderWidth) {
          shapeElement = shapeElement.replace('fill=', `stroke="${shape.borderColor}" stroke-width="${shape.borderWidth}" fill=`);
        }
        
        return shapeElement;
      }).join('') || ''}
      
      ${template.decorativeElements?.badges?.map((badge, index) => {
        const badgeX = badge.position?.includes("left") ? 20 : badge.position?.includes("right") ? 1200 : 640;
        const badgeY = badge.position?.includes("top") ? 30 : badge.position?.includes("bottom") ? 680 : 360;
        const padding = badge.padding || 8;
        const borderRadius = badge.borderRadius || 4;
        const fontSize = badge.fontSize || 12;
        const opacity = badge.opacity || 1;
        
        return `
        <rect x="${badgeX - 40}" y="${badgeY - 12}" width="80" height="24" fill="${badge.backgroundColor}" rx="${borderRadius}" opacity="${opacity}" />
        <text x="${badgeX}" y="${badgeY + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${badge.color}">
          ${badge.text}
        </text>
        `;
      }).join('') || ''}
      
      <style>
        .title { 
          fill: ${textConfig.color}; 
          font-size: ${textConfig.fontSize}px; 
          font-weight: ${textConfig.fontWeight || 900}; 
          font-family: ${textConfig.fontFamily}; 
          stroke: ${textConfig.strokeColor || 'none'}; 
          stroke-width: ${textConfig.strokeWidth || 0}px;
          filter: url(#shadow);
          text-anchor: ${textAnchor};
          dominant-baseline: middle;
          letter-spacing: ${textConfig.letterSpacing || 0}px;
        }
      </style>
      <text x="${textPosition.x}" y="${textPosition.y}" class="title" transform="rotate(${textConfig.rotation || 0} ${textPosition.x} ${textPosition.y})">
        ${displayText}
      </text>
      
      ${template.decorativeElements?.borders?.enabled ? `
      <rect x="${template.decorativeElements.borders.width/2}" y="${template.decorativeElements.borders.width/2}" width="${1280 - template.decorativeElements.borders.width}" height="${720 - template.decorativeElements.borders.width}" fill="none" stroke="${template.decorativeElements.borders.color}" stroke-width="${template.decorativeElements.borders.width}" stroke-dasharray="${template.decorativeElements.borders.style === 'dashed' ? '10,5' : template.decorativeElements.borders.style === 'dotted' ? '2,2' : 'none'}" rx="${template.decorativeElements.borders.radius || 0}" opacity="${template.decorativeElements.borders.opacity || 1}" />
      ` : ''}
    </svg>
  `;

// Helper function to generate star points
function generateStarPoints(cx, cy, outerRadius, innerRadius, points) {
  let result = '';
  const angle = Math.PI / points;
  
  for (let i = 0; i < 2 * points; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(i * angle - Math.PI / 2) * radius;
    const y = cy + Math.sin(i * angle - Math.PI / 2) * radius;
    result += `${x},${y} `;
  }
  
  return result.trim();
}

  // Apply image processing with enhanced quality and effects
  let imageProcessor = sharp(inputPath)
    .resize(1280, 720, { 
      fit: 'cover', 
      position: 'center' 
    });

  // Apply background effects if specified
  if (template.backgroundEffects) {
    const effects = template.backgroundEffects;
    
    // Apply brightness adjustment
    if (effects.brightness?.enabled && effects.brightness.value !== 0) {
      const brightnessMultiplier = 1 + (effects.brightness.value / 100);
      imageProcessor = imageProcessor.modulate({ brightness: brightnessMultiplier });
    }
    
    // Apply saturation adjustment
    if (effects.saturation?.enabled && effects.saturation.value !== 0) {
      const saturationMultiplier = 1 + (effects.saturation.value / 100);
      imageProcessor = imageProcessor.modulate({ saturation: saturationMultiplier });
    }
    
    // Apply blur effect
    if (effects.blur?.enabled && effects.blur.intensity > 0) {
      imageProcessor = imageProcessor.blur(effects.blur.intensity);
    }
  }

  // Composite the SVG overlay
  imageProcessor = imageProcessor.composite([{ 
    input: Buffer.from(svgText), 
    gravity: 'center' 
  }]);

  // Output with high quality
  await imageProcessor
    .png({ 
      quality: 95, 
      compressionLevel: 6 
    })
    .toFile(outputFullPath);

  // Update the image to mark it as having a thumbnail
  const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
  if (imageIndex !== -1) {
    user.images[imageIndex].thumbnail = outputPath;
    user.images[imageIndex].thumbnailGeneratedAt = new Date();
  }
  
  // Also add as new entry
  user.images.push({ 
    url: outputPath, 
    processed: true, 
    type: "thumbnail",
    thumbnail: outputPath,
    template: templateData?.name || "Custom",
    thumbnailGeneratedAt: new Date(),
    downloaded: false // Track if this thumbnail has been downloaded
  });

  await user.save();
  
  // Emit Socket.IO notification
  if (ioInstance) {
    ioInstance.to(`user-${userId}`).emit("image-processed", {
      type: "thumbnail-generated",
      imageUrl: outputPath,
      originalUrl: imageUrl
    });
  }
};

// Helper function to adjust color brightness
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Route handler for generate thumbnail
export const generateThumbnail = async (req, res) => {
  try {
    const { imageUrl, template, text } = req.body;
    const userId = req.user._id || req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    await generateThumbnailLogic(userId, imageUrl, template, text || "");
    res.json({ message: "Thumbnail generated successfully" });
  } catch (err) {
    console.error("GENERATE THUMBNAIL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE IMAGE
export const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const imageIndex = user.images.findIndex((img) => img.url === imageUrl);
    if (imageIndex === -1) return res.status(404).json({ message: "Image not found" });

    // Remove file from disk - imageUrl is relative like "uploads/filename.jpg"
    const filePath = path.resolve(process.cwd(), user.images[imageIndex].url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from user.images array
    user.images.splice(imageIndex, 1);
    await user.save();

    res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk remove background
export const removeBackgroundBulk = async (req, res) => {
  try {
    const { imageUrls } = req.body; // array of URLs
    const userId = req.user._id || req.user.id;
    const io = req.app.get("io");
    
    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Return immediately, process in background
    res.json({ message: "Bulk processing started", total: imageUrls.length });

    // Process images with progress tracking
    const results = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        await removeBackgroundLogic(userId, url);
        results.push({ url, status: "success" });

        // Emit progress
        const progress = Math.round(((i + 1) / imageUrls.length) * 100);
        if (io) {
          io.to(`user-${userId}`).emit("bulk-progress", {
            type: "bg-removed",
            imageUrl: url,
            progress,
            completed: i + 1,
            total: imageUrls.length,
            status: "success"
          });
        }
      } catch (err) {
        results.push({ url, status: "failed", error: err.message });
        
        // Emit error progress
        const progress = Math.round(((i + 1) / imageUrls.length) * 100);
        if (io) {
          io.to(`user-${userId}`).emit("bulk-progress", {
            type: "bg-error",
            imageUrl: url,
            error: err.message,
            progress,
            completed: i + 1,
            total: imageUrls.length,
            status: "failed"
          });
        }
      }
    }

    // Emit completion
    if (io) {
      io.to(`user-${userId}`).emit("bulk-complete", {
        type: "bg-bulk-complete",
        results,
        total: imageUrls.length,
        successful: results.filter(r => r.status === "success").length,
        failed: results.filter(r => r.status === "failed").length
      });
    }
  } catch (err) {
    console.error("BULK REMOVE BG ERROR:", err);
    const io = req.app.get("io");
    const userId = req.user._id || req.user.id;
    if (io) {
      io.to(`user-${userId}`).emit("bulk-error", {
        type: "bg-bulk-error",
        error: err.message
      });
    }
  }
};

// Bulk generate thumbnails
export const generateThumbnailBulk = async (req, res) => {
  try {
    const { imageUrls, template, texts } = req.body;
    const userId = req.user._id || req.user.id;
    const io = req.app.get("io");
    
    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Return immediately, process in background
    res.json({ message: "Bulk thumbnail generation started", total: imageUrls.length });

    // Process images with progress tracking
    const results = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        await generateThumbnailLogic(userId, url, template, texts[url] || "");
        results.push({ url, status: "success" });

        // Emit progress
        const progress = Math.round(((i + 1) / imageUrls.length) * 100);
        if (io) {
          io.to(`user-${userId}`).emit("bulk-progress", {
            type: "thumbnail-generated",
            imageUrl: url,
            progress,
            completed: i + 1,
            total: imageUrls.length,
            status: "success"
          });
        }
      } catch (err) {
        results.push({ url, status: "failed", error: err.message });
        
        // Emit error progress
        const progress = Math.round(((i + 1) / imageUrls.length) * 100);
        if (io) {
          io.to(`user-${userId}`).emit("bulk-progress", {
            type: "thumbnail-error",
            imageUrl: url,
            error: err.message,
            progress,
            completed: i + 1,
            total: imageUrls.length,
            status: "failed"
          });
        }
      }
    }

    // Emit completion
    if (io) {
      io.to(`user-${userId}`).emit("bulk-complete", {
        type: "thumbnail-bulk-complete",
        results,
        total: imageUrls.length,
        successful: results.filter(r => r.status === "success").length,
        failed: results.filter(r => r.status === "failed").length
      });
    }
  } catch (err) {
    console.error("BULK GENERATE THUMBNAIL ERROR:", err);
    const io = req.app.get("io");
    const userId = req.user._id || req.user.id;
    if (io) {
      io.to(`user-${userId}`).emit("bulk-error", {
        type: "thumbnail-bulk-error",
        error: err.message
      });
    }
  }
};

// Download processed image
export const downloadImage = async (req, res) => {
  try {
    const { imageUrl } = req.query;
    const userId = req.user._id || req.user.id;
    
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    // imageUrl is relative like "uploads/filename.jpg", resolve it
    const filePath = path.resolve(process.cwd(), imageUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    // Check if this is a thumbnail and handle quota
    const user = await User.findById(userId);
    if (user && user.role !== "admin") {
      const imageRecord = user.images.find(img => img.url === imageUrl);
      
      // Only deduct quota for thumbnails that haven't been downloaded before
      if (imageRecord && imageRecord.type === "thumbnail" && !imageRecord.downloaded) {
        // Check quota before allowing download
        if (!user.subscription) {
          return res.status(403).json({ message: "No subscription found" });
        }
        
        const quotaUsed = user.subscription.used || 0;
        const quotaLimit = user.subscription.quota || 10;
        
        if (quotaUsed >= quotaLimit) {
          return res.status(403).json({ 
            message: `Quota exceeded. You have used ${quotaUsed}/${quotaLimit} images this month. Please upgrade your plan.`,
            quotaUsed,
            quotaLimit
          });
        }

        // Mark as downloaded and increment quota
        imageRecord.downloaded = true;
        imageRecord.downloadedAt = new Date();
        user.subscription.used = (user.subscription.used || 0) + 1;
        await user.save();

        console.log(`Quota deducted for user ${userId}: ${user.subscription.used}/${user.subscription.quota}`);
      }
    }

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    console.error("DOWNLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};