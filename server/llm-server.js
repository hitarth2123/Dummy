require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const { searchKnowledge } = require('./src/services/rag.service');
const { generateMcqSet } = require('./src/services/mcq.service');
const { chat } = require('./src/services/llm.service');
const { requestLogger } = require('./src/middleware/requestLogger');
const { logger } = require('./src/utils/logger');

const app = express();
const port = Number(process.env.LLM_SERVICE_PORT || 7031);

app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({
  success: true,
  service: 'llm-worker',
  port,
  mongo: mongoose.connection.readyState === 1,
}));

app.post('/v1/embed', async (req, res, next) => {
  try {
    const { embed } = require('./src/services/llm.service');
    const embedding = await embed(req.body.text);
    res.json({ success: true, data: { embedding, dimensions: embedding.length } });
  } catch (error) {
    next(error);
  }
});

app.post('/v1/mcq/generate', async (req, res, next) => {
  try {
    const result = await generateMcqSet(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/v1/tutor/chat', async (req, res, next) => {
  try {
    const prompt = req.body.message || req.body.prompt;
    const rag = await searchKnowledge(prompt, {
      department: req.body.department,
      subject: req.body.subject,
      topK: 5,
    });
    const response = await chat(prompt, {
      systemPrompt: 'Use only the supplied academic context. Cite sources by chunk ID. If context is insufficient, say so.',
      history: req.body.history || [],
      context: rag.context,
    });
    res.json({ success: true, data: { response, rag_sources: rag.rag_sources } });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  logger.error('llm_worker.failed', { error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  res.status(error.statusCode || 500).json({ success: false, message: error.message || 'LLM worker failed' });
});

const start = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    serverSelectionTimeoutMS: 5000,
  });
  app.listen(port, () => logger.info('llm_worker.started', { port, mongo: true }));
};

if (require.main === module) {
  start().catch((error) => {
    logger.error('llm_worker.startup_failed', { error: error.message });
    process.exit(1);
  });
}

module.exports = app;
