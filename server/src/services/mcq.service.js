const { z } = require('zod');
const { mcqSchema } = require('../../../shared/schemas/mcqSchema');
const { searchKnowledge, toCitation } = require('./rag.service');
const { chat, groqApiKeys } = require('./llm.service');

const ragSourceSchema = z.object({
  chunk_id: z.string().min(1),
  source_document: z.string().optional(),
  source_type: z.string().optional(),
  department: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  score: z.number().optional(),
});

const mcqSetSchema = z.object({
  questions: z.array(mcqSchema.extend({ rag_sources: z.array(ragSourceSchema).min(1) })),
  rag_sources: z.array(ragSourceSchema).min(1),
});

const difficultyPlan = (count) => {
  const easy = Math.round(count * 0.4);
  const medium = Math.round(count * 0.4);
  return [
    ...Array(easy).fill('easy'),
    ...Array(medium).fill('medium'),
    ...Array(Math.max(count - easy - medium, 0)).fill('hard'),
  ];
};

const promptFor = ({ topic, subject, count, context, exclude = [] }) => `
You are an expert cybersecurity educator and MCQ question generator.

Generate exactly ${count} multiple-choice questions for:
Subject: ${subject || topic}
Topic: ${topic}
Difficulty mix: 30% medium, 50% advanced, 20% scenario-based/application questions.

Requirements:
- Each question must have exactly four options: A, B, C, and D.
- Each question must have exactly one correct answer.
- Focus specifically on ${topic}; do not include unrelated material.
- Test understanding and practical application, not only memorization.
- Use clear, professional, technically accurate wording.
- Avoid duplicate or overly similar questions, options, scenarios, and answer patterns.
- Do not include explanations.
- Return ONLY valid JSON. Do not use Markdown, code fences, comments, or text outside JSON.

Required JSON structure:
{
  "subject": "${subject || topic}",
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "correct_answer": "A"
    }
  ]
}

The response must contain exactly ${count} question objects.
Previously accepted questions to avoid:
${exclude.length ? exclude.map((question, index) => `${index + 1}. ${question}`).join('\n') : 'None'}

REFERENCE CONTEXT:
${context}
`;

const normalizeGeneratedSet = ({ generated, topic, subject, count, ragSources }) => ({
  questions: (generated.questions || []).map((question, index) => ({
    question_text: question.question_text || question.question,
    options: Array.isArray(question.options)
      ? question.options
      : ['A', 'B', 'C', 'D'].map((label) => ({ label, text: question.options?.[label] })),
    correct_answer: question.correct_answer,
    explanation: '',
    department: question.department || 'General',
    subject: question.subject || subject || topic,
    topic: question.topic || topic,
    year: new Date().getFullYear(),
    difficulty: question.difficulty || difficultyPlan(count)[index] || 'medium',
    rag_sources: question.rag_sources || ragSources,
  })),
  rag_sources: generated.rag_sources || ragSources,
});

const fallbackQuestion = (topic, difficulty, source, index = 0) => {
  const prompts = [
    `Which statement best describes the core purpose of ${topic}?`,
    `Which concept is most closely associated with ${topic}?`,
    `Which situation is a practical application of ${topic}?`,
    `Which outcome is expected when applying ${topic} correctly?`,
    `Which principle is important when studying ${topic}?`,
  ];
  const angles = [
    'definitions', 'key components', 'working principles', 'design decisions', 'common use cases',
    'advantages', 'limitations', 'practical examples', 'implementation steps', 'performance factors',
    'security considerations', 'reliability concerns', 'scalability choices', 'data flow', 'system boundaries',
    'input requirements', 'output behavior', 'error handling', 'testing strategies', 'trade-offs',
    'comparison with related concepts', 'real-world constraints', 'maintenance concerns', 'optimization methods',
    'integration patterns', 'failure scenarios', 'best practices', 'evaluation criteria', 'debugging approaches',
    'future improvements',
  ];
  const questionText = `${prompts[index % prompts.length]} Focus on ${angles[index % angles.length]} in ${topic}.`;
  const labels = ['A', 'B', 'C', 'D'];
  const correctIndex = index % labels.length;
  const optionTexts = [
    `${topic} is best understood by examining its ${angles[index % angles.length]}.`,
    `${topic} is unrelated to academic or practical systems.`,
    `${topic} can only be applied when all system constraints are ignored.`,
    `${topic} cannot be evaluated using evidence or examples.`,
  ];
  const options = labels.map((label, optionIndex) => ({
    label,
    text: optionTexts[(optionIndex - correctIndex + optionTexts.length) % optionTexts.length],
  }));
  return {
  question_text: questionText,
  options,
  correct_answer: labels[correctIndex],
  explanation: `The provided source explains the core principles of ${topic}.`,
  department: source.department || 'General',
  subject: source.subject || 'General',
  topic,
  year: new Date().getFullYear(),
  difficulty,
  rag_sources: [source],
  };
};

const fallbackSet = ({ topic, count, rag_sources, offset = 0 }) => ({
  questions: difficultyPlan(count).map((difficulty, index) => fallbackQuestion(topic, difficulty, rag_sources[0], offset + index)),
  rag_sources,
});

const cleanQuestionText = (text) => String(text || '')
  .replace(/^\s*#+\s*/, '')
  .replace(/^\s*Q\s*\d+\s*[.:)\-]\s*/i, '')
  .replace(/\s*\(Question\s+\d+\)\s*$/i, '')
  .trim();

const numberQuestions = (questions) => questions.map((question, index) => ({
  ...question,
  question_text: `Q${index + 1}. ${cleanQuestionText(question.question_text)}`,
}));

const cachedQuestions = async ({ topic, subject, department, count }) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) return [];
  const QuestionBank = require('../models/QuestionBank');
  const questions = await QuestionBank.find({
    $or: [{ topic }, { subject }],
    ...(department ? { department } : {}),
    source: { $in: ['practice-mcq', 'mock-test'] },
  }).sort({ createdAt: -1 }).limit(count * 3).lean();
  const unique = new Map();
  questions.forEach((question) => {
    const key = cleanQuestionText(question.question_text).toLowerCase();
    if (key && !unique.has(key)) unique.set(key, question);
  });
  return [...unique.values()].slice(0, count);
};

const toReusableSet = (questions, topic, subject, department) => {
  const source = {
    chunk_id: `question-bank-${subject || topic}`,
    source_document: 'Question Bank',
    source_type: 'generated-question-bank',
    department: department || 'General',
    subject: subject || topic || 'General',
    topic: topic || 'General',
    score: 1,
  };
  return {
    questions: numberQuestions(questions.map((question) => ({ ...question, rag_sources: [source] }))),
    rag_sources: [source],
  };
};

const generateMcqSet = async ({ topic, count = 5, department, subject, provider = 'apinex', reuseCache = true }) => {
  const safeCount = Math.max(1, Math.min(Number(count) || 5, 50));
  if (reuseCache) {
    const reusable = await cachedQuestions({ topic, subject, department, count: safeCount });
    if (reusable.length >= safeCount) return toReusableSet(reusable.slice(0, safeCount), topic, subject, department);
  }
  let rag = await searchKnowledge(topic, { department, subject, topK: 5 });

  if (!rag.rag_sources.length) {
    const QuestionBank = require('../models/QuestionBank');
    const existingQuestions = await QuestionBank.find({
      $or: [{ subject }, { topic }, { department }],
    }).limit(15).lean();

    const fallbackContent = existingQuestions.length
      ? existingQuestions.map((q) => `${q.question_text} (Topic: ${q.topic}, Correct: ${q.correct_answer})`).join('\n')
      : `${subject || topic} is a core academic subject covering fundamental principles, architectural models, design patterns, and application problems in ${department || 'computer science'}.`;

    const syntheticChunk = {
      _id: existingQuestions.length ? String(existingQuestions[0]._id) : 'default-knowledge-chunk',
      source_document: `${subject || topic} Curriculum Notes`,
      source_type: 'curriculum',
      department: department || 'Computer Science',
      subject: subject || topic || 'General',
      topic: topic || 'General',
      score: 1.0,
      content: fallbackContent,
    };

    rag = {
      query: topic,
      chunks: [syntheticChunk],
      chunkIds: [syntheticChunk._id],
      context: fallbackContent,
      rag_sources: [toCitation(syntheticChunk)],
    };
  }

  const uniqueQuestions = new Map();
  const keys = typeof groqApiKeys === 'function' ? groqApiKeys() : [undefined];
  const apiKeyCount = Math.max(keys.length, 1);
  const batchSize = Math.min(5, safeCount);
  let batchOffset = 0;
  while (uniqueQuestions.size < safeCount && batchOffset < safeCount * 2) {
    const remaining = safeCount - uniqueQuestions.size;
    const waveSize = Math.min(apiKeyCount, Math.ceil(remaining / batchSize));
    const requests = Array.from({ length: waveSize }, (_, index) => {
      const requested = Math.min(batchSize, remaining - index * batchSize);
      const exclude = [...uniqueQuestions.values()].map((question) => cleanQuestionText(question.question_text)).slice(-40);
      const options = {
        temperature: 0.2,
        ...(provider === 'groq'
          ? { provider: 'groq', apiKey: keys[index % keys.length] }
          : process.env.APINEX_API_KEY || process.env.apinex
          ? { provider: 'apinex' }
          : { provider: 'groq', apiKey: keys[index % keys.length] }),
      };
      return chat(promptFor({ topic, subject, count: requested, context: rag.context, exclude }), options)
        .then((raw) => {
          const generated = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const normalized = normalizeGeneratedSet({
            generated,
            topic,
            subject,
            count: requested,
            ragSources: generated.rag_sources || rag.rag_sources,
          });
          const parsed = mcqSetSchema.parse(normalized);
          if (parsed.questions.length !== requested) throw new Error('MCQ batch count mismatch');
          return parsed;
        })
        .catch(() => fallbackSet({ topic, count: requested, rag_sources: rag.rag_sources, offset: batchOffset + index * batchSize }));
    });
    const generatedSets = await Promise.all(requests);
    generatedSets.flatMap((set) => set.questions).forEach((question) => {
      const key = cleanQuestionText(question.question_text).toLowerCase();
      if (uniqueQuestions.size < safeCount && key && !uniqueQuestions.has(key)) uniqueQuestions.set(key, question);
    });
    batchOffset += waveSize * batchSize;
  }
  const questions = [...uniqueQuestions.values()];
  if (questions.length < safeCount) {
    const supplement = fallbackSet({ topic, count: safeCount, rag_sources: rag.rag_sources, offset: safeCount }).questions;
    supplement.forEach((question) => {
      const key = cleanQuestionText(question.question_text).toLowerCase();
      if (questions.length < safeCount && !uniqueQuestions.has(key)) {
        uniqueQuestions.set(key, question);
        questions.push(question);
      }
    });
  }
  return { questions: numberQuestions(questions.slice(0, safeCount)), rag_sources: rag.rag_sources };
};

module.exports = { generateMcqSet, mcqSetSchema, difficultyPlan, promptFor, fallbackSet, numberQuestions };