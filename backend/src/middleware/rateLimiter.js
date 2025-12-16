import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development environment
    return process.env.NODE_ENV === 'development';
  },
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // Higher limit for development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development environment
    return process.env.NODE_ENV === 'development';
  },
});

// Rate limiting for image/video processing
export const processingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 processing requests per minute
  message: {
    error: 'Too many processing requests, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment attempts per hour
  message: {
    error: 'Too many payment attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 uploads per minute
  message: {
    error: 'Too many upload requests, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for intensive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 intensive operations per minute
  message: {
    error: 'Too many intensive operations, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});