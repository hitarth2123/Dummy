const MockTest = require('../models/MockTest');
const QuestionBank = require('../models/QuestionBank');
const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const { generateMcqSet } = require('./mcq.service');

const generateMockTest = async ({ user, subject, setName, count = 30, durationMinutes = 30 }) => {
  const total = Math.max(30, Math.min(Number(count) || 30, 50));
  const generated = await generateMcqSet({
    topic: setName ? `${subject} ${setName}` : subject,
    subject,
    department: user.dept || user.department,
    count: total,
  });
  const questionDocs = await QuestionBank.insertMany(generated.questions.map((question) => ({
    ...question,
    department: user.dept || user.department,
    subject,
    source: 'mock-test',
    is_verified: false,
    created_by: user.id,
  })));
  const mockTest = await MockTest.create({
    student: user.id,
    department: user.dept || user.department,
    subject,
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

  // Fallback: use existing DB topics or generic placeholders
  let dbTopics = [];
  try {
    dbTopics = await QuestionBank.distinct('topic', { subject: targetSubject });
  } catch (err) {
    dbTopics = [];
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

  const topics = [...new Map([
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

module.exports = { generateMockTest, submitMockTest, upsertLearningPath };
