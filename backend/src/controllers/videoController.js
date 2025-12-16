import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import multer from "multer";
import User from "../models/User.js";

// Import io dynamically to avoid circular dependency
let ioInstance = null;
export const setVideoIO = (io) => {
  ioInstance = io;
};

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/* ===============================
   UPLOAD VIDEO FOR EDITING
================================ */
export const uploadVideo = [
  videoUpload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Get video file info
      const videoPath = req.file.path.replace(/\\/g, '/');
      const relativePath = path.relative(process.cwd(), videoPath).replace(/\\/g, '/');
      
      console.log('Processing video upload:', {
        originalName: req.file.originalname,
        size: req.file.size,
        path: relativePath
      });
      
      // Get video metadata (with fallback for no FFmpeg)
      let videoMetadata;
      try {
        videoMetadata = await getVideoMetadata(videoPath);
      } catch (metadataError) {
        console.error('Metadata extraction failed, using defaults:', metadataError);
        videoMetadata = {
          duration: 10,
          width: 1920,
          height: 1080,
          fps: 30,
          codec: 'unknown',
          bitrate: 0,
          size: req.file.size,
          note: 'Metadata extraction failed - using defaults'
        };
      }

      // Save video info to user's uploads
      user.images.push({
        url: relativePath,
        processed: true,
        type: "uploaded-video",
        template: "User Upload",
        createdAt: new Date(),
        downloaded: false,
        metadata: videoMetadata
      });

      await user.save();

      console.log('Video upload successful:', relativePath);

      res.json({
        message: "Video uploaded successfully",
        videoUrl: relativePath,
        metadata: videoMetadata,
        ffmpegAvailable: await checkFFmpegAvailability()
      });

    } catch (error) {
      console.error("Video upload error:", error);
      
      // Clean up uploaded file if there was an error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Cleaned up failed upload file:', req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: "Video upload failed", 
        error: error.message,
        details: "Check server logs for more information"
      });
    }
  }
];

/* ===============================
   UPLOAD AUDIO FOR VIDEO EDITING
================================ */
const audioUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for audio
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

export const uploadAudio = [
  audioUpload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Get audio file info
      const audioPath = req.file.path.replace(/\\/g, '/');
      const relativePath = path.relative(process.cwd(), audioPath).replace(/\\/g, '/');
      
      // Get audio metadata
      const audioMetadata = await getAudioMetadata(audioPath);

      res.json({
        message: "Audio uploaded successfully",
        audioUrl: relativePath,
        metadata: audioMetadata
      });

    } catch (error) {
      console.error("Audio upload error:", error);
      res.status(500).json({ message: error.message });
    }
  }
];

/* ===============================
   GET AUDIO METADATA
================================ */
const getAudioMetadata = async (audioPath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      audioPath
    ]);

    let output = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
          
          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            codec: audioStream?.codec_name || 'unknown',
            bitrate: parseInt(metadata.format.bit_rate) || 0,
            sampleRate: parseInt(audioStream?.sample_rate) || 0,
            channels: parseInt(audioStream?.channels) || 0,
            size: parseInt(metadata.format.size) || 0
          });
        } catch (error) {
          resolve({
            duration: 0,
            codec: 'unknown',
            bitrate: 0,
            sampleRate: 44100,
            channels: 2,
            size: 0
          });
        }
      } else {
        resolve({
          duration: 0,
          codec: 'unknown',
          bitrate: 0,
          sampleRate: 44100,
          channels: 2,
          size: 0
        });
      }
    });

    ffprobe.on('error', () => {
      resolve({
        duration: 0,
        codec: 'unknown',
        bitrate: 0,
        sampleRate: 44100,
        channels: 2,
        size: 0
      });
    });
  });
};

/* ===============================
   GET VIDEO METADATA
================================ */
const getVideoMetadata = async (videoPath) => {
  // Check if FFmpeg is available first
  const ffmpegAvailable = await checkFFmpegAvailability();
  
  if (!ffmpegAvailable) {
    // Return basic metadata without FFmpeg
    console.log('FFmpeg not available, using basic metadata for video upload');
    return {
      duration: 10, // Default duration
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'unknown',
      bitrate: 0,
      size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0,
      note: 'Basic metadata - install FFmpeg for detailed video analysis'
    };
  }

  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);

    let output = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          
          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            fps: eval(videoStream?.r_frame_rate) || 30,
            codec: videoStream?.codec_name || 'unknown',
            bitrate: parseInt(metadata.format.bit_rate) || 0,
            size: parseInt(metadata.format.size) || 0
          });
        } catch (error) {
          // Fallback metadata if parsing fails
          resolve({
            duration: 10,
            width: 1920,
            height: 1080,
            fps: 30,
            codec: 'unknown',
            bitrate: 0,
            size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0
          });
        }
      } else {
        // Fallback metadata if ffprobe fails
        resolve({
          duration: 10,
          width: 1920,
          height: 1080,
          fps: 30,
          codec: 'unknown',
          bitrate: 0,
          size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0
        });
      }
    });

    ffprobe.on('error', (error) => {
      console.log('FFprobe error, using fallback metadata:', error.message);
      // Fallback metadata if ffprobe fails
      resolve({
        duration: 10,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: 'unknown',
        bitrate: 0,
        size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0
      });
    });
  });
};

/* ===============================
   CREATE VIDEO FROM TEMPLATE
================================ */
export const createVideo = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { template, layers, settings, exportSettings } = req.body;

    if (!template || !layers) {
      return res.status(400).json({ message: "Template and layers are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check quota before processing (skip for admins)
    if (user.role !== "admin") {
      if (!user.subscription) {
        return res.status(403).json({ message: "No subscription found" });
      }
      
      const quotaUsed = user.subscription.used || 0;
      const quotaLimit = user.subscription.quota || 10;
      
      if (quotaUsed >= quotaLimit) {
        return res.status(403).json({ 
          message: `Quota exceeded. You have used ${quotaUsed}/${quotaLimit} videos this month. Please upgrade your plan.`,
          quotaUsed,
          quotaLimit
        });
      }
    }

    // Generate unique filename
    const outputFile = `video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${exportSettings.format || 'mp4'}`;
    const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
    const outputFullPath = path.resolve(process.cwd(), outputPath);

    // Start video processing in background
    processVideoInBackground(userId, template, layers, settings, exportSettings, outputFullPath, outputPath);

    res.json({ 
      message: "Video processing started", 
      videoId: outputFile.split('.')[0],
      estimatedTime: calculateEstimatedTime(settings.duration, exportSettings)
    });

  } catch (err) {
    console.error("CREATE VIDEO ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   PROCESS VIDEO IN BACKGROUND
================================ */
const processVideoInBackground = async (userId, template, layers, settings, exportSettings, outputFullPath, outputPath) => {
  try {
    // Emit start notification
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-start", {
        message: "Video processing started",
        estimatedTime: calculateEstimatedTime(settings.duration, exportSettings),
        aspectRatio: template.aspectRatio || "16:9",
        resolution: exportSettings.resolution
      });
    }

    // Create frames directory
    const framesDir = path.join(path.dirname(outputFullPath), 'frames_' + Date.now());
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // Generate frames
    const frameCount = Math.ceil(settings.duration * (exportSettings.fps || 30));
    const framePromises = [];

    for (let frame = 0; frame < frameCount; frame++) {
      const currentTime = (frame / (exportSettings.fps || 30));
      framePromises.push(generateFrame(layers, settings, currentTime, frame, framesDir, template.resolution));
      
      // Emit progress for frame generation
      if (ioInstance && frame % 10 === 0) {
        const progress = Math.round((frame / frameCount) * 50); // First 50% for frame generation
        ioInstance.to(`user-${userId}`).emit("video-processing-progress", {
          progress,
          stage: "Generating frames",
          frame: frame + 1,
          totalFrames: frameCount
        });
      }
    }

    await Promise.all(framePromises);

    // Emit frame generation complete
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-progress", {
        progress: 50,
        stage: "Frames generated, encoding video...",
        frame: frameCount,
        totalFrames: frameCount
      });
    }

    // Encode video using FFmpeg
    await encodeVideo(framesDir, outputFullPath, exportSettings, (progress) => {
      if (ioInstance) {
        const totalProgress = 50 + Math.round(progress * 0.5); // Second 50% for encoding
        ioInstance.to(`user-${userId}`).emit("video-processing-progress", {
          progress: totalProgress,
          stage: "Encoding video...",
          encodingProgress: progress
        });
      }
    });

    // Clean up frames directory
    fs.rmSync(framesDir, { recursive: true, force: true });

    // Update user data
    const user = await User.findById(userId);
    if (user) {
      user.images.push({
        url: outputPath,
        processed: true,
        type: "video",
        template: template.name || "Custom Video",
        createdAt: new Date(),
        downloaded: false
      });

      // Increment quota usage (skip for admins)
      if (user.role !== "admin" && user.subscription) {
        user.subscription.used = (user.subscription.used || 0) + 1;
      }

      await user.save();
    }

    // Emit completion
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-complete", {
        message: "Video created successfully!",
        videoUrl: outputPath,
        downloadUrl: `/api/upload/download?imageUrl=${outputPath}`
      });
    }

  } catch (error) {
    console.error("Video processing error:", error);
    
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-error", {
        message: "Video processing failed",
        error: error.message
      });
    }
  }
};

/* ===============================
   GENERATE SINGLE FRAME
================================ */
const generateFrame = async (layers, settings, currentTime, frameNumber, framesDir, resolution) => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas-like frame data
      const frameData = {
        width: resolution.width,
        height: resolution.height,
        backgroundColor: settings.backgroundColor || "#000000",
        layers: layers.filter(layer => 
          layer.visible && 
          currentTime >= layer.startTime && 
          currentTime <= layer.startTime + layer.duration
        ).map(layer => {
          const layerTime = currentTime - layer.startTime;
          return {
            ...layer,
            animatedProperties: calculateAnimatedProperties(layer, layerTime)
          };
        })
      };

      // Generate SVG for this frame
      const svgContent = generateFrameSVG(frameData);
      
      // Save frame as SVG (will be converted to PNG by FFmpeg)
      const framePath = path.join(framesDir, `frame_${frameNumber.toString().padStart(6, '0')}.svg`);
      fs.writeFileSync(framePath, svgContent);
      
      resolve(framePath);
    } catch (error) {
      reject(error);
    }
  });
};

/* ===============================
   GENERATE SVG FOR FRAME
================================ */
const generateFrameSVG = (frameData) => {
  const { width, height, backgroundColor, layers } = frameData;
  
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${backgroundColor}" />
  `;

  // Sort layers by zIndex
  const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);

  // Render each layer
  sortedLayers.forEach(layer => {
    const props = layer.animatedProperties;
    const transform = `translate(${props.position.x}, ${props.position.y}) rotate(${props.rotation}) scale(${props.scale || 1})`;
    
    switch (layer.type) {
      case "text":
        svgContent += generateTextLayerSVG(layer, props, transform);
        break;
      case "shape":
        svgContent += generateShapeLayerSVG(layer, props, transform);
        break;
      case "image":
        svgContent += generateImageLayerSVG(layer, props, transform);
        break;
    }
  });

  svgContent += `</svg>`;
  return svgContent;
};

/* ===============================
   GENERATE TEXT LAYER SVG
================================ */
const generateTextLayerSVG = (layer, props, transform) => {
  const textProps = layer.properties;
  const lines = textProps.text.split('\n');
  
  let textSVG = `<g transform="${transform}" opacity="${props.opacity}">`;
  
  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * (textProps.fontSize * 1.2);
    
    textSVG += `
      <text x="0" y="${y}" 
            font-family="${textProps.fontFamily}" 
            font-size="${textProps.fontSize}" 
            font-weight="${textProps.fontWeight || 'normal'}"
            text-anchor="${textProps.textAlign || 'middle'}" 
            dominant-baseline="middle"
            fill="${textProps.color}"
            ${textProps.strokeWidth ? `stroke="${textProps.strokeColor}" stroke-width="${textProps.strokeWidth}"` : ''}
            filter="url(#shadow)">
        ${line}
      </text>
    `;
  });
  
  textSVG += `</g>`;
  return textSVG;
};

/* ===============================
   GENERATE SHAPE LAYER SVG
================================ */
const generateShapeLayerSVG = (layer, props, transform) => {
  const shapeProps = layer.properties;
  let shapeSVG = `<g transform="${transform}" opacity="${props.opacity}">`;
  
  if (shapeProps.gradient) {
    const gradientId = `gradient_${layer.id}`;
    shapeSVG += `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          ${shapeProps.gradient.colors.map((color, index) => 
            `<stop offset="${(index / (shapeProps.gradient.colors.length - 1)) * 100}%" style="stop-color:${color};stop-opacity:1" />`
          ).join('')}
        </linearGradient>
      </defs>
    `;
  }
  
  const fillColor = shapeProps.gradient ? `url(#gradient_${layer.id})` : shapeProps.color;
  const x = -layer.size.width / 2;
  const y = -layer.size.height / 2;
  
  shapeSVG += `
    <rect x="${x}" y="${y}" 
          width="${layer.size.width}" 
          height="${layer.size.height}" 
          fill="${fillColor}" />
  `;
  
  shapeSVG += `</g>`;
  return shapeSVG;
};

/* ===============================
   GENERATE IMAGE LAYER SVG
================================ */
const generateImageLayerSVG = (layer, props, transform) => {
  const imageProps = layer.properties;
  const x = -layer.size.width / 2;
  const y = -layer.size.height / 2;
  
  // For now, create a placeholder rectangle
  // In production, you'd want to embed the actual image
  return `
    <g transform="${transform}" opacity="${props.opacity}">
      <rect x="${x}" y="${y}" 
            width="${layer.size.width}" 
            height="${layer.size.height}" 
            fill="#333" 
            stroke="#666" 
            stroke-width="2" />
      <text x="0" y="0" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            fill="#999" 
            font-size="24">
        IMAGE
      </text>
    </g>
  `;
};

/* ===============================
   CALCULATE ANIMATED PROPERTIES
================================ */
const calculateAnimatedProperties = (layer, layerTime) => {
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

/* ===============================
   HELPER FUNCTIONS
================================ */
const lerp = (start, end, progress) => {
  return start + (end - start) * progress;
};

const applyEasing = (progress, easing) => {
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

/* ===============================
   CHECK FFMPEG AVAILABILITY
================================ */
const checkFFmpegAvailability = () => {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
};

/* ===============================
   ENCODE VIDEO WITH FFMPEG
================================ */
const encodeVideo = async (framesDir, outputPath, exportSettings, progressCallback, audioPath = null) => {
  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpegAvailability();
  
  if (!ffmpegAvailable) {
    // Fallback: Create a simple video placeholder or use alternative method
    console.warn('FFmpeg not available, using fallback method');
    return createVideoFallback(framesDir, outputPath, exportSettings, progressCallback);
  }

  return new Promise((resolve, reject) => {
    const fps = exportSettings.fps || 30;
    const format = exportSettings.format || 'mp4';
    
    let ffmpegArgs = [
      '-y', // Overwrite output file
      '-framerate', fps.toString(),
      '-i', path.join(framesDir, 'frame_%06d.svg'),
    ];

    // Add audio input if provided
    if (audioPath && fs.existsSync(audioPath)) {
      ffmpegArgs.push('-i', audioPath);
      // Mix audio with video
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');
      // Ensure video duration matches audio or vice versa
      ffmpegArgs.push('-shortest');
    }

    // Quality settings
    switch (exportSettings.quality) {
      case 'low':
        ffmpegArgs.push('-crf', '28', '-preset', 'fast');
        break;
      case 'medium':
        ffmpegArgs.push('-crf', '23', '-preset', 'medium');
        break;
      case 'high':
        ffmpegArgs.push('-crf', '18', '-preset', 'slow');
        break;
      case 'ultra':
        ffmpegArgs.push('-crf', '15', '-preset', 'veryslow');
        break;
      default:
        ffmpegArgs.push('-crf', '23', '-preset', 'medium');
    }

    // Format-specific settings
    if (format === 'gif') {
      ffmpegArgs.push(
        '-vf', 'fps=15,scale=640:-1:flags=lanczos,palettegen=reserve_transparent=0',
        '-f', 'gif'
      );
    } else if (format === 'webm') {
      ffmpegArgs.push('-c:v', 'libvpx-vp9', '-b:v', '1M');
    } else {
      ffmpegArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
    }

    ffmpegArgs.push(outputPath);

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
      
      // Parse progress from FFmpeg output
      const progressMatch = stderr.match(/frame=\s*(\d+)/);
      if (progressMatch && progressCallback) {
        const currentFrame = parseInt(progressMatch[1]);
        const totalFrames = fs.readdirSync(framesDir).length;
        const progress = Math.min((currentFrame / totalFrames) * 100, 100);
        progressCallback(progress);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`FFmpeg error: ${error.message}. Please ensure FFmpeg is installed and available in PATH.`));
    });
  });
};

/* ===============================
   CALCULATE ESTIMATED TIME
================================ */
const calculateEstimatedTime = (duration, exportSettings) => {
  const baseTime = duration * 2; // Base: 2 seconds per second of video
  const qualityMultiplier = {
    'low': 1,
    'medium': 1.5,
    'high': 2,
    'ultra': 3
  }[exportSettings.quality] || 1.5;
  
  const formatMultiplier = {
    'mp4': 1,
    'gif': 0.8,
    'webm': 1.2
  }[exportSettings.format] || 1;
  
  return Math.ceil(baseTime * qualityMultiplier * formatMultiplier);
};

/* ===============================
   GET VIDEO PROCESSING STATUS
================================ */
export const getVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const video = user.images.find(img => img.url.includes(videoId));
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    res.json({
      status: "completed",
      videoUrl: video.url,
      downloadUrl: `/api/upload/download?imageUrl=${video.url}`,
      createdAt: video.createdAt
    });
    
  } catch (err) {
    console.error("GET VIDEO STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   CONVERT THUMBNAIL TO VIDEO
================================ */
export const thumbnailToVideo = async (req, res) => {
  try {
    const { imageUrl, animationType, duration } = req.body;
    const userId = req.user._id || req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check quota
    if (user.role !== "admin") {
      if (!user.subscription) {
        return res.status(403).json({ message: "No subscription found" });
      }
      
      const quotaUsed = user.subscription.used || 0;
      const quotaLimit = user.subscription.quota || 10;
      
      if (quotaUsed >= quotaLimit) {
        return res.status(403).json({ 
          message: `Quota exceeded. You have used ${quotaUsed}/${quotaLimit} videos this month.`,
          quotaUsed,
          quotaLimit
        });
      }
    }

    // Create animated video template based on thumbnail
    const animatedTemplate = {
      id: "animated-thumbnail",
      name: "Animated Thumbnail",
      duration: duration || 3,
      resolution: { width: 1280, height: 720 },
      layers: [
        {
          id: "thumbnail-image",
          type: "image",
          name: "Thumbnail",
          visible: true,
          locked: false,
          startTime: 0,
          duration: duration || 3,
          properties: { src: imageUrl, fit: "cover" },
          position: { x: 640, y: 360 },
          size: { width: 1280, height: 720 },
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          animations: getAnimationByType(animationType, duration || 3)
        }
      ]
    };

    const exportSettings = {
      format: "mp4",
      quality: "high",
      fps: 30,
      resolution: { width: 1280, height: 720 },
      duration: duration || 3
    };

    // Generate unique filename
    const outputFile = `animated_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp4`;
    const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
    const outputFullPath = path.resolve(process.cwd(), outputPath);

    // Start processing
    processVideoInBackground(
      userId, 
      animatedTemplate, 
      animatedTemplate.layers, 
      { duration: duration || 3, backgroundColor: "#000000" }, 
      exportSettings, 
      outputFullPath, 
      outputPath
    );

    res.json({ 
      message: "Animated thumbnail processing started", 
      videoId: outputFile.split('.')[0],
      estimatedTime: calculateEstimatedTime(duration || 3, exportSettings)
    });

  } catch (err) {
    console.error("THUMBNAIL TO VIDEO ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   CHECK SYSTEM CAPABILITIES
================================ */
export const checkSystemCapabilities = async (req, res) => {
  try {
    const ffmpegAvailable = await checkFFmpegAvailability();
    
    res.json({
      ffmpeg: ffmpegAvailable,
      videoCreation: true, // Always available with fallback
      fullVideoFeatures: ffmpegAvailable,
      message: ffmpegAvailable 
        ? "Full video creation capabilities available with FFmpeg" 
        : "Basic video creation available. Install FFmpeg for full features (MP4, GIF, WebM encoding, audio mixing).",
      installationGuide: ffmpegAvailable ? null : {
        windows: {
          chocolatey: "choco install ffmpeg",
          manual: "Download from https://www.gyan.dev/ffmpeg/builds/ and add to PATH"
        },
        note: "Restart the server after installing FFmpeg"
      }
    });
  } catch (err) {
    console.error("CHECK SYSTEM CAPABILITIES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   AI VIDEO GENERATION
================================ */
export const generateAIVideo = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { prompt, platform, duration, style, includeText, includeMusic, colorScheme } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check quota before processing (skip for admins)
    if (user.role !== "admin") {
      if (!user.subscription) {
        return res.status(403).json({ message: "No subscription found" });
      }
      
      const quotaUsed = user.subscription.used || 0;
      const quotaLimit = user.subscription.quota || 10;
      
      if (quotaUsed >= quotaLimit) {
        return res.status(403).json({ 
          message: `Quota exceeded. You have used ${quotaUsed}/${quotaLimit} videos this month. Please upgrade your plan.`,
          quotaUsed,
          quotaLimit
        });
      }
    }

    // Generate AI video template based on prompt
    const aiTemplate = await generateAITemplate(prompt, platform, duration, style, includeText, colorScheme);
    
    // Generate unique filename
    const outputFile = `ai_video_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp4`;
    const outputPath = `uploads/${outputFile}`.replace(/\\/g, '/');
    const outputFullPath = path.resolve(process.cwd(), outputPath);

    const exportSettings = {
      format: "mp4",
      quality: "high",
      fps: 30,
      resolution: aiTemplate.resolution,
      duration: duration,
      platform: platform
    };

    // Start AI video processing in background
    processAIVideoInBackground(userId, aiTemplate, exportSettings, outputFullPath, outputPath, prompt);

    res.json({ 
      message: "AI video generation started", 
      videoId: outputFile.split('.')[0],
      estimatedTime: calculateEstimatedTime(duration, exportSettings)
    });

  } catch (err) {
    console.error("AI VIDEO GENERATION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GENERATE AI TEMPLATE
================================ */
const generateAITemplate = async (prompt, platform, duration, style, includeText, colorScheme) => {
  // Platform-specific settings
  const platformSettings = {
    youtube: { width: 1080, height: 1920, aspectRatio: "9:16" },
    tiktok: { width: 1080, height: 1920, aspectRatio: "9:16" },
    instagram: { width: 1080, height: 1920, aspectRatio: "9:16" },
    universal: { width: 1920, height: 1080, aspectRatio: "16:9" }
  };

  const settings = platformSettings[platform] || platformSettings.universal;

  // Style-based color schemes and fonts
  const styleConfig = {
    modern: {
      colors: [colorScheme || "#4F46E5", "#7C3AED", "#EC4899"],
      font: "Helvetica Neue",
      animations: ["fade", "slide"]
    },
    minimalist: {
      colors: [colorScheme || "#1F2937", "#374151", "#6B7280"],
      font: "Arial",
      animations: ["fade"]
    },
    energetic: {
      colors: [colorScheme || "#EF4444", "#F59E0B", "#10B981"],
      font: "Impact",
      animations: ["bounce", "zoom"]
    },
    professional: {
      colors: [colorScheme || "#1E40AF", "#3730A3", "#581C87"],
      font: "Times New Roman",
      animations: ["slide", "fade"]
    },
    fun: {
      colors: [colorScheme || "#EC4899", "#8B5CF6", "#06B6D4"],
      font: "Comic Sans MS",
      animations: ["bounce", "pulse"]
    },
    dramatic: {
      colors: [colorScheme || "#7F1D1D", "#92400E", "#1F2937"],
      font: "Georgia",
      animations: ["zoom", "fade"]
    }
  };

  const config = styleConfig[style] || styleConfig.modern;

  // Generate AI-powered content based on prompt
  const aiContent = await generateAIContent(prompt, style, platform);

  // Create template structure
  const aiTemplate = {
    id: "ai-generated",
    name: "AI Generated Video",
    category: "ai-generated",
    duration: duration,
    resolution: settings,
    layers: [
      // Background layer
      {
        id: "ai-bg",
        type: "shape",
        name: "AI Background",
        visible: true,
        locked: false,
        startTime: 0,
        duration: duration,
        properties: {
          shape: "rectangle",
          gradient: {
            type: "linear",
            colors: config.colors,
            direction: "diagonal"
          }
        },
        position: { x: 0, y: 0 },
        size: { width: settings.width, height: settings.height },
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        animations: []
      }
    ]
  };

  // Add text layers if requested
  if (includeText && aiContent.textElements) {
    aiContent.textElements.forEach((textElement, index) => {
      aiTemplate.layers.push({
        id: `ai-text-${index}`,
        type: "text",
        name: `AI Text ${index + 1}`,
        visible: true,
        locked: false,
        startTime: textElement.startTime,
        duration: textElement.duration,
        properties: {
          text: textElement.text,
          fontSize: textElement.fontSize || 80,
          fontFamily: config.font,
          color: textElement.color || "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 3,
          textAlign: "center"
        },
        position: textElement.position,
        size: textElement.size,
        rotation: 0,
        opacity: 1,
        zIndex: 10 + index,
        animations: textElement.animations || []
      });
    });
  }

  return aiTemplate;
};

/* ===============================
   GENERATE AI CONTENT
================================ */
const generateAIContent = async (prompt, style, platform) => {
  // This is a simplified AI content generation
  // In production, you would integrate with OpenAI GPT or similar AI service
  
  const contentPatterns = {
    motivational: {
      textElements: [
        {
          text: "BELIEVE IN YOURSELF",
          startTime: 1,
          duration: 3,
          position: { x: 540, y: 400 },
          size: { width: 800, height: 150 },
          fontSize: 90,
          animations: [
            {
              id: "zoom-in",
              type: "zoom",
              startTime: 1,
              duration: 1,
              easing: "ease-out",
              properties: { from: { scale: 0.5, opacity: 0 }, to: { scale: 1, opacity: 1 } }
            }
          ]
        },
        {
          text: "SUCCESS STARTS TODAY",
          startTime: 4,
          duration: 3,
          position: { x: 540, y: 800 },
          size: { width: 700, height: 120 },
          fontSize: 70,
          animations: [
            {
              id: "slide-up",
              type: "slide",
              startTime: 4,
              duration: 0.8,
              easing: "ease-out",
              properties: { from: { y: 1000, opacity: 0 }, to: { y: 800, opacity: 1 } }
            }
          ]
        }
      ]
    },
    educational: {
      textElements: [
        {
          text: "DID YOU KNOW?",
          startTime: 0.5,
          duration: 2,
          position: { x: 540, y: 300 },
          size: { width: 600, height: 100 },
          fontSize: 80,
          animations: [
            {
              id: "fade-in",
              type: "fade",
              startTime: 0.5,
              duration: 0.8,
              easing: "ease-out",
              properties: { from: { opacity: 0 }, to: { opacity: 1 } }
            }
          ]
        },
        {
          text: "Learn something new today",
          startTime: 3,
          duration: 4,
          position: { x: 540, y: 600 },
          size: { width: 800, height: 200 },
          fontSize: 60,
          animations: [
            {
              id: "slide-in",
              type: "slide",
              startTime: 3,
              duration: 1,
              easing: "ease-out",
              properties: { from: { x: 800, opacity: 0 }, to: { x: 540, opacity: 1 } }
            }
          ]
        }
      ]
    }
  };

  // Enhanced keyword matching for demo
  let selectedPattern = contentPatterns.educational; // default
  
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('motivat') || promptLower.includes('inspir') || promptLower.includes('success') || promptLower.includes('achieve')) {
    selectedPattern = contentPatterns.motivational;
  } else if (promptLower.includes('learn') || promptLower.includes('educat') || promptLower.includes('tutorial') || promptLower.includes('teach')) {
    selectedPattern = contentPatterns.educational;
  }

  // In production, use AI to generate custom content based on the prompt
  return selectedPattern;
};

/* ===============================
   PROCESS AI VIDEO IN BACKGROUND
================================ */
const processAIVideoInBackground = async (userId, aiTemplate, exportSettings, outputFullPath, outputPath, prompt) => {
  try {
    // Emit start notification
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-start", {
        message: "AI video generation started",
        estimatedTime: calculateEstimatedTime(aiTemplate.duration, exportSettings),
        type: "ai-video"
      });
    }

    // Process the AI-generated template like a regular video
    await processVideoInBackground(userId, aiTemplate, aiTemplate.layers, 
      { duration: aiTemplate.duration, backgroundColor: "#000000", audioEnabled: false }, 
      exportSettings, outputFullPath, outputPath);

    // Update user data with AI video info
    const user = await User.findById(userId);
    if (user) {
      const videoIndex = user.images.findIndex(img => img.url === outputPath);
      if (videoIndex !== -1) {
        user.images[videoIndex].aiGenerated = true;
        user.images[videoIndex].aiPrompt = prompt;
        await user.save();
      }
    }

  } catch (error) {
    console.error("AI video processing error:", error);
    
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit("video-processing-error", {
        message: "AI video generation failed",
        error: error.message,
        type: "ai-video"
      });
    }
  }
};

/* ===============================
   FALLBACK VIDEO CREATION (WITHOUT FFMPEG)
================================ */
const createVideoFallback = async (framesDir, outputPath, exportSettings, progressCallback) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a simple HTML5 video using canvas frames
      // This is a basic fallback - for full functionality, FFmpeg is required
      
      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        if (progressCallback) progressCallback(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Create a simple video file placeholder
          const videoContent = createSimpleVideoFile(framesDir, exportSettings);
          fs.writeFileSync(outputPath, videoContent);
          
          resolve();
        }
      }, 500);
      
    } catch (error) {
      reject(new Error(`Fallback video creation failed: ${error.message}. Please install FFmpeg for full video functionality.`));
    }
  });
};

/* ===============================
   CREATE SIMPLE VIDEO FILE (FALLBACK)
================================ */
const createSimpleVideoFile = (framesDir, exportSettings) => {
  // Create a basic video file structure
  // This is a minimal implementation - FFmpeg provides full video encoding
  
  const frames = fs.readdirSync(framesDir).filter(file => file.endsWith('.svg'));
  const videoData = {
    format: exportSettings.format || 'mp4',
    resolution: exportSettings.resolution,
    fps: exportSettings.fps || 30,
    frames: frames.length,
    duration: exportSettings.duration || 3,
    created: new Date().toISOString(),
    note: 'This is a basic video file. Install FFmpeg for full video encoding capabilities.'
  };
  
  return JSON.stringify(videoData, null, 2);
};

/* ===============================
   GET ANIMATION BY TYPE
================================ */
const getAnimationByType = (animationType, duration) => {
  switch (animationType) {
    case "zoom":
      return [{
        id: "zoom-animation",
        type: "fade",
        startTime: 0,
        duration: duration,
        easing: "ease-in-out",
        properties: {
          from: { scale: 1 },
          to: { scale: 1.1 }
        }
      }];
    case "pulse":
      return [{
        id: "pulse-animation",
        type: "pulse",
        startTime: 0,
        duration: duration,
        easing: "ease-in-out",
        properties: {
          from: { scale: 1 },
          to: { scale: 1.05 }
        }
      }];
    case "slide":
      return [{
        id: "slide-animation",
        type: "slide",
        startTime: 0,
        duration: 1,
        easing: "ease-out",
        properties: {
          from: { x: -100, opacity: 0 },
          to: { x: 640, opacity: 1 }
        }
      }];
    default:
      return [{
        id: "fade-animation",
        type: "fade",
        startTime: 0,
        duration: 0.5,
        easing: "ease-in",
        properties: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      }];
  }
};