const router = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { lockout }    = require('../middleware/lockout.middleware');

router.use(protect, restrictTo('student'), lockout);

// POST /api/llm/chat      — RAG-powered AI tutor chat
router.post('/chat',     (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/llm/summarise — Summarise content
router.post('/summarise',(req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
// POST /api/llm/explain   — Explain a concept
router.post('/explain',  (req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

module.exports = router;
