/**
 * scripts/validateIngestion.js
 * Post-ingestion validation:
 *  1. Logs chunk counts per department/subject as a table
 *  2. Runs one test vector-search query using MongoDB Atlas $vectorSearch
 *
 * Usage: node scripts/validateIngestion.js [--query "your test query text"]
 *
 * Requires GEMINI_API_KEY for the test embedding and MONGO_URI for DB access.
 *
 * EPIC-04 — T6, T7
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const mongoose          = require('mongoose');
const KnowledgeChunk    = require('../server/src/models/KnowledgeChunk');
const { embedText }     = require('../server/src/services/embedding.service');

const MONGO_URI  = process.env.MONGO_URI;
const DB_NAME    = process.env.DB_NAME || 'ai_buddy';

// Atlas vector search index name (must be created in Atlas UI / CLI)
const VECTOR_INDEX = process.env.VECTOR_SEARCH_INDEX || 'vector_index';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Chunk-count report
// ─────────────────────────────────────────────────────────────────────────────

const reportChunkCounts = async () => {
  const rows = await KnowledgeChunk.aggregate([
    {
      $group: {
        _id: { department: '$department', subject: '$subject' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.department': 1, '_id.subject': 1 } },
  ]);

  if (rows.length === 0) {
    console.warn('[Validate] ⚠️  No KnowledgeChunk documents found in the database.');
    return 0;
  }

  // Pretty-print as a table
  console.log('\n[Validate] ── Chunk counts per department / subject ──\n');
  const col1 = 20;
  const col2 = 25;
  const col3 = 10;
  const header =
    'Department'.padEnd(col1) +
    'Subject'.padEnd(col2) +
    'Chunks'.padStart(col3);
  const sep = '─'.repeat(col1 + col2 + col3);

  console.log(header);
  console.log(sep);

  let total = 0;
  for (const row of rows) {
    const dept    = (row._id.department || 'Unknown').padEnd(col1);
    const subject = (row._id.subject    || 'Unknown').padEnd(col2);
    const count   = String(row.count).padStart(col3);
    console.log(`${dept}${subject}${count}`);
    total += row.count;
  }

  console.log(sep);
  console.log(`${'TOTAL'.padEnd(col1 + col2)}${String(total).padStart(col3)}`);
  console.log();

  return total;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Test vector search
// ─────────────────────────────────────────────────────────────────────────────

const testVectorSearch = async (queryText) => {
  console.log(`[Validate] ── Vector search test ──`);
  console.log(`[Validate] Query: "${queryText}"\n`);

  let queryVector;
  try {
    queryVector = await embedText(queryText);
    console.log(`[Validate] Embedding generated (${queryVector.length}-dim)`);
  } catch (err) {
    console.error(`[Validate] ❌ Failed to embed query: ${err.message}`);
    console.warn('[Validate] Skipping vector search test (no GEMINI_API_KEY or API error).');
    return false;
  }

  // Atlas $vectorSearch requires an Atlas Search index named VECTOR_INDEX
  // with field "embedding" configured as knnVector with 768 dimensions.
  let results;
  try {
    results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index:       VECTOR_INDEX,
          path:        'embedding',
          queryVector: queryVector,
          numCandidates: 50,
          limit:         5,
        },
      },
      {
        $project: {
          _id:        1,
          department: 1,
          subject:    1,
          topic:      1,
          score:      { $meta: 'vectorSearchScore' },
          snippet:    { $substr: ['$content', 0, 120] },
        },
      },
    ]);
  } catch (err) {
    // $vectorSearch only works on Atlas — fallback to simple text scan for local dev
    if (err.message.includes('$vectorSearch') || err.message.includes('unknown operator')) {
      console.warn('[Validate] ⚠️  $vectorSearch not available (likely local MongoDB).');
      console.warn('[Validate]    Falling back to simple content regex match for local dev.\n');

      const words = queryText.split(/\s+/).slice(0, 3).join('|');
      results = await KnowledgeChunk.find(
        { content: { $regex: words, $options: 'i' } },
        { department: 1, subject: 1, topic: 1, content: 1 }
      ).limit(5).lean();
    } else {
      throw err;
    }
  }

  if (!results || results.length === 0) {
    console.warn('[Validate] ⚠️  Vector search returned 0 results. Ensure chunks have been ingested.');
    return false;
  }

  console.log(`[Validate] Top ${results.length} result(s):\n`);
  results.forEach((r, i) => {
    const score = r.score != null ? ` (score: ${r.score.toFixed(4)})` : '';
    console.log(`  ${i + 1}. [${r.department}/${r.subject}/${r.topic || '—'}]${score}`);
    console.log(`     "${(r.snippet || (r.content || '').slice(0, 120)).trim()}..."\n`);
  });

  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const main = async () => {
  if (!MONGO_URI) {
    console.error('[Validate] ❌ MONGO_URI is not set. Check server/.env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log('[Validate] Connected to MongoDB\n');

  const total = await reportChunkCounts();

  // Default test query or CLI override
  const queryArg  = process.argv.indexOf('--query');
  const queryText = queryArg !== -1
    ? process.argv[queryArg + 1]
    : 'Explain the concept of normalization in database management';

  const searchOk = await testVectorSearch(queryText);

  await mongoose.disconnect();

  if (total === 0) {
    console.error('\n[Validate] ❌ Validation FAILED — no chunks in DB.');
    process.exit(1);
  }

  if (!searchOk) {
    console.warn('\n[Validate] ⚠️  Vector search test could not be confirmed.');
  } else {
    console.log('[Validate] ✅ Validation PASSED');
  }
};

main().catch((err) => {
  console.error('[Validate] ❌ Fatal:', err.message);
  process.exit(1);
});
