import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hash,
      subscription: {
        plan: "free",
        quota: 10,
        used: 0,
        resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    res.status(201).json({ message: "User created", user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "devsecret");
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({ message: "Logged in", token }); // Return token in response
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if quota needs to be reset
    const now = new Date();
    if (user.subscription && user.subscription.resetAt && now > user.subscription.resetAt) {
      // Reset quota
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days
      await user.save();
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        totalImages: user.images?.length || 0
      }
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getQuotaStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if quota needs to be reset
    const now = new Date();
    if (user.subscription && user.subscription.resetAt && now > user.subscription.resetAt) {
      // Reset quota
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days
      await user.save();
    }

    const subscription = user.subscription || { plan: "free", quota: 10, used: 0 };
    const quotaUsed = subscription.used || 0;
    const quotaLimit = subscription.quota || 10;
    const quotaRemaining = Math.max(0, quotaLimit - quotaUsed);
    const quotaPercentage = quotaLimit > 0 ? Math.round((quotaUsed / quotaLimit) * 100) : 0;

    res.json({
      plan: subscription.plan,
      quota: {
        used: quotaUsed,
        limit: quotaLimit,
        remaining: quotaRemaining,
        percentage: quotaPercentage
      },
      resetAt: subscription.resetAt,
      expiresAt: subscription.expiresAt,
      isAdmin: user.role === "admin"
    });
  } catch (err) {
    console.error("Get quota status error:", err);
    res.status(500).json({ message: err.message });
  }
};
