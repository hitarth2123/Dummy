const fs = require('fs/promises');
const path = require('path');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embed } = require('./llm.service');

const datasetPath = path.resolve(__dirname, '../dataset/generatedKnowledge.json');
let writeQueue = Promise.resolve();

const SUBJECTS = [
  ['dbms', 'DBMS'],
  ['database', 'DBMS'],
  ['operating system', 'Operating Systems'],
  ['computer network', 'Computer Networks'],
  ['data structure', 'Data Structures'],
  ['algorithm', 'Algorithms'],
  ['software engineering', 'Software Engineering'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['react', 'React'],
  ['node', 'Node.js'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['sql', 'SQL'],
];

const cleanLabel = (value, fallback) => value.replace(/\s+/g, ' ').trim().slice(0, 100) || fallback;
const titleCase = (value) => value.replace(/\b\w/g, (character) => character.toUpperCase());

const classifyQuestion = (question, options = {}) => {
  const normalized = question.toLowerCase();
  const subject = options.subject || SUBJECTS.find(([term]) => normalized.includes(term))?.[1] || 'General';
  const inPhrase = normalized.match(/\b(?:what is|what are|explain|define|tell me about)\s+(.+?)\s+in\s+([a-z][a-z0-9 -]{2,})\b/);
  const directTopic = normalized.match(/\b(?:what is|what are|explain|define|tell me about)\s+(?:the\s+)?([a-z][a-z0-9 -]{2,}?)(?:\?|\.|!|$)/);
  const topicPatterns = [
    ['normalization', 'Normalization'], ['transaction', 'Transactions'], ['acid', 'ACID Properties'],
    ['deadlock', 'Deadlocks'], ['scheduling', 'CPU Scheduling'], ['binary search', 'Binary Search'],
    ['linked list', 'Linked Lists'], ['api', 'APIs'], ['component', 'Components'],
    ['database', 'Database Fundamentals'], ['algorithm', 'Algorithms'], ['function', 'Functions'],
  ];
  const topic = options.topic || (inPhrase ? titleCase(cleanLabel(inPhrase[2], 'General')) : topicPatterns.find(([term]) => normalized.includes(term))?.[1]) || (directTopic ? titleCase(cleanLabel(directTopic[1], 'General')) : cleanLabel(question.split(/[?.!]/)[0], 'General Conversation'));
  const subtopicPatterns = [
    ['1nf', '1NF'], ['2nf', '2NF'], ['3nf', '3NF'], ['bcnf', 'BCNF'],
    ['atomicity', 'Atomicity'], ['consistency', 'Consistency'], ['isolation', 'Isolation'], ['durability', 'Durability'],
    ['fetch', 'Fetch API'], ['hooks', 'Hooks'], ['recursion', 'Recursion'], ['complexity', 'Time Complexity'],
  ];
  const subtopic = options.subtopic || (inPhrase ? titleCase(cleanLabel(inPhrase[1], 'Core Concepts')) : subtopicPatterns.find(([term]) => normalized.includes(term))?.[1]) || 'Core Concepts';
  return { department: options.department || 'General', subject, topic, subtopic };
};

const shouldCapture = (question) => {
  const normalized = question.toLowerCase().trim();
  return normalized.split(/\s+/).length >= 4 && !/^(hi|hello|hey|thanks|thank you|good morning|good evening)[!. ]*$/i.test(normalized);
};

const appendDataset = async (entry) => {
  let sequence = 1;
  let topicSequence = 1;
  writeQueue = writeQueue.then(async () => {
    let items = [];
    try {
      items = JSON.parse(await fs.readFile(datasetPath, 'utf8'));
    } catch {
      items = [];
    }
    const topicKey = `${entry.subject}/${entry.topic}/${entry.subtopic}`;
    topicSequence = items.filter((item) => `${item.subject}/${item.topic}/${item.subtopic}` === topicKey).length + 1;
    sequence = items.length + 1;
    items.push({ ...entry, sequence, topic_sequence: topicSequence });
    items.sort((left, right) => left.sequence - right.sequence);
    await fs.writeFile(datasetPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  });
  await writeQueue;
  return { sequence, topicSequence };
};

const captureKnowledge = async ({ question, answer, classification }) => {
  if (!shouldCapture(question) || !answer?.trim()) return null;
  const embedding = await embed(`${classification.subject} ${classification.topic} ${classification.subtopic} ${question} ${answer}`);
  const timestamp = new Date().toISOString();
  const entry = {
    department: classification.department,
    subject: classification.subject,
    topic: classification.topic,
    subtopic: classification.subtopic,
    question,
    answer,
    keywords: question.toLowerCase().split(/\W+/).filter((word) => word.length > 2).slice(0, 20),
    created_at: timestamp,
  };
  const datasetRecord = await appendDataset(entry);
  let document = null;
  let mongoSaved = false;
  try {
    [document] = await KnowledgeChunk.create({
      content: answer,
      embedding,
      source_document: 'generatedKnowledge.json',
      source_type: 'manual',
      department: classification.department,
      subject: classification.subject,
      topic: classification.topic,
      subtopic: classification.subtopic,
      token_count: answer.split(/\s+/).length,
      metadata: {
        question,
        generated_at: timestamp,
        dataset_path: datasetPath,
        sequence: datasetRecord.sequence,
        topic_sequence: datasetRecord.topicSequence,
      },
    });
    mongoSaved = true;
  } catch (error) {
    console.warn(`[Knowledge] JSON saved but MongoDB save failed: ${error.message}`);
  }
  console.log(
    `[Knowledge] Saved locally: ${datasetPath} | ${classification.topic} / ${classification.subtopic} `
    + `| sequence=${datasetRecord.sequence} | mongo=${mongoSaved}`
  );
  return { document, mongoSaved, ...datasetRecord, classification };
};

module.exports = { classifyQuestion, shouldCapture, captureKnowledge, datasetPath };
