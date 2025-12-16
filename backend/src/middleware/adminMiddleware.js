// Middleware to restrict routes to admin users only

export const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Refresh user to get latest role
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user._id || req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    req.user = user; // Update req.user with fresh data
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Error checking admin status" });
  }
};

