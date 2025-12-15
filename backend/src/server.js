import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
connectDB();

// ensure uploads dir exists for multer
import fs from "fs";
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// Setup Socket.IO after server is created
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Set io instance for use in controllers
import { setIO } from "./controllers/imageController.js";
setIO(io);

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
