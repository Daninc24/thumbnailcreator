import User from "../models/User.js";

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const images = user.images || [];
    const totalImages = images.filter(img => img.type === "original").length;
    const bgRemoved = images.filter(img => img.type === "bg_removed" || img.processed).length;
    const thumbnails = images.filter(img => img.type === "thumbnail" || img.thumbnail).length;
    const pending = totalImages - bgRemoved;

    // Get last upload
    const originalImages = images.filter(img => img.type === "original");
    const lastUpload = originalImages.length > 0 
      ? originalImages[originalImages.length - 1]?.createdAt || null
      : null;

    // Calculate daily statistics for last 30 days
    const dailyStats = calculateDailyStats(images, 30);

    // Calculate weekly statistics for last 12 weeks
    const weeklyStats = calculateWeeklyStats(images, 12);

    const analytics = {
      totalImages,
      bgRemoved,
      thumbnails,
      pending,
      lastUpload,
      dailyStats,
      weeklyStats,
      totalProcessed: bgRemoved + thumbnails,
    };

    res.json({ analytics });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Helper function to calculate daily statistics
function calculateDailyStats(images, days) {
  const stats = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayImages = images.filter(img => {
      const imgDate = new Date(img.createdAt);
      return imgDate >= date && imgDate < nextDate;
    });
    
    stats.push({
      date: date.toISOString().split('T')[0],
      uploaded: dayImages.filter(img => img.type === "original").length,
      bgRemoved: dayImages.filter(img => img.type === "bg_removed" || img.processed).length,
      thumbnails: dayImages.filter(img => img.type === "thumbnail" || img.thumbnail).length,
    });
  }
  
  return stats;
}

// Helper function to calculate weekly statistics
function calculateWeeklyStats(images, weeks) {
  const stats = [];
  const today = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekImages = images.filter(img => {
      const imgDate = new Date(img.createdAt);
      return imgDate >= weekStart && imgDate < weekEnd;
    });
    
    stats.push({
      week: `Week ${weeks - i}`,
      date: weekStart.toISOString().split('T')[0],
      uploaded: weekImages.filter(img => img.type === "original").length,
      bgRemoved: weekImages.filter(img => img.type === "bg_removed" || img.processed).length,
      thumbnails: weekImages.filter(img => img.type === "thumbnail" || img.thumbnail).length,
    });
  }
  
  return stats;
}

// Export report as CSV
export const exportReport = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const images = user.images || [];
    
    // Format images for CSV
    const csvData = images.map(img => ({
      url: img.url,
      type: img.type || "original",
      processed: img.processed ? "Yes" : "No",
      thumbnail: img.thumbnail ? "Yes" : "No",
      style: img.style || "N/A",
      createdAt: img.createdAt ? new Date(img.createdAt).toISOString() : "N/A",
      bgRemovedAt: img.bgRemovedAt ? new Date(img.bgRemovedAt).toISOString() : "N/A",
      thumbnailGeneratedAt: img.thumbnailGeneratedAt ? new Date(img.thumbnailGeneratedAt).toISOString() : "N/A",
    }));

    // Simple CSV generation
    const headers = ["url", "type", "processed", "thumbnail", "style", "createdAt", "bgRemovedAt", "thumbnailGeneratedAt"];
    const csvRows = [
      headers.join(","),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ];

    const csv = csvRows.join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`image-report-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: err.message });
  }
};

