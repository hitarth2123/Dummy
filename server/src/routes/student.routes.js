const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');
const { lockout }    = require('../middleware/lockout.middleware');
const controller = require('../controllers/student.controller');

// All student routes require authentication + student role
router.use(protect, restrictTo('student'), lockout, deptScope);

// GET  /api/student/dashboard
router.get('/dashboard', controller.dashboard);

// GET  /api/student/subjects — available subjects list
router.get('/subjects', controller.getSubjects);

// GET  /api/student/learning-path
router.get('/learning-path', controller.learningPath);

// GET  /api/student/question-bank
router.get('/question-bank', controller.questionBank);

// POST /api/student/question-bank/:id/bookmark — toggle bookmark
router.post('/question-bank/:id/bookmark', controller.toggleBookmark);

// GET  /api/student/mock-tests — history of completed mock tests
router.get('/mock-tests', controller.mockTestHistory);

// GET  /api/student/mock-test/:id/results
router.get('/mock-test/:id/results', controller.mockTestResults);

// POST /api/student/sessions/book
router.post('/sessions/book', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// GET  /api/student/sessions
router.get('/sessions', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// GET  /api/student/emergency
router.get('/emergency', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
