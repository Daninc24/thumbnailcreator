import express from 'express';
import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {},
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = { status: 'OK', message: 'Connected' };
    } else {
      health.services.mongodb = { status: 'ERROR', message: 'Disconnected' };
      health.status = 'ERROR';
    }
  } catch (error) {
    health.services.mongodb = { status: 'ERROR', message: error.message };
    health.status = 'ERROR';
  }

  // Check FFmpeg availability
  try {
    await execAsync('ffmpeg -version');
    health.services.ffmpeg = { status: 'OK', message: 'Available' };
  } catch (error) {
    health.services.ffmpeg = { status: 'ERROR', message: 'Not available' };
    health.status = 'WARNING'; // Not critical for basic functionality
  }

  // Check disk space (basic check)
  try {
    const stats = await import('fs').then(fs => fs.promises.stat('./'));
    health.services.storage = { status: 'OK', message: 'Accessible' };
  } catch (error) {
    health.services.storage = { status: 'ERROR', message: error.message };
    health.status = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : health.status === 'WARNING' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;