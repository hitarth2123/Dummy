const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');
const controller = require('../controllers/faculty.controller');

router.use(protect, restrictTo('faculty'), deptScope);

// GET  /api/faculty/dashboard
router.get('/dashboard',          controller.dashboard);
// GET  /api/faculty/availability
router.get('/availability',       controller.getAvailability);
// PUT  /api/faculty/availability
router.put('/availability',       controller.updateAvailability);
// GET  /api/faculty/session-requests
router.get('/session-requests',   controller.sessionRequests);
// PUT  /api/faculty/session-requests/:id
router.put('/session-requests/:id', controller.updateSession);
router.post('/doubt-session/:id/confirm', controller.confirmSession);
router.post('/doubt-session/:id/decline', controller.declineSession);
// GET  /api/faculty/sessions
router.get('/sessions',           controller.facultySessions);

module.exports = router;
