const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const controller = require('../controllers/hallucination.controller');

router.use(protect);

// POST /api/hallucination/report
router.post('/report', controller.createReport);
// GET  /api/hallucination — admin/hod list
router.get('/',        restrictTo('hod', 'admin'), (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/hallucination/:id/review
router.put('/:id/review', restrictTo('hod', 'admin'), (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
