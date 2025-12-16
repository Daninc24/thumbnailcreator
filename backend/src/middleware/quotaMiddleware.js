// Middleware to check user quota before operations

export const checkQuota = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Admins have unlimited quota
    if (user.role === "admin") {
      return next();
    }

    const subscription = user.subscription || {};
    const plan = subscription.plan || "free";
    
    // Check if subscription expired
    if (subscription.expiresAt && new Date() > new Date(subscription.expiresAt)) {
      return res.status(403).json({ 
        message: "Subscription expired. Please renew your subscription." 
      });
    }

    // Reset quota if reset date has passed
    if (subscription.resetAt && new Date() > new Date(subscription.resetAt)) {
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Next month
      await user.save();
    }

    const used = subscription.used || 0;
    const quota = subscription.quota || 10;

    if (plan === "free" && used >= quota) {
      return res.status(403).json({ 
        message: `Monthly quota exceeded (${used}/${quota}). Upgrade to continue.`,
        quota: { used, limit: quota, plan }
      });
    }

    // For pro and premium, check quota (can be higher limits)
    if (used >= quota) {
      return res.status(403).json({ 
        message: `Monthly quota exceeded (${used}/${quota}). Please upgrade or wait for quota reset.`,
        quota: { used, limit: quota, plan }
      });
    }

    next();
  } catch (err) {
    console.error("Quota check error:", err);
    res.status(500).json({ message: "Error checking quota" });
  }
};

// Increment quota usage
export const incrementQuota = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Don't increment for admins
    if (user.role === "admin") {
      return next();
    }

    // Refresh user to get latest data
    const User = (await import("../models/User.js")).default;
    const updatedUser = await User.findById(user._id || user.id);
    
    if (updatedUser && updatedUser.subscription) {
      updatedUser.subscription.used = (updatedUser.subscription.used || 0) + 1;
      await updatedUser.save();
    }

    next();
  } catch (err) {
    console.error("Increment quota error:", err);
    // Don't fail the request if quota increment fails
    next();
  }
};

