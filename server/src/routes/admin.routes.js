const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');

router.use(protect, restrictTo('admin'));

// GET  /api/admin/dashboard
router.get('/dashboard',          (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/admin/users
router.get('/users',              (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/admin/users
router.post('/users',             (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/admin/users/:id
router.put('/users/:id',          (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// DELETE /api/admin/users/:id
router.delete('/users/:id',       (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/admin/timetable
router.get('/timetable',          (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/admin/timetable
router.post('/timetable',         (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/admin/emergency-contacts
router.get('/emergency-contacts', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/admin/emergency-contacts
router.post('/emergency-contacts',(req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/admin/feedback
router.get('/feedback',           (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
