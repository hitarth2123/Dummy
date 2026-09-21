const MockTest = require('../models/MockTest');
const QuestionBank = require('../models/QuestionBank');
const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const { generateMcqSet, fallbackSet, numberQuestions } = require('./mcq.service');
const { chat } = require('./llm.service');
const { curriculum } = require('../constants/curriculum');

const generateLearningMaterials = async ({ subject, topics }) => {
  if (!topics.length) return new Map();
  const prompt = `
You are an expert teacher and exam-preparation tutor. Teach each syllabus topic from beginner level to exam-ready level.
Do not assume prior knowledge. Explain difficult terminology immediately and prioritize reasoning over memorization.

Subject: ${subject}
Student level: beginner progressing to exam level
Syllabus topics:
${topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

Return ONLY valid JSON in this exact shape:
{"topics":[{"topic":"Topic name","description":"clear overview","simple_explanation":"topic in simple words","why_it_matters":"why learners need it","practical_habit":"one habit","architecture_lens":"how it fits into real systems","reading_material":"complete structured lesson","key_concepts":["concept"],"study_steps":["step"],"worked_example":"fully worked example","common_mistakes":["mistake and correction"],"self_check":["check question"],"completion_checklist":["I can explain it"],"faqs":[{"question":"question","answer":"answer"}],"exercises":[{"question":"practice question without answer","options":["optional choice"]}],"estimated_minutes":45}]}

Requirements:
- Include exactly one object for every supplied topic.
- Keep every object focused on its supplied topic.
- Write a detailed lesson of at least 900 words per topic using these headings in order:
  1. CONCEPT: simple explanation, importance, formal definition, notation, and terminology.
  2. FORMULA / RULE: every formula or rule, symbol meanings, and when it can or cannot be used.
  3. STEP-BY-STEP EXAMPLES: at least two worked examples, one easy and one harder, showing every intermediate step.
  4. COMMON MISTAKES: incorrect approaches and why they fail.
  5. EXAM APPROACH: how to recognize the question and solve it efficiently.
  6. CONNECTIONS: how this topic relates to the other supplied topics.
- Include intuitive explanations, concrete numerical or practical examples, and tables when useful.
- Include 4 to 6 study steps, 3 to 5 key concepts, 2 to 4 common mistakes with corrections, and 2 to 4 self-check questions.
- Include simple_explanation, why_it_matters, practical_habit, and architecture_lens as useful learner-facing paragraphs.
- Include 3 to 5 completion_checklist statements and 2 to 4 concise FAQs with answers.
- Include 3 to 6 practice exercises without answers. Each exercise must be an object with a question field.
- Do not reveal answers to practice exercises or self-check questions.
- Do not include Markdown fences, explanations outside JSON, or unrelated topics.
`;
  try {
    const raw = await chat(prompt, { provider: 'groq', temperature: 0.35 });
    const parsed = JSON.parse(String(raw).replace(/^```json\s*|\s*```$/g, '').trim());
    return new Map((parsed.topics || []).map((item) => [String(item.topic || '').trim().toLowerCase(), item]));
  } catch (error) {
    console.warn(`[LearningPath] Groq study material generation failed: ${error.message}`);
    return new Map();
  }
};

const enrichLearningTopics = async ({ subject, topics }) => {
  const materials = await generateLearningMaterials({ subject, topics: topics.map((topic) => topic.topic) });
  return topics.map((topic) => {
    const material = materials.get(topic.topic.trim().toLowerCase());
    const fallbackConcepts = [
      `${topic.topic}: core definitions and purpose`,
      `${topic.topic}: main components and relationships`,
      `${topic.topic}: practical use and trade-offs`,
      `${topic.topic}: common risks and best practices`,
    ];
    const fallbackExercises = [
      { question: `Explain the main purpose of ${topic.topic} in ${subject}.` },
      { question: `Give one practical example of applying ${topic.topic}.` },
      { question: `Identify one risk and one mitigation related to ${topic.topic}.` },
    ];
    const existingReading = typeof topic.reading_material === 'string' ? topic.reading_material.trim() : '';
    const usableReading = existingReading.length >= 600 && !existingReading.startsWith('Study ');
    if (!material) {
      return {
        ...topic,
        description: topic.description || `Understand the purpose, components, applications, and trade-offs of ${topic.topic}.`,
        simple_explanation: topic.simple_explanation || `${topic.topic} is a focused idea in ${subject} that helps solve a particular class of problems.`,
        why_it_matters: topic.why_it_matters || `Understanding ${topic.topic} helps you reason about real problems, choose an appropriate approach, and explain your decisions in exams and projects.`,
        practical_habit: topic.practical_habit || `Before using ${topic.topic}, define the problem, list your assumptions, and test your reasoning with a small example.`,
        architecture_lens: topic.architecture_lens || `Connect ${topic.topic} to the larger system: identify what depends on it, what it produces, and what can fail.`,
        reading_material: usableReading ? existingReading : `## Understanding ${topic.topic}\n\n### What this topic means\n${topic.topic} is an important part of ${subject}. Define it in your own words, identify the problem it solves, and connect it to one practical example.\n\n### Core ideas\nStudy the definitions, components, relationships, assumptions, applications, trade-offs, and common failure cases of ${topic.topic}. Trace one example from input through reasoning to outcome.\n\n### How to apply it\nStart with a small example, state your assumptions, work through each step, check the result, and then explain how the approach changes when one assumption changes.`,
          study_steps: topic.study_steps?.length ? topic.study_steps : [`Define ${topic.topic} in your own words.`, `Trace its main components and relationships.`, `Work through a small example.`, `Apply it to a new scenario.`],
          worked_example: topic.worked_example || `Work through a small ${topic.topic} example step by step, state each assumption, and explain why each decision is made.`,
          common_mistakes: topic.common_mistakes?.length ? topic.common_mistakes : [`Memorizing ${topic.topic} without understanding when to apply it.`, `Skipping assumptions and checking neither the inputs nor the result.`],
          self_check: topic.self_check?.length ? topic.self_check : [`Can you define ${topic.topic} without notes?`, `Can you explain one practical use and one limitation?`],
          completion_checklist: topic.completion_checklist?.length ? topic.completion_checklist : [`I can explain ${topic.topic} in simple words.`, `I can solve a basic problem involving ${topic.topic}.`, `I can describe one practical application and one limitation.`],
          faqs: topic.faqs?.length ? topic.faqs : [{ question: `What is the main idea of ${topic.topic}?`, answer: `It is a method for understanding and solving problems related to ${topic.topic}.` }, { question: `How do I know when to use it?`, answer: `Look at the problem requirements, assumptions, and expected output before choosing an approach.` }],
        key_concepts: topic.key_concepts?.length ? topic.key_concepts : fallbackConcepts,
        exercises: topic.exercises?.length ? topic.exercises : fallbackExercises,
        estimated_minutes: topic.estimated_minutes || 30,
      };
    }
    const exercises = (material.exercises || []).map((exercise) => (
      typeof exercise === 'string' ? { question: exercise } : exercise
    ));
    return {
      ...topic,
      description: material.description || topic.description || `Understand the purpose and application of ${topic.topic}.`,
      simple_explanation: material.simple_explanation || topic.simple_explanation || `${topic.topic} is a focused idea in ${subject} that helps solve a particular class of problems.`,
      why_it_matters: material.why_it_matters || topic.why_it_matters || `Understanding ${topic.topic} helps you reason about real problems, choose an appropriate approach, and explain your decisions in exams and projects.`,
      practical_habit: material.practical_habit || topic.practical_habit || `Before using ${topic.topic}, define the problem, list your assumptions, and test your reasoning with a small example.`,
      architecture_lens: material.architecture_lens || topic.architecture_lens || `Connect ${topic.topic} to the larger system: identify what depends on it, what it produces, and what can fail.`,
      reading_material: material.reading_material || (usableReading ? existingReading : `## Understanding ${topic.topic}\n\n### What this topic means\n${topic.topic} is an important part of ${subject}. Define it in your own words, identify the problem it solves, and connect it to one practical example.\n\n### Core ideas\nStudy the definitions, components, relationships, assumptions, applications, trade-offs, and common failure cases of ${topic.topic}. Trace one example from input through reasoning to outcome.\n\n### How to apply it\nStart with a small example, state your assumptions, work through each step, check the result, and then explain how the approach changes when one assumption changes.`),
      study_steps: material.study_steps?.length ? material.study_steps : (topic.study_steps?.length ? topic.study_steps : [`Define ${topic.topic} in your own words.`, `Trace its main components and relationships.`, `Work through a small example.`, `Apply it to a new scenario.`]),
      worked_example: material.worked_example || topic.worked_example || `Work through a small ${topic.topic} example step by step, state each assumption, and explain why each decision is made.`,
      common_mistakes: material.common_mistakes?.length ? material.common_mistakes : (topic.common_mistakes?.length ? topic.common_mistakes : [`Memorizing ${topic.topic} without understanding when to apply it.`, `Skipping assumptions and checking neither the inputs nor the result.`]),
      self_check: material.self_check?.length ? material.self_check : (topic.self_check?.length ? topic.self_check : [`Can you define ${topic.topic} without notes?`, `Can you explain one practical use and one limitation?`]),
      completion_checklist: material.completion_checklist?.length ? material.completion_checklist : (topic.completion_checklist?.length ? topic.completion_checklist : [`I can explain ${topic.topic} in simple words.`, `I can solve a basic problem involving ${topic.topic}.`, `I can describe one practical application and one limitation.`]),
      faqs: material.faqs?.length ? material.faqs : (topic.faqs?.length ? topic.faqs : [{ question: `What is the main idea of ${topic.topic}?`, answer: `It is a method for understanding and solving problems related to ${topic.topic}.` }, { question: `How do I know when to use it?`, answer: `Look at the problem requirements, assumptions, and expected output before choosing an approach.` }]),
      key_concepts: material.key_concepts?.length ? material.key_concepts : (topic.key_concepts?.length ? topic.key_concepts : fallbackConcepts),
      exercises: exercises.length ? exercises : (topic.exercises?.length ? topic.exercises : fallbackExercises),
      estimated_minutes: Number(material.estimated_minutes) || topic.estimated_minutes || 30,
    };
  });
};

const generateMockTest = async ({ user, subject, topic, setName, count = 30, durationMinutes = 30 }) => {
  const total = Math.max(30, Math.min(Number(count) || 30, 50));
  const generated = await generateMcqSet({
    topic: topic || (setName ? `${subject} ${setName}` : subject),
    subject,
    department: user.dept || user.department,
    count: total,
    provider: 'groq',
    reuseCache: false,
  });
  const uniqueQuestions = new Map();
  generated.questions.forEach((question) => {
    const key = String(question.question_text || '')
      .replace(/^\s*Q\s*\d+\s*[.:)\-]\s*/i, '')
      .trim()
      .toLowerCase();
    if (key && !uniqueQuestions.has(key)) uniqueQuestions.set(key, question);
  });
  if (uniqueQuestions.size < total) {
    fallbackSet({
      topic: topic || subject,
      count: total,
      offset: total,
      rag_sources: generated.rag_sources,
    }).questions.forEach((question) => {
      const key = question.question_text.trim().toLowerCase();
      if (uniqueQuestions.size < total && !uniqueQuestions.has(key)) uniqueQuestions.set(key, question);
    });
  }
  const completeQuestions = numberQuestions([...uniqueQuestions.values()].slice(0, total));
  // A mock test owns a snapshot of its questions. Copy every generated item so
  // repeated cached document IDs cannot make different cards point to one record.
  const newQuestions = completeQuestions.map(({ _id, ...question }) => ({
    ...question,
    department: user.dept || user.department,
    subject,
    source: 'mock-test',
    is_verified: false,
    created_by: user.id,
  }));
  const questionDocs = newQuestions.length ? await QuestionBank.insertMany(newQuestions) : [];
  const mockTest = await MockTest.create({
    student: user.id,
    department: user.dept || user.department,
    subject,
    topic: topic || setName || subject,
    semester: user.semester,
    questions: questionDocs.map((question) => ({
      question: question._id,
      correct_answer: question.correct_answer,
      is_correct: false,
      topic: question.topic,
    })),
    score: 0,
    total_questions: questionDocs.length,
    score_pct: 0,
    status: 'in_progress',
    started_at: new Date(),
  });
  return { id: mockTest._id, duration_minutes: durationMinutes, subject, questions: questionDocs };
};

const submitMockTest = async ({ user, testId, answers = [], timeTakenSec = 0 }) => {
  const test = await MockTest.findOne({ _id: testId, student: user.id, status: 'in_progress' });
  if (!test) return null;
  const answerMap = new Map(answers.map((answer) => [String(answer.question || answer.question_id), answer.selected_answer || null]));
  const topicMap = new Map();
  let score = 0;
  test.questions.forEach((question) => {
    const selected = answerMap.get(String(question.question)) || null;
    question.selected_answer = selected;
    question.is_correct = selected === question.correct_answer;
    if (question.is_correct) score += 1;
    const topic = question.topic || 'General';
    const item = topicMap.get(topic) || { topic, correct: 0, total: 0, score_pct: 0 };
    item.total += 1;
    if (question.is_correct) item.correct += 1;
    topicMap.set(topic, item);
  });
  const topicBreakdown = [...topicMap.values()].map((item) => ({ ...item, score_pct: Math.round((item.correct / item.total) * 100) }));
  test.score = score;
  test.score_pct = Math.round((score / test.total_questions) * 100);
  test.topic_breakdown = topicBreakdown;
  test.time_taken_sec = timeTakenSec;
  test.status = 'completed';
  test.submitted_at = new Date();
  await test.save();
  await test.populate('questions.question');

  const weakTopics = topicBreakdown.filter((item) => item.score_pct < 60).map((item) => item.topic);
  await User.findByIdAndUpdate(user.id, { weak_topics: weakTopics });
  await upsertLearningPath({ user, mockScores: topicBreakdown });
  return test.toObject();
};

const upsertLearningPath = async ({ user, mockScores = [] }) => {
  const targetSubject = user.subject || (user.enrolled_subjects?.[0]) || 'DBMS';
  const weakTopics = user.weak_topics || mockScores.filter((item) => item.score_pct < 60).map((item) => item.topic);

  // Try to load from structured dataset for known subjects
  let datasetTopics = [];
  try {
    const subjectKey = targetSubject.toLowerCase().replace(/\s+/g, '_');
    const datasetPath = require('path').resolve(__dirname, `../dataset/${subjectKey}/${subjectKey}_learning_path.json`);
    datasetTopics = require(datasetPath);
  } catch {
    // No dataset file for this subject — fall back to DB topics
  }

  if (datasetTopics.length > 0) {
    // Build structured learning path from dataset
    const topics = datasetTopics.map((item, index) => {
      const matched = mockScores.find((m) => m.topic === item.topic);
      return {
        topic: item.topic,
        subject: targetSubject,
        order: item.order || index + 1,
        status: matched && matched.score_pct >= 80 ? 'completed' : matched && matched.score_pct >= 40 ? 'in_progress' : 'pending',
        score: matched ? matched.score_pct : null,
        description: item.description || '',
        reading_material: item.reading_material || '',
        key_concepts: item.key_concepts || [],
        exercises: item.exercises || [],
        estimated_minutes: item.estimated_minutes || 30,
      };
    });

    const completedCount = topics.filter((t) => t.status === 'completed').length;
    const overallPct = topics.length ? Math.round((completedCount / topics.length) * 100) : 0;

    return LearningPath.findOneAndUpdate(
      { student: user.id, department: user.dept || user.department, subject: targetSubject },
      {
        student: user.id,
        department: user.dept || user.department,
        subject: targetSubject,
        semester: user.semester || 5,
        topics,
        overall_progress_pct: overallPct,
        generated_by: 'ai',
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  }

  // Use curriculum topics first so "All topics" includes the complete roadmap.
  const normalizedSubject = targetSubject.toLowerCase().replace(/[^a-z0-9]/g, '');
  const curriculumSubject = curriculum.semesters
    .flatMap((semester) => semester.specializations || [])
    .flatMap((specialization) => specialization.subjects || [])
    .find((subject) => {
      const normalizedName = subject.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedName === normalizedSubject
        || normalizedName.includes(normalizedSubject)
        || normalizedSubject.includes(normalizedName);
    });
  let dbTopics = curriculumSubject?.topics || [];
  try {
    if (!dbTopics.length) dbTopics = await QuestionBank.distinct('topic', { subject: targetSubject });
  } catch (err) {
    if (!dbTopics.length) dbTopics = [];
  }

  if (!dbTopics.length) {
    dbTopics = [
      `${targetSubject} — Core Concepts & Fundamentals`,
      `${targetSubject} — Architecture & Design`,
      `${targetSubject} — Advanced Problem Solving`,
      `${targetSubject} — Optimization & Analysis`,
      `${targetSubject} — Practical Applications`,
    ];
  }

  const topicItems = dbTopics.map((topicName) => {
    const matched = mockScores.find((m) => m.topic === topicName);
    return {
      topic: topicName,
      subject: targetSubject,
      score: matched ? matched.score_pct : null,
    };
  });

  let topics = [...new Map([
    ...mockScores.sort((a, b) => a.score_pct - b.score_pct).map((item) => [item.topic, { topic: item.topic, subject: targetSubject, score: item.score_pct }]),
    ...weakTopics.map((topic) => [topic, { topic, subject: targetSubject, score: null }]),
    ...topicItems.map((item) => [item.topic, item]),
  ]).values()].slice(0, 20).map((item, index) => ({ ...item, order: index + 1, status: 'pending' }));

  return LearningPath.findOneAndUpdate(
    { student: user.id, department: user.dept || user.department, subject: targetSubject },
    { student: user.id, department: user.dept || user.department, subject: targetSubject, semester: user.semester || 5, topics, overall_progress_pct: 0, generated_by: 'ai', $inc: { version: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
};

const generateTopicMaterial = async ({ user, subject, topic }) => {
  const path = await LearningPath.findOne({
    student: user.id,
    department: user.dept || user.department,
    subject,
  });
  if (!path) return null;
  const existing = path.topics.find((item) => item.topic === topic);
  if (!existing) return null;
  const [enriched] = await enrichLearningTopics({
    subject,
    topics: [existing.toObject ? existing.toObject() : existing],
  });
  Object.assign(existing, enriched);
  await path.save();
  return existing.toObject();
};

module.exports = { generateMockTest, submitMockTest, upsertLearningPath, generateTopicMaterial };
