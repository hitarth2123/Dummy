const rateLimit = require('express-rate-limit');

/**
 * rateLimiter — global API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * strictRateLimiter — tighter limit for auth endpoints.
 * 10 requests per 15 minutes per IP.
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

module.exports = { rateLimiter, strictRateLimiter };
