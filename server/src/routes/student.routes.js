const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { deptScope }  = require('../middleware/deptScope.middleware');
const { lockout }    = require('../middleware/lockout.middleware');
const { requireAiFeature } = require('../middleware/aiAvailability.middleware');
const controller = require('../controllers/student.controller');

// All student routes require authentication + student role
router.use(protect, restrictTo('student'), deptScope);
router.use('/practice', lockout);

// GET  /api/student/dashboard
router.get('/dashboard', controller.dashboard);
router.get('/profile', controller.getProfile);
router.get('/profile-change-requests', controller.profileChangeRequests);
router.post('/profile-change-requests', controller.createProfileChangeRequest);

// GET  /api/student/subjects — available subjects list
router.get('/subjects', controller.getSubjects);
router.get('/curriculum', controller.getCurriculum);

// Faculty discovery and doubt-session booking
router.get('/faculty', controller.listFaculty);
router.post('/sessions/book', requireAiFeature('booking_session'), controller.bookSession);
router.get('/sessions', controller.studentSessions);
router.post('/doubt-session', requireAiFeature('booking_session'), controller.bookSession);
router.get('/doubt-session/my', controller.studentSessions);

// GET  /api/student/learning-path
router.get('/learning-path', requireAiFeature('learning_path'), controller.learningPath);

// PATCH /api/student/learning-path/topic — mark one topic as completed
router.patch('/learning-path/topic', controller.completeLearningPathTopic);

// GET  /api/student/question-bank/sets — available question sets per subject
router.get('/question-bank/sets', requireAiFeature('question_bank'), controller.getQuestionSets);

// GET  /api/student/question-bank
router.get('/question-bank', requireAiFeature('question_bank'), controller.questionBank);

// POST /api/student/question-bank/:id/bookmark — toggle bookmark
router.post('/question-bank/:id/bookmark', requireAiFeature('question_bank'), controller.toggleBookmark);

// GET  /api/student/mock-tests — history of completed mock tests
router.get('/mock-tests', lockout, controller.mockTestHistory);
router.get('/practice-attempts', lockout, requireAiFeature('practice_mcq'), controller.practiceAttemptHistory);
router.post('/practice-attempts', lockout, requireAiFeature('practice_mcq'), controller.savePracticeAttempt);

// GET  /api/student/mock-test/:id/results
router.get('/mock-test/:id/results', lockout, controller.mockTestResults);

// POST /api/student/sessions/book
// GET  /api/student/emergency
router.get('/emergency', (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
