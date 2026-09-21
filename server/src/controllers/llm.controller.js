const catchAsync = require('../utils/catchAsync');
const { searchKnowledge } = require('../services/rag.service');
const { generateMcqSet } = require('../services/mcq.service');
const { chat } = require('../services/llm.service');
const { searchDevDocs } = require('../services/devdocs.service');
const { classifyQuestion, captureKnowledge } = require('../services/knowledgeCapture.service');
const { saveConversationTurn } = require('../services/conversationPersistence.service');
const { logAction } = require('../services/audit.service');
const { generateMockTest, submitMockTest } = require('../services/mockTest.service');
const { upsertLearningPath, generateTopicMaterial } = require('../services/learningPath.service');
const TutorConversation = require('../models/TutorConversation');
const LearningPath = require('../models/LearningPath');
const QuestionBank = require('../models/QuestionBank');
const User = require('../models/User');
const { getAvailability, isAvailable } = require('../services/aiAvailability.service');
const { escalateDistress, isDistressPrompt, getDistressSeverity } = require('../services/safety.service');

const getUserOptions = (req) => ({
  department: req.user?.dept || req.user?.department,
  subject: req.body?.subject,
});

const generateMcq = catchAsync(async (req, res) => {
  const { topic, count, subject } = req.body;
  const payload = { topic, count, subject, ...getUserOptions(req) };
  const result = await generateMcqSet(payload);
  const newQuestions = result.questions.filter((question) => !question._id).map((question) => ({
    ...question,
    department: question.department || payload.department || 'General',
    subject: question.subject || subject || topic,
    source: 'practice-mcq',
    is_verified: false,
  }));
  if (newQuestions.length) await QuestionBank.insertMany(newQuestions, { ordered: false });
  res.json({ success: true, data: result });
});

const generateQuestionSets = catchAsync(async (req, res) => {
  const { subject, topic, count = 5, set_count = 3 } = req.body;
  if (!subject || !topic) return res.status(400).json({ success: false, message: 'subject and topic are required.' });
  const totalSets = Math.max(3, Math.min(Number(set_count) || 3, 5));
  const sets = [];
  for (let index = 0; index < totalSets; index += 1) {
    const setName = `AI Generated Set ${index + 1}`;
    const result = await generateMcqSet({ topic: `${topic} - ${setName}`, subject, count, reuseCache: false });
    const documents = result.questions.map((question) => ({
      ...question,
      topic,
      subject,
      department: req.user.dept || req.user.department || 'General',
      source: 'question-bank-generated',
      set_name: setName,
      is_verified: false,
      created_by: req.user.id,
    }));
    if (documents.length) await QuestionBank.insertMany(documents, { ordered: false });
    sets.push({ set_name: setName, subject, topic, question_count: documents.length });
  }
  return res.status(201).json({ success: true, data: sets });
});

const tutorChatHandler = async (req, res) => {
  const prompt = req.body?.message || req.body?.prompt;
  const isDistressRequest = Boolean(isDistressPrompt(prompt));
  const distressSeverity = isDistressRequest ? getDistressSeverity(prompt) : null;
  const availability = await getAvailability();
  const isNormalConversation = /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|who are you|what can you do|thanks|thank you|okay|ok|bye|goodbye|tell me a joke|i feel|i'm feeling|i am feeling|i need support|i am stressed|i'm stressed|i am anxious|i'm anxious|i am bored|i'm bored|i am lonely|i'm lonely|i am sad|i'm sad|i am tired|i'm tired|i feel overwhelmed|can we talk|talk to me|help me calm down|let's relax|lets relax)\b/i.test(String(prompt || '').trim());
  const educationPaused = !isAvailable(availability, 'tutor_education') && !isNormalConversation;
  const isWeatherRequest = /\b(weather|temperature|forecast|rain|raining|sunny)\b/i.test(prompt || '');
  const userOptions = getUserOptions(req);
  const history = Array.isArray(req.body?.history) ? req.body.history.filter((message) => message?.role && message?.content).slice(-20) : [];
  const followupTopic = String(prompt || '').match(/^\s*(?:in|about|within)\s+([a-z][a-z0-9 -]{2,})[?.!]?\s*$/i)?.[1];
  const classification = classifyQuestion(prompt, followupTopic
    ? { ...userOptions, topic: followupTopic.replace(/\b\w/g, (character) => character.toUpperCase()) }
    : userOptions);
  const conversationTitle = `${classification.topic} / ${classification.subtopic}`;
  let conversation = null;
  try {
    if (req.body?.conversation_id && /^[a-f\d]{24}$/i.test(String(req.body.conversation_id))) {
      conversation = await TutorConversation.findOne({ _id: req.body.conversation_id, user: req.user.id });
    }
    if (!conversation) {
      conversation = await TutorConversation.create({ user: req.user.id, title: conversationTitle, topic: classification.topic, subtopic: classification.subtopic });
    }
    if (conversation && conversation.messages.length === 0) {
      conversation.title = conversationTitle;
      conversation.topic = classification.topic;
      conversation.subtopic = classification.subtopic;
    }
  } catch (error) {
    console.warn(`[Conversation] Could not load conversation: ${error.message}`);
  }
  const rag = isDistressRequest || educationPaused || isWeatherRequest
    ? { relevant: false, chunks: [], context: '', chunkIds: [], rag_sources: [] }
    : await searchKnowledge(prompt, { ...userOptions, topic: classification.topic, topK: 5 });
  const devdocs = isDistressRequest || educationPaused || isWeatherRequest ? { context: '', sources: [] } : await searchDevDocs(prompt, { topK: 2 });
  const context = [rag.context, devdocs.context].filter(Boolean).join('\n\n');
  const useStoredKnowledge = rag.relevant && !devdocs.context && rag.chunks[0]?.content;
  const response = isDistressRequest && distressSeverity === 'critical'
    ? 'I am really sorry you are carrying this much fear and shame right now. A low grade does not define you or make you a disgrace. Please pause and move away from anything you could use to hurt yourself or someone else. Contact a trusted person, faculty member, HOD, or family member now and tell them you need someone with you. If there is immediate danger, call emergency services now.'
    : isDistressRequest
    ? 'It sounds like the exam or result is feeling difficult right now. You are not alone, and one exam does not define your ability or future. Please take a short pause, breathe, and contact a faculty member if you want help making a manageable plan.'
    : educationPaused
    ? 'I am here with you, but academic answers are temporarily paused. You can still talk with me about how you are feeling, ask for a calming break, or have a normal conversation. You do not need to solve everything right now.'
    : isWeatherRequest
    ? 'I do not have a live weather feed, so I cannot give today\'s forecast. I can still help with your coursework, revision, or study planning.'
    : useStoredKnowledge
    ? rag.chunks[0].content
    : await chat(prompt, {
      systemPrompt: educationPaused ? 'Only respond to normal conversation, emotional support, and calming requests. Do not answer academic, exam, study, or coding questions. Be gentle and do not create pressure.' : 'Answer naturally for normal conversation. For academic or coding questions, use the supplied context when relevant, explain clearly, and cite source names or URLs when you use them. Do not invent documentation details.',
      history,
      context,
    });

  const savedKnowledge = !isDistressRequest && !educationPaused && !isWeatherRequest && !useStoredKnowledge
    ? await captureKnowledge({ question: prompt, answer: response, classification }).catch((error) => {
      console.warn(`[Knowledge] Could not persist generated answer: ${error.message}`);
      return null;
    })
    : null;

  if (conversation) {
    conversation.messages.push({ role: 'user', content: prompt }, { role: 'assistant', content: response });
    conversation.last_sequence += 2;
    await conversation.save().catch((error) => console.warn(`[Conversation] Could not save conversation: ${error.message}`));
  }

  const localConversation = await saveConversationTurn({
    conversationId: conversation?._id || req.body?.conversation_id,
    userId: req.user?.id,
    title: conversation?.title || conversationTitle,
    topic: classification.topic,
    subtopic: classification.subtopic,
    question: prompt,
    answer: response,
  }).catch((error) => {
    console.warn(`[Conversation] Could not save local conversation: ${error.message}`);
    return null;
  });

  await logAction({
    actor: req.user?.id || req.user?._id,
    actor_role: req.user?.role || 'student',
    action: 'tutor_response',
    resource_type: 'llm',
    department: req.user?.dept || req.user?.department,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    metadata: { rag_sources: [...rag.chunkIds, ...devdocs.sources.map((source) => source.chunk_id)], prompt_length: prompt?.length || 0 },
  });

  const payload = {
    response,
    conversation_id: conversation?._id || localConversation?.conversationId,
    conversation_title: conversation?.title || conversationTitle,
    rag_sources: [...rag.rag_sources, ...devdocs.sources],
    knowledge: savedKnowledge ? {
      saved: true,
      mongo_saved: savedKnowledge.mongoSaved,
      sequence: savedKnowledge.sequence,
      topic_sequence: savedKnowledge.topicSequence,
      ...savedKnowledge.classification,
    } : { saved: false, source: 'mongo_vector_search' },
    distress_detection: req.distress_detection || { flagged: false },
  };
  await escalateDistress({ prompt, response, user: req.user, req, confirmed: false }).catch((error) => console.error('[Safety] Distress escalation failed:', error.message));
  if (req.body?.stream === false || typeof res.write !== 'function') {
    return res.json({ success: true, data: payload });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const parts = String(response).match(/\S+\s*/g) || [''];
  for (const part of parts) {
    res.write(`data: ${JSON.stringify({ delta: part })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 28));
  }
  res.write(`data: ${JSON.stringify({ rag_sources: payload.rag_sources, knowledge: payload.knowledge, distress_detection: payload.distress_detection, conversation_id: payload.conversation_id, conversation_title: payload.conversation_title, done: true })}\n\n`);
  return res.end();
};

const tutorChat = catchAsync(tutorChatHandler);

const chatLegacy = catchAsync(async (req, res) => {
  req.body = { ...req.body, stream: false };
  return tutorChatHandler(req, res);
});

const generateMock = catchAsync(async (req, res) => {
  const result = await generateMockTest({ user: req.user, subject: req.body.subject, topic: req.body.topic, setName: req.body.set_name, count: req.body.count, durationMinutes: req.body.duration_minutes });
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

const generateLearningTopic = catchAsync(async (req, res) => {
  const { subject, topic } = req.body;
  if (!subject || !topic) return res.status(400).json({ success: false, message: 'subject and topic are required.' });
  const material = await generateTopicMaterial({ user: req.user, subject, topic });
  if (!material) return res.status(404).json({ success: false, message: 'Learning-path topic not found.' });
  return res.json({ success: true, data: material });
});

module.exports = { generateMcq, generateQuestionSets, tutorChat, chatLegacy, generateMock, submitMock, generateLearningPath, generateLearningTopic };