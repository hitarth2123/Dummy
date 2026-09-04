const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// POST /api/hallucination/report
router.post('/report', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// GET  /api/hallucination — admin/hod list
router.get('/',        (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// PUT  /api/hallucination/:id/review
router.put('/:id/review', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
