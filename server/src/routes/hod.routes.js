const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');
const controller = require('../controllers/hod.controller');

router.use(protect, restrictTo('hod'), deptScope);

// GET  /api/hod/dashboard
router.get('/dashboard',    (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/hod/audit-log
router.get('/audit-log', controller.auditLog);
// GET  /api/hod/ethics-config
router.get('/ethics-config', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/hod/ethics-config
router.put('/ethics-config', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/hod/faculty
router.get('/faculty', controller.faculty);

module.exports = router;
