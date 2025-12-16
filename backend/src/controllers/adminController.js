import User from "../models/User.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    const usersWithStats = users.map(user => ({
      id: user._id,
      email: user.email,
      role: user.role || "user",
      subscription: {
        plan: user.subscription?.plan || "free",
        quota: user.subscription?.quota || 10,
        used: user.subscription?.used || 0,
        expiresAt: user.subscription?.expiresAt || null,
      },
      totalImages: user.images?.length || 0,
      createdAt: user.createdAt,
    }));

    res.json({ users: usersWithStats });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update user subscription plan (admin only)
export const updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!plan || !["free", "pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const PLAN_QUOTAS = { free: 10, pro: 100, premium: 500 };
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.subscription) {
      user.subscription = {};
    }

    user.subscription.plan = plan;
    user.subscription.quota = PLAN_QUOTAS[plan];
    if (plan !== "free") {
      user.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      user.subscription.expiresAt = null;
    }
    user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    res.json({
      message: `User plan updated to ${plan}`,
      user: {
        id: user._id,
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    console.error("Update user plan error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id?.toString() || userId === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Reset user quota (admin only)
export const resetUserQuota = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.subscription) {
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
    }

    res.json({
      message: "User quota reset successfully",
      user: {
        id: user._id,
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    console.error("Reset user quota error:", err);
    res.status(500).json({ message: err.message });
  }
};

