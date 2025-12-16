import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes middleware
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);
    
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error("JWT verification failed:", err.message);
    }
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Alternative middleware that just sets user ID (lighter version)
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error("JWT verification failed:", err.message);
    }
    res.status(401).json({ message: "Invalid token" });
  }
};
