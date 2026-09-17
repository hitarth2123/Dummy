const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const controller = require('../controllers/admin.controller');

router.get('/', protect, controller.getAiAvailability);
router.put('/', protect, restrictTo('admin', 'hod'), controller.updateAiAvailability);

module.exports = router;
