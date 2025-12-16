import User from "../models/User.js";
import Template from "../models/Template.js";

// Get user's custom templates
export const getUserTemplates = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const templates = await Template.find({ 
      userId,
      isDeleted: { $ne: true }
    }).sort({ updatedAt: -1 });

    res.json({
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error("Get user templates error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get public templates
export const getPublicTemplates = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    
    const query = {
      isPublic: true,
      isDeleted: { $ne: true }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const templates = await Template.find(query)
      .populate('userId', 'email')
      .sort({ downloads: -1, rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Template.countDocuments(query);

    res.json({
      templates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: skip + templates.length < total
      }
    });
  } catch (error) {
    console.error("Get public templates error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Save custom template
export const saveTemplate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      name,
      description,
      category,
      difficulty,
      textConfig,
      backgroundEffects,
      decorativeElements,
      layers,
      isPublic = false,
      tags = []
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const template = new Template({
      userId,
      name,
      description,
      category,
      difficulty: difficulty || 'beginner',
      textConfig,
      backgroundEffects,
      decorativeElements,
      layers,
      isPublic,
      tags,
      rating: 0,
      downloads: 0,
      isCustom: true
    });

    await template.save();

    res.status(201).json({
      message: "Template saved successfully",
      template
    });
  } catch (error) {
    console.error("Save template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user._id || req.user.id;
    const updates = req.body;

    const template = await Template.findOne({
      _id: templateId,
      userId,
      isDeleted: { $ne: true }
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'category', 'difficulty', 'textConfig',
      'backgroundEffects', 'decorativeElements', 'layers', 'isPublic', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        template[field] = updates[field];
      }
    });

    template.updatedAt = new Date();
    await template.save();

    res.json({
      message: "Template updated successfully",
      template
    });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user._id || req.user.id;

    const template = await Template.findOne({
      _id: templateId,
      userId,
      isDeleted: { $ne: true }
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Soft delete
    template.isDeleted = true;
    template.deletedAt = new Date();
    await template.save();

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Duplicate template
export const duplicateTemplate = async (req, res) => {
  try {
    const { templateId, name } = req.body;
    const userId = req.user._id || req.user.id;

    const originalTemplate = await Template.findOne({
      _id: templateId,
      isDeleted: { $ne: true }
    });

    if (!originalTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Create duplicate
    const duplicateTemplate = new Template({
      userId,
      name: name || `${originalTemplate.name} - Copy`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      difficulty: originalTemplate.difficulty,
      textConfig: originalTemplate.textConfig,
      backgroundEffects: originalTemplate.backgroundEffects,
      decorativeElements: originalTemplate.decorativeElements,
      layers: originalTemplate.layers,
      tags: originalTemplate.tags,
      isPublic: false, // Duplicates are private by default
      isCustom: true,
      originalTemplateId: originalTemplate._id,
      rating: 0,
      downloads: 0
    });

    await duplicateTemplate.save();

    res.status(201).json({
      message: "Template duplicated successfully",
      template: duplicateTemplate
    });
  } catch (error) {
    console.error("Duplicate template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Rate template
export const rateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id || req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const template = await Template.findOne({
      _id: templateId,
      isPublic: true,
      isDeleted: { $ne: true }
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if user already rated this template
    const existingRatingIndex = template.ratings.findIndex(r => r.userId.toString() === userId.toString());
    
    if (existingRatingIndex >= 0) {
      // Update existing rating
      template.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      template.ratings.push({ userId, rating });
    }

    // Recalculate average rating
    const totalRating = template.ratings.reduce((sum, r) => sum + r.rating, 0);
    template.rating = totalRating / template.ratings.length;

    await template.save();

    res.json({
      message: "Rating submitted successfully",
      rating: template.rating
    });
  } catch (error) {
    console.error("Rate template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Download template (increment download count)
export const downloadTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findOne({
      _id: templateId,
      isDeleted: { $ne: true }
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Increment download count
    template.downloads += 1;
    await template.save();

    res.json({
      message: "Template downloaded",
      template
    });
  } catch (error) {
    console.error("Download template error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get template categories and stats
export const getTemplateStats = async (req, res) => {
  try {
    const stats = await Template.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalDownloads: { $sum: '$downloads' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalTemplates = await Template.countDocuments({ isDeleted: { $ne: true } });
    const publicTemplates = await Template.countDocuments({ isPublic: true, isDeleted: { $ne: true } });

    res.json({
      categories: stats,
      totals: {
        total: totalTemplates,
        public: publicTemplates,
        private: totalTemplates - publicTemplates
      }
    });
  } catch (error) {
    console.error("Get template stats error:", error);
    res.status(500).json({ message: error.message });
  }
};