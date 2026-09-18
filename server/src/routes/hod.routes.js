const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');
const controller = require('../controllers/hod.controller');

router.use(protect, restrictTo('hod'), deptScope);

// GET  /api/hod/dashboard
router.get('/dashboard',    controller.dashboard);
// GET  /api/hod/audit-log
router.get('/audit-log', controller.auditLog);
// GET  /api/hod/ethics-config
router.get('/ethics-config', controller.getEthicsConfig);
// PUT  /api/hod/ethics-config
router.put('/ethics-config', controller.updateEthicsConfig);
router.put('/audit-log/:id/actions', controller.auditAction);
// GET  /api/hod/faculty
router.get('/faculty', controller.faculty);
router.get('/profile-change-requests', controller.profileChangeRequests);
router.post('/profile-change-requests', controller.createProfileChangeRequest);
router.patch('/profile-change-requests/:id', controller.reviewProfileChangeRequest);

module.exports = router;
