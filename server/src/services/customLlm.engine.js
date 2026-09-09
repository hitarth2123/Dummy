/**
 * server/src/services/customLlm.engine.js
 * In-House Custom LLM & Semantic Academic Reasoning Engine.
 *
 * 100% Offline, Zero-API-Dependency intelligent academic mentor.
 * Synthesizes structured concept explanations, past paper revision,
 * interactive MCQs, and multi-turn study dialogue from curated datasets.
 */

const path = require('path');
const conversationalIntents = require('../dataset/conversationalIntents.json');
const normalConversation = require('../dataset/normalConversation.json');
const academicKnowledge = require('../dataset/academicKnowledge.json');
const { generateLocalEmbedding, cosineSimilarity } = require('./localEmbedding.service');

// Precompute embeddings for academic dataset topics for ultra-fast semantic retrieval
const precomputedKnowledge = academicKnowledge.map((item) => {
  const searchableText = `${item.department} ${item.subject} ${item.topic} ${item.summary} ${item.keywords.join(' ')}`;
  return {
    ...item,
    embedding: generateLocalEmbedding(searchableText),
  };
});

/**
 * Tokenize and extract keywords from prompt.
 * @param {string} text
 * @returns {string[]}
 */
const extractKeywords = (text) => {
  if (!text) return [];
  const stopwords = new Set([
    'a', 'an', 'the', 'in', 'on', 'of', 'for', 'with', 'to', 'at', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'what', 'why', 'how', 'when', 'where', 'which', 'who', 'tell', 'me', 'about',
    'explain', 'describe', 'give', 'can', 'you', 'please', 'and', 'or', 'that', 'this'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopwords.has(w));
};

/**
 * Match conversational intent (greetings, motivation, help, etc.)
 * @param {string} prompt
 * @returns {string|null}
 */
const matchConversationalIntent = (prompt) => {
  const normalized = prompt.toLowerCase().trim();

  for (const item of [...normalConversation, ...conversationalIntents]) {
    if (item.patterns) {
      for (const pat of item.patterns) {
        if (new RegExp(pat, 'i').test(normalized)) {
          const idx = Math.floor(Math.random() * item.responses.length);
          return item.responses[idx];
        }
      }
    }

    if (item.keywords) {
      const hasKeyword = item.keywords.some((kw) => normalized.includes(kw));
      if (hasKeyword) {
        const idx = Math.floor(Math.random() * item.responses.length);
        return item.responses[idx];
      }
    }
  }

  return null;
};

/**
 * Check if the prompt is requesting MCQs / Quiz questions.
 * @param {string} prompt
 * @returns {boolean}
 */
const isMcqRequest = (prompt) => {
  const lower = prompt.toLowerCase();
  return (
    lower.includes('mcq') ||
    lower.includes('quiz') ||
    lower.includes('practice question') ||
    lower.includes('test question') ||
    lower.includes('multiple choice')
  );
};

/**
 * Find the most relevant academic topic from the dataset.
 * @param {string} prompt
 * @returns {{ item: object, score: number } | null}
 */
const findBestAcademicMatch = (prompt) => {
  const promptVec = generateLocalEmbedding(prompt);
  const promptKeywords = extractKeywords(prompt);

  let bestMatch = null;
  let highestScore = -1;

  precomputedKnowledge.forEach((item) => {
    // 1. Vector cosine similarity (semantic similarity)
    const vecScore = cosineSimilarity(promptVec, item.embedding);

    // 2. Keyword exact match score
    let keywordScore = 0;
    const itemText = `${item.subject} ${item.topic} ${item.keywords.join(' ')}`.toLowerCase();
    promptKeywords.forEach((kw) => {
      if (itemText.includes(kw)) {
        keywordScore += 0.25;
      }
    });

    // 3. Department / Subject exact match boost
    const deptMatch = prompt.toLowerCase().includes(item.department.toLowerCase()) ? 0.2 : 0;
    const subjectMatch = prompt.toLowerCase().includes(item.subject.toLowerCase()) ? 0.3 : 0;
    const topicMatch = prompt.toLowerCase().includes(item.topic.toLowerCase()) ? 0.4 : 0;

    const totalScore = vecScore * 0.4 + keywordScore * 0.3 + deptMatch + subjectMatch + topicMatch;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestMatch = { item, score: totalScore };
    }
  });

  if (highestScore > 0.15) {
    return bestMatch;
  }
  return null;
};

/**
 * Format an academic MCQ quiz response.
 * @param {object} item
 * @returns {string}
 */
const formatMcqResponse = (item) => {
  const mcq = item.mcq;
  return `### 📝 Practice MCQ — ${item.subject}: ${item.topic}\n\n` +
    `**Question:** ${mcq.question}\n\n` +
    `**Options:**\n` +
    `• **A)** ${mcq.options.A}\n` +
    `• **B)** ${mcq.options.B}\n` +
    `• **C)** ${mcq.options.C}\n` +
    `• **D)** ${mcq.options.D}\n\n` +
    `---\n\n` +
    `**Correct Answer:** **${mcq.correct}**\n\n` +
    `**Explanation:** ${mcq.explanation}`;
};

/**
 * Format a structured academic explanation response.
 * @param {object} item
 * @returns {string}
 */
const formatAcademicExplanation = (item) => {
  let response = `## 🎓 ${item.subject} — ${item.topic}\n\n`;
  response += `> **Department:** \`${item.department}\` | **Subject:** \`${item.subject}\`\n\n`;
  response += `**Summary:** ${item.summary}\n\n`;
  response += `${item.details}\n\n`;

  if (item.example) {
    response += `### 💡 Practical Example / Code\n\`\`\`\n${item.example}\n\`\`\`\n\n`;
  }

  if (item.mcq) {
    response += `### 🧠 Quick Check\n` +
      `**Q:** ${item.mcq.question}\n` +
      `*Answer:* **${item.mcq.correct}** — ${item.mcq.explanation}\n`;
  }

  return response;
};

/**
 * generateCustomResponse — main entry point for the Custom LLM engine.
 *
 * @param {string} prompt
 * @param {Object} [options]
 * @param {string} [options.systemPrompt]
 * @param {Array}  [options.history]
 * @returns {Promise<string>}
 */
const generateCustomResponse = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== 'string') {
    return "Please provide a query or topic you'd like to discuss.";
  }

  const trimmed = prompt.trim();

  // Academic matches take priority when a casual keyword also appears in a topic request.
  const match = findBestAcademicMatch(trimmed);

  // Short standalone messages use the normal conversation datasets.
  const conversational = matchConversationalIntent(trimmed);
  if (!match && conversational && trimmed.split(/\s+/).length <= 8) {
    return conversational;
  }

  if (match) {
    // If user specifically asked for MCQs on this topic
    if (isMcqRequest(trimmed)) {
      return formatMcqResponse(match.item);
    }
    return formatAcademicExplanation(match.item);
  }

  // Keep unmatched general conversation natural instead of inventing an academic answer.
  if (conversational) {
    return conversational;
  }

  return `I am not sure how to answer that yet. I can explain academic topics, create practice MCQs, help with exam planning, or have a short study-related conversation. Try asking about a specific subject or topic.`;
};

module.exports = {
  generateCustomResponse,
  findBestAcademicMatch,
  extractKeywords,
  precomputedKnowledge,
};
