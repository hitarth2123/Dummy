/**
 * vectorDb.js
 * MongoDB Atlas Vector Search client.
 *
 * Atlas Vector Search uses a special $vectorSearch aggregation stage.
 * The search index must be created in Atlas UI (instructions below).
 *
 * ── HOW TO CREATE THE VECTOR SEARCH INDEX IN ATLAS UI ────────────────────
 * 1. Go to your Atlas cluster → Browse Collections → ai_buddy.knowledgechunks
 * 2. Click "Search Indexes" tab → "Create Search Index"
 * 3. Choose "JSON Editor", select "Atlas Vector Search"
 * 4. Name it: vector_index
 * 5. Paste this JSON definition:
 *
 * {
 *   "fields": [
 *     {
 *       "type": "vector",
 *       "path": "embedding",
 *       "numDimensions": 768,
 *       "similarity": "cosine"
 *     },
 *     {
 *       "type": "filter",
 *       "path": "department"
 *     },
 *     {
 *       "type": "filter",
 *       "path": "subject"
 *     }
 *   ]
 * }
 *
 * 6. Click "Create" — index builds in ~1 minute.
 * ─────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const COLLECTION  = 'knowledgechunks';
const INDEX_NAME  = 'vector_index';
const DEFAULT_TOP_K = 5;

/**
 * vectorSearch — finds the most similar KnowledgeChunks for a given embedding.
 *
 * @param {number[]} queryEmbedding   - 768-dim query vector
 * @param {Object}  [filter={}]       - optional metadata filters e.g. { department, subject }
 * @param {number}  [topK=5]          - number of results to return
 * @returns {Promise<Array>}          - matched chunks with score
 */
const vectorSearch = async (queryEmbedding, filter = {}, topK = DEFAULT_TOP_K) => {
  const db = mongoose.connection.db;

  // Build the pre-filter for Atlas Vector Search
  const preFilter = {};
  if (filter.department) preFilter.department = { $eq: filter.department };
  if (filter.subject)    preFilter.subject    = { $eq: filter.subject };

  const pipeline = [
    {
      $vectorSearch: {
        index:         INDEX_NAME,
        path:          'embedding',
        queryVector:   queryEmbedding,
        numCandidates: topK * 10, // oversample for accuracy
        limit:         topK,
        ...(Object.keys(preFilter).length > 0 && { filter: preFilter }),
      },
    },
    {
      $project: {
        _id:             1,
        content:         1,
        source_document: 1,
        source_type:     1,
        department:      1,
        subject:         1,
        topic:           1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  return db.collection(COLLECTION).aggregate(pipeline).toArray();
};

/**
 * checkIndexExists — warns if the vector search index hasn't been created yet.
 * Call this once on server startup (non-blocking).
 */
const checkIndexExists = async () => {
  try {
    const db = mongoose.connection.db;
    const indexes = await db.collection(COLLECTION).listSearchIndexes().toArray();
    const found = indexes.some((idx) => idx.name === INDEX_NAME);

    if (!found) {
      console.warn(
        `[VectorDB] ⚠️  Atlas Vector Search index "${INDEX_NAME}" not found on collection "${COLLECTION}".` +
        '\n           Create it in Atlas UI → Browse Collections → knowledgechunks → Search Indexes.' +
        '\n           See server/src/config/vectorDb.js for the JSON definition.'
      );
    } else {
      const status = indexes.find((i) => i.name === INDEX_NAME)?.status;
      console.log(`[VectorDB] ✅ Vector search index "${INDEX_NAME}" found — status: ${status}`);
    }
  } catch {
    // listSearchIndexes not supported on very old drivers — silently skip
    console.log('[VectorDB] Vector search index check skipped (index check not supported on this driver version)');
  }
};

module.exports = { vectorSearch, checkIndexExists };
