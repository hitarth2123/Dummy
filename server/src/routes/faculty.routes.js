const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');

router.use(protect, restrictTo('faculty'), deptScope);

// GET  /api/faculty/dashboard
router.get('/dashboard',          (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/faculty/availability
router.get('/availability',       (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/faculty/availability
router.put('/availability',       (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/faculty/session-requests
router.get('/session-requests',   (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/faculty/session-requests/:id
router.put('/session-requests/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/faculty/sessions
router.get('/sessions',           (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
