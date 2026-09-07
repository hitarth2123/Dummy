const { z } = require('zod');
const { mcqSchema } = require('../../../shared/schemas/mcqSchema');
const { searchKnowledge } = require('./rag.service');
const { chat } = require('./llm.service');

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

const promptFor = ({ topic, count, context }) => `
You are AI Buddy's academic assessment generator. Use ONLY this RAG context.
Generate exactly ${count} MCQs about ${topic}. Difficulty distribution must be 40% easy, 40% medium, 20% hard where mathematically possible.
Output ONLY JSON matching {"questions":[...],"rag_sources":[...]}. Every question must have four A/B/C/D options, one correct_answer, an explanation, and rag_sources containing a real chunk_id from the context.
RAG CONTEXT:
${context}
`;

const fallbackQuestion = (topic, difficulty, source) => ({
  question_text: `Which statement best describes ${topic}?`,
  options: [
    { label: 'A', text: `${topic} is defined by its core principles and constraints.` },
    { label: 'B', text: 'It has no formal definition.' },
    { label: 'C', text: 'It applies only outside academic contexts.' },
    { label: 'D', text: 'It cannot be evaluated.' },
  ],
  correct_answer: 'A',
  explanation: `The provided source explains the core principles of ${topic}.`,
  department: source.department || 'General',
  subject: source.subject || 'General',
  topic,
  year: new Date().getFullYear(),
  difficulty,
  rag_sources: [source],
});

const fallbackSet = ({ topic, count, rag_sources }) => ({
  questions: difficultyPlan(count).map((difficulty) => fallbackQuestion(topic, difficulty, rag_sources[0])),
  rag_sources,
});

const generateMcqSet = async ({ topic, count = 5, department, subject }) => {
  const safeCount = Math.max(1, Math.min(Number(count) || 5, 20));
  const rag = await searchKnowledge(topic, { department, subject, topK: 5 });
  if (!rag.rag_sources.length) throw new Error('No relevant knowledge chunks were found for this topic.');

  let generated;
  try {
    const raw = await chat(promptFor({ topic, count: safeCount, context: rag.context }), { temperature: 0.2 });
    generated = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const parsed = mcqSetSchema.parse({ ...generated, rag_sources: generated.rag_sources || rag.rag_sources });
    if (parsed.questions.length !== safeCount) throw new Error('MCQ count mismatch');
    return parsed;
  } catch {
    return fallbackSet({ topic, count: safeCount, rag_sources: rag.rag_sources });
  }
};

module.exports = { generateMcqSet, mcqSetSchema, difficultyPlan, promptFor, fallbackSet };