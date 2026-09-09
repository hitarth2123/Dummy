const catchAsync = require('../utils/catchAsync');
const { searchKnowledge } = require('../services/rag.service');
const { generateMcqSet } = require('../services/mcq.service');
const { chat } = require('../services/llm.service');
const { logAction } = require('../services/audit.service');
const { requestLlmWorker, workerEnabled } = require('../services/llmGateway.service');
const { generateMockTest, submitMockTest, upsertLearningPath } = require('../services/mockTest.service');
const LearningPath = require('../models/LearningPath');
const User = require('../models/User');

const getUserOptions = (req) => ({
  department: req.user?.dept || req.user?.department,
  subject: req.body?.subject,
});

const generateMcq = catchAsync(async (req, res) => {
  const { topic, count, subject } = req.body;
  const payload = { topic, count, subject, ...getUserOptions(req) };
  const result = workerEnabled()
    ? await requestLlmWorker('/v1/mcq/generate', payload)
    : await generateMcqSet(payload);
  res.json({ success: true, data: result });
});

const tutorChatHandler = async (req, res) => {
  const prompt = req.body?.message || req.body?.prompt;
  const userOptions = getUserOptions(req);
  const workerResult = workerEnabled()
    ? await requestLlmWorker('/v1/tutor/chat', {
      message: prompt,
      history: req.body?.history || [],
      ...userOptions,
    })
    : null;
  const rag = workerResult ? { chunkIds: workerResult.rag_sources.map((source) => source.chunk_id), rag_sources: workerResult.rag_sources } : await searchKnowledge(prompt, { ...userOptions, topK: 5 });
  const response = workerResult?.response || await chat(prompt, {
    systemPrompt: 'Use only the supplied academic context. Cite the sources by chunk ID. If context is insufficient, say so.',
    history: req.body?.history || [],
    context: rag.context,
  });

  await logAction({
    actor: req.user?.id || req.user?._id,
    actor_role: req.user?.role || 'student',
    action: 'tutor_response',
    resource_type: 'llm',
    department: req.user?.dept || req.user?.department,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    metadata: { rag_sources: rag.chunkIds, prompt_length: prompt?.length || 0 },
  });

  const payload = { response, rag_sources: rag.rag_sources };
  if (req.body?.stream === false || typeof res.write !== 'function') {
    return res.json({ success: true, data: payload });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const parts = String(response).match(/.{1,80}/g) || [''];
  for (const part of parts) res.write(`data: ${JSON.stringify({ delta: part })}\n\n`);
  res.write(`data: ${JSON.stringify({ rag_sources: rag.rag_sources, done: true })}\n\n`);
  return res.end();
};

const tutorChat = catchAsync(tutorChatHandler);

const chatLegacy = catchAsync(async (req, res) => {
  req.body = { ...req.body, stream: false };
  return tutorChatHandler(req, res);
});

const generateMock = catchAsync(async (req, res) => {
  const result = await generateMockTest({ user: req.user, subject: req.body.subject, setName: req.body.set_name, count: req.body.count, durationMinutes: req.body.duration_minutes });
  res.status(201).json({ success: true, data: result });
});

const submitMock = catchAsync(async (req, res) => {
  const result = await submitMockTest({ user: req.user, testId: req.params.id, answers: req.body.answers, timeTakenSec: req.body.time_taken_sec });
  if (!result) return res.status(404).json({ success: false, message: 'Mock test not found or already submitted.' });
  return res.json({ success: true, data: result });
});

const generateLearningPath = catchAsync(async (req, res) => {
  const isManual = req.body.manual_refresh === true;
  const targetSubject = req.body.subject;

  // Rate-limit: max 1 manual refresh per 24 hours UNLESS a subject parameter is passed
  if (isManual && !targetSubject) {
    const user = await User.findById(req.user.id).select('last_learning_path_refresh').lean();
    if (user?.last_learning_path_refresh) {
      const hoursSince = (Date.now() - new Date(user.last_learning_path_refresh).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        return res.status(429).json({ success: false, message: `You can refresh your learning path again in ${hoursLeft} hour(s).` });
      }
    }
  }

  const persona = { ...req.user, ...req.body, id: req.user.id, dept: req.user.dept || req.user.department, subject: targetSubject };
  const path = await upsertLearningPath({ user: persona, mockScores: req.body.mock_scores || [] });

  if (isManual && !targetSubject) {
    await User.findByIdAndUpdate(req.user.id, { last_learning_path_refresh: new Date() });
  }

  res.json({ success: true, data: path });
});

module.exports = { generateMcq, tutorChat, chatLegacy, generateMock, submitMock, generateLearningPath };