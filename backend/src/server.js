import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();
connectDB();

// ensure uploads dir exists for multer
import fs from "fs";
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow specific origins in production
    const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/videos", videoRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// Setup Socket.IO after server is created
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow any localhost port for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});

// Attach io to app so controllers can access it via req.app.get("io")
app.set("io", io);

// Make io globally available for payment controllers
global.io = io;

// Set io instance for use in controllers (backward compatibility)
import { setIO } from "./controllers/imageController.js";
import { setVideoIO } from "./controllers/videoController.js";
setIO(io);
setVideoIO(io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Join user to their own room based on user ID (requires authentication)
  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
