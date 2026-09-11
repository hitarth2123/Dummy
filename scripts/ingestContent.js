require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const { env } = require('../server/src/config/env');
const KnowledgeChunk = require('../server/src/models/KnowledgeChunk');
const { embed } = require('../server/src/services/llm.service');

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;

const chunkText = (text) => {
  const chunks = [];
  for (let start = 0; start < text.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const content = text.slice(start, start + CHUNK_SIZE).trim();
    if (content) chunks.push(content);
  }
  return chunks;
};

const readContent = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  if (path.extname(filePath).toLowerCase() === '.pdf') {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }
  if (path.extname(filePath).toLowerCase() === '.json') {
    return JSON.stringify(JSON.parse(buffer.toString('utf8')), null, 2);
  }
  return buffer.toString('utf8');
};

const getArg = (args, name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};

const resolveInputPath = (filePath) => {
  const candidates = [
    path.resolve(process.cwd(), filePath),
    path.resolve(__dirname, '..', filePath),
  ];
  return candidates.find((candidate) => {
    try {
      require('fs').accessSync(candidate);
      return true;
    } catch {
      return false;
    }
  }) || candidates[0];
};

const ingest = async () => {
  const args = process.argv.slice(2);
  const filePath = getArg(args, '--file');
  if (!filePath) throw new Error('Usage: node scripts/ingestContent.js --file <path> --dept <department> --subject <subject>');

  const resolvedFilePath = resolveInputPath(filePath);
  const department = getArg(args, '--dept', 'General');
  const subject = getArg(args, '--subject', 'General');
  const topic = getArg(args, '--topic', path.basename(resolvedFilePath, path.extname(resolvedFilePath)));
  const sourceType = path.extname(resolvedFilePath).toLowerCase() === '.pdf' ? 'pdf' : 'manual';
  const content = await readContent(resolvedFilePath);
  const chunks = chunkText(content);
  if (!chunks.length) throw new Error('The source document did not contain readable text.');

  await mongoose.connect(env.MONGO_URI, { dbName: env.DB_NAME });
  console.log(`[Ingest] Connected | ${resolvedFilePath} | ${chunks.length} chunks`);

  const documents = [];
  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`[Ingest] Embedding chunk ${index + 1}/${chunks.length}`);
    documents.push({
      content: chunks[index],
      embedding: await embed(chunks[index]),
      source_document: path.basename(resolvedFilePath),
      source_type: sourceType,
      department,
      subject,
      topic,
      chunk_index: index,
      token_count: chunks[index].split(/\s+/).length,
      metadata: { absolute_path: resolvedFilePath },
    });
  }

  await KnowledgeChunk.insertMany(documents);
  console.log(`[Ingest] Stored ${documents.length} chunks in ${env.DB_NAME}.knowledgechunks`);
  await mongoose.disconnect();
};

ingest().catch(async (error) => {
  console.error(`[Ingest] Failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

module.exports = { chunkText, readContent };
