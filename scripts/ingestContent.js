/**
 * scripts/ingestContent.js
 * Ingests PDF/URL content into KnowledgeChunk collection for RAG.
 * Usage: node scripts/ingestContent.js --file ./docs/lecture.pdf --dept CS --subject DBMS
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { env }  = require('../server/src/config/env');

const KnowledgeChunk = require('../server/src/models/KnowledgeChunk');
// const { embed } = require('../server/src/services/llm.service'); // Uncomment in EPIC-04

const CHUNK_SIZE = 500; // characters per chunk

/**
 * chunkText — splits text into overlapping chunks for better retrieval.
 */
const chunkText = (text, size = CHUNK_SIZE, overlap = 50) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
};

const ingest = async () => {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const deptIdx = args.indexOf('--dept');
  const subjIdx = args.indexOf('--subject');

  if (fileIdx === -1) {
    console.error('Usage: node ingestContent.js --file <path> --dept <dept> --subject <subject>');
    process.exit(1);
  }

  const filePath = args[fileIdx + 1];
  const dept     = args[deptIdx + 1]  || 'General';
  const subject  = args[subjIdx + 1]  || 'General';

  await mongoose.connect(env.MONGO_URI, { dbName: env.DB_NAME });
  console.log(`[Ingest] Connected | file: ${filePath} | dept: ${dept} | subject: ${subject}`);

  // TODO: Parse PDF/URL content and call embed() in EPIC-04
  // For now this is a scaffold — real implementation added when LLM service is ready.
  console.log('[Ingest] ⚠️  LLM embedding not yet implemented (EPIC-04). Scaffold only.');

  await mongoose.disconnect();
};

ingest().catch((err) => {
  console.error('[Ingest] ❌ Failed:', err.message);
  process.exit(1);
});
