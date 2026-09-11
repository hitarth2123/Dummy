const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope } = require('../middleware/deptScope.middleware');
const { restrictTo: staffOnly } = require('../middleware/rbac.middleware');
const controller = require('../controllers/forum.controller');

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'), deptScope);

router.get(['/','/posts'], controller.list);
router.post(['/','/posts'], controller.create);
router.get(['/posts/:id','/:id'], controller.get);
router.post(['/:id/reply','/posts/:id/reply'], controller.reply);
router.post(['/posts/:id/flag-grievance','/:id/flag-grievance'], controller.flagGrievance);
router.delete(['/posts/:id','/:id'], staffOnly('faculty', 'hod'), controller.remove);

module.exports = router;
