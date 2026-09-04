const router = require('express').Router();
const { strictRateLimiter } = require('../middleware/rateLimiter');

// Controllers (to be implemented in EPIC-03)
// const authController = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', strictRateLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/login
router.post('/login', strictRateLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', strictRateLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;
