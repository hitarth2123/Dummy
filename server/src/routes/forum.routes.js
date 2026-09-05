const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope } = require('../middleware/deptScope.middleware');

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'), deptScope);

router.get('/',        (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.post('/',       (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.get('/:id',     (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.post('/:id/reply', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.put('/:id',     (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
router.delete('/:id',  (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
