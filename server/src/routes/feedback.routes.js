const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'));

router.get('/',         (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.post('/',        (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.get('/week/:week', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
