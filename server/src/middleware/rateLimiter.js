const rateLimit = require('express-rate-limit');

let restartScheduled = false;

const restartAfterRateLimit = (req, res, next, options) => {
  const message = options.message?.message;
  const statusCode = options.statusCode || 429;

  if (message === 'Too many requests. Please try again later.' && process.env.NODE_ENV !== 'test' && !restartScheduled) {
    restartScheduled = true;
    console.error('[Server] Global rate limit reached. Restarting server.');
    setTimeout(() => process.exit(1), 250);
  }

  res.status(statusCode).json(options.message);
};

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
  handler: restartAfterRateLimit,
});

/**
 * strictRateLimiter — tighter limit for auth endpoints.
 * 10 requests per 15 minutes per IP.
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

module.exports = { rateLimiter, strictRateLimiter };
