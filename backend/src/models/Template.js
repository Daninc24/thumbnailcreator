import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

const layerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["text", "shape", "image", "effect"], required: true },
  name: { type: String, required: true },
  visible: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  size: {
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 }
  },
  rotation: { type: Number, default: 0 },
  opacity: { type: Number, default: 1, min: 0, max: 1 },
  zIndex: { type: Number, default: 0 }
});

const textConfigSchema = new mongoose.Schema({
  fontSize: { type: Number, default: 72 },
  fontFamily: { type: String, default: "Arial" },
  fontWeight: { type: Number, default: 400 },
  color: { type: String, default: "#FFFFFF" },
  strokeColor: { type: String, default: "#000000" },
  strokeWidth: { type: Number, default: 0 },
  textShadow: { type: String, default: "" },
  position: { 
    type: String, 
    enum: ["top", "center", "bottom", "top-left", "top-right", "bottom-left", "bottom-right", "custom"],
    default: "center" 
  },
  alignment: { 
    type: String, 
    enum: ["left", "center", "right"],
    default: "center" 
  },
  padding: {
    x: { type: Number, default: 40 },
    y: { type: Number, default: 60 }
  },
  customPosition: {
    x: { type: Number },
    y: { type: Number }
  },
  textTransform: {
    type: String,
    enum: ["none", "uppercase", "lowercase", "capitalize"],
    default: "none"
  },
  letterSpacing: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 }
}, { _id: false });

const backgroundEffectsSchema = new mongoose.Schema({
  overlay: {
    type: {
      type: String,
      enum: ["none", "solid", "gradient"],
      default: "none"
    },
    color1: { type: String, default: "#000000" },
    color2: { type: String, default: "#FFFFFF" },
    opacity: { type: Number, default: 0.5, min: 0, max: 1 },
    direction: {
      type: String,
      enum: ["horizontal", "vertical", "diagonal", "radial"],
      default: "vertical"
    }
  },
  brightness: {
    enabled: { type: Boolean, default: false },
    value: { type: Number, default: 0, min: -100, max: 100 }
  },
  contrast: {
    enabled: { type: Boolean, default: false },
    value: { type: Number, default: 0, min: -100, max: 100 }
  },
  saturation: {
    enabled: { type: Boolean, default: false },
    value: { type: Number, default: 0, min: -100, max: 100 }
  },
  blur: {
    enabled: { type: Boolean, default: false },
    intensity: { type: Number, default: 0, min: 0, max: 20 }
  }
}, { _id: false });

const decorativeElementsSchema = new mongoose.Schema({
  shapes: [{
    type: {
      type: String,
      enum: ["circle", "rectangle", "triangle", "star", "diamond"],
      default: "circle"
    },
    color: { type: String, default: "#FFFFFF" },
    borderColor: { type: String },
    borderWidth: { type: Number, default: 0 },
    size: { type: Number, default: 40 },
    opacity: { type: Number, default: 1, min: 0, max: 1 },
    rotation: { type: Number, default: 0 },
    position: { type: String, default: "top-right" }
  }],
  badges: [{
    text: { type: String, required: true },
    color: { type: String, default: "#FFFFFF" },
    backgroundColor: { type: String, default: "#FF0000" },
    fontSize: { type: Number, default: 12 },
    padding: { type: Number, default: 8 },
    borderRadius: { type: Number, default: 4 },
    opacity: { type: Number, default: 1, min: 0, max: 1 },
    position: { type: String, default: "top-left" }
  }],
  borders: {
    enabled: { type: Boolean, default: false },
    color: { type: String, default: "#FFFFFF" },
    width: { type: Number, default: 2 },
    style: {
      type: String,
      enum: ["solid", "dashed", "dotted", "double"],
      default: "solid"
    },
    radius: { type: Number, default: 0 },
    opacity: { type: Number, default: 1, min: 0, max: 1 }
  }
}, { _id: false });

const templateSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 500
  },
  category: { 
    type: String, 
    required: true,
    enum: ["gaming", "vlog", "education", "business", "entertainment", "tech", "fitness", "food", "custom"],
    lowercase: true
  },
  difficulty: { 
    type: String, 
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  
  // Template Configuration
  textConfig: textConfigSchema,
  backgroundEffects: backgroundEffectsSchema,
  decorativeElements: decorativeElementsSchema,
  
  // Advanced Editor Layers (for advanced templates)
  layers: [layerSchema],
  
  // Template Metadata
  tags: [{ type: String, trim: true, lowercase: true }],
  isPublic: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: true },
  originalTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  
  // Analytics
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratings: [ratingSchema],
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
templateSchema.index({ userId: 1, isDeleted: 1 });
templateSchema.index({ isPublic: 1, isDeleted: 1 });
templateSchema.index({ category: 1, isPublic: 1, isDeleted: 1 });
templateSchema.index({ downloads: -1, rating: -1 });
templateSchema.index({ tags: 1 });

// Update the updatedAt field before saving
templateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for average rating calculation
templateSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  return sum / this.ratings.length;
});

// Ensure virtual fields are serialized
templateSchema.set('toJSON', { virtuals: true });

export default mongoose.model("Template", templateSchema);