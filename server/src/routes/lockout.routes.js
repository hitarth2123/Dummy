const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');

// GET  /api/lockout/status — check lockout status for current user
router.get('/status',   protect, (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/lockout/trigger — admin/system trigger lockout
router.post('/trigger', protect, restrictTo('admin'), (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/lockout/release — admin release lockout
router.post('/release', protect, restrictTo('admin'), (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
