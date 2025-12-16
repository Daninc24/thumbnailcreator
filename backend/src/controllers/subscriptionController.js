import User from "../models/User.js";

// Subscription plan quotas
const PLAN_QUOTAS = {
  free: 10,
  pro: 100,
  premium: 500,
};

// Get current subscription info
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const subscription = user.subscription || {
      plan: "free",
      quota: PLAN_QUOTAS.free,
      used: 0,
    };

    res.json({
      subscription: {
        plan: subscription.plan || "free",
        quota: subscription.quota || PLAN_QUOTAS.free,
        used: subscription.used || 0,
        expiresAt: subscription.expiresAt || null,
        resetAt: subscription.resetAt || null,
        remaining: (subscription.quota || PLAN_QUOTAS.free) - (subscription.used || 0),
      },
    });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Subscribe to a plan (placeholder for payment integration)
export const subscribeUser = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id || req.user.id;

    if (!plan || !["free", "pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan. Must be free, pro, or premium" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Set subscription plan and quota
    if (!user.subscription) {
      user.subscription = {};
    }

    user.subscription.plan = plan;
    user.subscription.quota = PLAN_QUOTAS[plan];
    
    // Reset usage when upgrading
    if (plan !== "free") {
      user.subscription.used = 0;
      user.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Next month
    } else {
      // Free plan - reset to free quota
      user.subscription.used = 0;
      user.subscription.expiresAt = null;
      user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await user.save();

    res.json({
      message: `Successfully subscribed to ${plan} plan`,
      subscription: {
        plan: user.subscription.plan,
        quota: user.subscription.quota,
        used: user.subscription.used,
        expiresAt: user.subscription.expiresAt,
      },
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Reset quota (for testing or admin use)
export const resetQuota = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.subscription) {
      user.subscription = {
        plan: "free",
        quota: PLAN_QUOTAS.free,
        used: 0,
      };
    } else {
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await user.save();

    res.json({
      message: "Quota reset successfully",
      subscription: user.subscription,
    });
  } catch (err) {
    console.error("Reset quota error:", err);
    res.status(500).json({ message: err.message });
  }
};

