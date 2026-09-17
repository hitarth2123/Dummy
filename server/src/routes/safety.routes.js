const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope } = require('../middleware/deptScope.middleware');
const controller = require('../controllers/safety.controller');

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'));

router.get('/alerts', restrictTo('faculty', 'hod', 'admin'), deptScope, controller.listDistressAlerts);

// POST /api/safety/report — report a safety concern
router.post('/report',     (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/safety/check  — ethics content check
router.post('/check',      (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
