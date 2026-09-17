const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope } = require('../middleware/deptScope.middleware');
const { restrictTo: staffOnly } = require('../middleware/rbac.middleware');
const controller = require('../controllers/forum.controller');
const { requireAiFeature } = require('../middleware/aiAvailability.middleware');
const privateFeature = (req, res, next) => (req.body?.visibility === 'private' || req.query?.visibility === 'private' || req.query?.mine === 'true' ? requireAiFeature('private_forum')(req, res, next) : next());

router.use(protect, restrictTo('student', 'faculty', 'hod', 'admin'), deptScope);

router.get(['/','/posts'], privateFeature, controller.list);
router.post(['/','/posts'], privateFeature, controller.create);
router.get(['/posts/:id','/:id'], controller.get);
router.post(['/:id/reply','/posts/:id/reply'], controller.reply);
router.post(['/posts/:id/flag-grievance','/:id/flag-grievance'], controller.flagGrievance);
router.delete(['/posts/:id','/:id'], staffOnly('faculty', 'hod'), controller.remove);

module.exports = router;
