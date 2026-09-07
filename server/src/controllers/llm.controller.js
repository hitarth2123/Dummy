const catchAsync = require('../utils/catchAsync');
const { searchKnowledge } = require('../services/rag.service');
const { generateMcqSet } = require('../services/mcq.service');
const { chat } = require('../services/llm.service');
const { logAction } = require('../services/audit.service');

const getUserOptions = (req) => ({
  department: req.user?.dept || req.user?.department,
  subject: req.body?.subject,
});

const generateMcq = catchAsync(async (req, res) => {
  const { topic, count, subject } = req.body;
  const result = await generateMcqSet({ topic, count, subject, ...getUserOptions(req) });
  res.json({ success: true, data: result });
});

const tutorChatHandler = async (req, res) => {
  const prompt = req.body?.message || req.body?.prompt;
  const rag = await searchKnowledge(prompt, { ...getUserOptions(req), topK: 5 });
  const response = await chat(prompt, {
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
});

const tutorChat = catchAsync(tutorChatHandler);

const chatLegacy = catchAsync(async (req, res) => {
  req.body = { ...req.body, stream: false };
  return tutorChatHandler(req, res);
});

module.exports = { generateMcq, tutorChat, chatLegacy };