const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',         (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.post('/',        (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.get('/week/:week', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
