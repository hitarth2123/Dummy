const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { lockout }    = require('../middleware/lockout.middleware');
const { ethicsGuard } = require('../services/ethics.service');
const { distressGuard } = require('../services/safety.service');
const { requireAiFeature } = require('../middleware/aiAvailability.middleware');
const llmController = require('../controllers/llm.controller');

router.use(protect, restrictTo('student'), lockout, ethicsGuard);

// POST /api/llm/chat      — RAG-powered AI tutor chat
router.post('/chat', llmController.chatLegacy);
router.post('/tutor/chat', distressGuard, llmController.tutorChat);
router.post('/mcq/generate', requireAiFeature('practice_mcq'), llmController.generateMcq);
router.post('/question-bank/generate-sets', requireAiFeature('question_bank'), llmController.generateQuestionSets);
router.post('/mock-test/generate', requireAiFeature('mock_test'), llmController.generateMock);
router.post('/mock-test/:id/submit', llmController.submitMock);
router.post('/learning-path/generate', requireAiFeature('learning_path'), llmController.generateLearningPath);
router.post('/learning-path/topic/generate', requireAiFeature('learning_path'), llmController.generateLearningTopic);
// POST /api/llm/summarise — Summarise content
router.post('/summarise',(req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/llm/explain   — Explain a concept
router.post('/explain',  (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
