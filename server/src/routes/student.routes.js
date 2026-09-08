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

// GET  /api/student/learning-path
router.get('/learning-path', controller.learningPath);

// GET  /api/student/question-bank
router.get('/question-bank', controller.questionBank);

// POST /api/student/mock-test/start
router.post('/mock-test/start', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// POST /api/student/mock-test/:id/submit
router.post('/mock-test/:id/submit', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// GET  /api/student/mock-test/:id/results
router.get('/mock-test/:id/results', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// POST /api/student/sessions/book
router.post('/sessions/book', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// GET  /api/student/sessions
router.get('/sessions', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

// GET  /api/student/emergency
router.get('/emergency', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
