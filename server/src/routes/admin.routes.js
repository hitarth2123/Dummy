const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const controller = require('../controllers/admin.controller');

router.use(protect, restrictTo('admin'));

// GET  /api/admin/dashboard
router.get('/dashboard',          controller.getDashboard);
router.get('/student-activity',   controller.getStudentActivity);
router.get('/audit-log',           controller.getAuditLog);
router.get('/ai-availability',    controller.getAiAvailability);
router.put('/ai-availability',    controller.updateAiAvailability);
// GET  /api/admin/users
router.get('/users',              controller.getUsers);
// POST /api/admin/users
router.post('/users',             controller.createUser);
// PUT  /api/admin/users/:id
router.put('/users/:id',          controller.updateUser);
// DELETE /api/admin/users/:id
router.delete('/users/:id',       controller.deactivateUser);
// GET  /api/admin/timetable
router.get('/timetable',          controller.getTimetable);
// POST /api/admin/timetable
router.post('/timetable/upload',  controller.uploadTimetable);
router.post('/timetable/unlock/:student_id/:subject', controller.unlockTimetable);
// GET  /api/admin/emergency-contacts
router.get('/emergency-contacts', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/admin/emergency-contacts
router.post('/emergency-contacts',(req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/admin/feedback
router.get('/feedback',           (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
