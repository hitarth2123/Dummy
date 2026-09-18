const router = require('express').Router();
const { strictRateLimiter } = require('../middleware/rateLimiter');
const catchAsync = require('../utils/catchAsync');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', strictRateLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/login
router.post('/login', strictRateLimiter, catchAsync(authController.login));

// POST /api/auth/logout
router.post('/logout', catchAsync(authController.logout));

// POST /api/auth/refresh
router.post('/refresh', strictRateLimiter, catchAsync(authController.refresh));
router.post('/email-unsubscribe', catchAsync(authController.unsubscribeEmail));

// POST /api/auth/forgot-password
router.post('/forgot-password', strictRateLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;
