const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const controller = require('../controllers/feedback.controller');

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'));

router.post('/', restrictTo('student'), controller.submit);
router.get('/', restrictTo('hod', 'admin'), controller.list);
router.get('/export', restrictTo('hod', 'admin'), controller.exportCsv);
router.get('/week/:week', restrictTo('hod', 'admin'), controller.list);

module.exports = router;
