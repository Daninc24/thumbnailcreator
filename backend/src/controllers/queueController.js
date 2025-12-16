// Queue control endpoints (pause, resume, cancel)

/**
 * Get queue status
 */
export const getQueueStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // For now, return simple status
    // In a full implementation, you'd query the queue manager
    res.json({ status: "idle", message: "Queue status endpoint" });
  } catch (err) {
    console.error("GET QUEUE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Pause queue
 */
export const pauseQueue = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const io = req.app.get("io");
    
    // Emit pause event to user
    if (io) {
      io.to(`user-${userId}`).emit("queue-paused", {
        message: "Queue paused"
      });
    }
    
    res.json({ message: "Queue pause requested" });
  } catch (err) {
    console.error("PAUSE QUEUE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Resume queue
 */
export const resumeQueue = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const io = req.app.get("io");
    
    // Emit resume event to user
    if (io) {
      io.to(`user-${userId}`).emit("queue-resumed", {
        message: "Queue resumed"
      });
    }
    
    res.json({ message: "Queue resume requested" });
  } catch (err) {
    console.error("RESUME QUEUE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cancel queue
 */
export const cancelQueue = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const io = req.app.get("io");
    
    // Emit cancel event to user
    if (io) {
      io.to(`user-${userId}`).emit("queue-cancelled", {
        message: "Queue cancelled"
      });
    }
    
    res.json({ message: "Queue cancel requested" });
  } catch (err) {
    console.error("CANCEL QUEUE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

