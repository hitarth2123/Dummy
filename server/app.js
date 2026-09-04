const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { env } = require('./src/config/env');
const { rateLimiter } = require('./src/middleware/rateLimiter');

// ── Route imports ────────────────────────────────────────────────────────────
const authRoutes          = require('./src/routes/auth.routes');
const studentRoutes       = require('./src/routes/student.routes');
const facultyRoutes       = require('./src/routes/faculty.routes');
const hodRoutes           = require('./src/routes/hod.routes');
const adminRoutes         = require('./src/routes/admin.routes');
const forumRoutes         = require('./src/routes/forum.routes');
const feedbackRoutes      = require('./src/routes/feedback.routes');
const llmRoutes           = require('./src/routes/llm.routes');
const safetyRoutes        = require('./src/routes/safety.routes');
const lockoutRoutes       = require('./src/routes/lockout.routes');
const hallucinationRoutes = require('./src/routes/hallucination.routes');

const app = express();

// ── Security & Performance ───────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body & Cookie Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', rateLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/student',       studentRoutes);
app.use('/api/faculty',       facultyRoutes);
app.use('/api/hod',           hodRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/forum',         forumRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/llm',           llmRoutes);
app.use('/api/safety',        safetyRoutes);
app.use('/api/lockout',       lockoutRoutes);
app.use('/api/hallucination', hallucinationRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
