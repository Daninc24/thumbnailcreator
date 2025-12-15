import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes middleware
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    console.error("No token found in request headers");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    console.log("Verifying token:", token); // log token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
