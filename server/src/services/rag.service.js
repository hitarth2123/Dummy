const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embed } = require('./llm.service');
const { vectorSearch } = require('../config/vectorDb');
const { cosineSimilarity } = require('./localEmbedding.service');

const DEFAULT_TOP_K = 5;

const toCitation = (chunk) => ({
  chunk_id: String(chunk._id || chunk.id),
  source_document: chunk.source_document,
  source_type: chunk.source_type,
  department: chunk.department,
  subject: chunk.subject,
  topic: chunk.topic,
  score: chunk.score,
});

const assembleContext = (chunks) => chunks.map((chunk, index) => (
  `[Source ${index + 1}] ${chunk.source_document || 'Knowledge base'} `
  + `(${chunk.department || 'all departments'} / ${chunk.subject || 'general'})\n${chunk.content}`
)).join('\n\n');

const lexicalFallback = async (query, filter, topK) => {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const conditions = {};
  if (filter.department) conditions.department = filter.department;
  if (filter.subject) conditions.subject = filter.subject;
  const queryResult = KnowledgeChunk.find(conditions);
  const documents = await (queryResult.lean ? queryResult.lean() : queryResult);
  return documents.map((chunk) => ({
    ...chunk,
    score: queryTerms.reduce((score, term) => score + (chunk.content.toLowerCase().includes(term) ? 1 : 0), 0),
  })).sort((left, right) => right.score - left.score).slice(0, topK);
};

const searchKnowledge = async (query, options = {}) => {
  if (!query || typeof query !== 'string') throw new TypeError('A text query is required');
  const topK = Math.min(options.topK || DEFAULT_TOP_K, 20);
  const filter = {
    department: options.department || options.dept,
    subject: options.subject,
  };
  const queryEmbedding = await embed(query);
  let chunks;
  try {
    chunks = await vectorSearch(queryEmbedding, filter, topK);
  } catch (error) {
    chunks = await lexicalFallback(query, filter, topK);
    chunks.vectorSearchError = error.message;
  }

  return {
    query,
    chunks,
    chunkIds: chunks.map((chunk) => String(chunk._id || chunk.id)),
    context: assembleContext(chunks),
    rag_sources: chunks.map(toCitation),
    queryEmbedding,
  };
};

const retrieveRelevantChunks = searchKnowledge;

module.exports = { searchKnowledge, retrieveRelevantChunks, assembleContext, toCitation, lexicalFallback };