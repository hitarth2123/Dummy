/**
 * server/src/services/localEmbedding.service.js
 * 100% Offline, Deterministic 768-Dimensional Vector Embedding Generator.
 *
 * Produces normalized float32 vectors (768 dimensions) matching MongoDB Atlas
 * Vector Search and KnowledgeChunk schema requirements without any external API calls.
 */

const VECTOR_DIMENSIONS = 768;

/**
 * FNV-1a based 32-bit hash with seed support.
 */
const fnv1a = (str, seed = 0x811c9dc5) => {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * Tokenize and normalize text into words and subword character n-grams.
 * @param {string} text
 * @returns {string[]} tokens
 */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);

  const tokens = [...words];
  // Add character 3-grams for subword semantic capture
  words.forEach((w) => {
    if (w.length >= 3) {
      for (let i = 0; i <= w.length - 3; i++) {
        tokens.push(w.slice(i, i + 3));
      }
    }
  });

  return tokens;
};

/**
 * generateLocalEmbedding — converts any text into a 768-dim normalized float32 vector.
 *
 * @param {string} text
 * @returns {number[]} 768-dimension L2-normalized vector
 */
const generateLocalEmbedding = (text) => {
  const vector = new Float32Array(VECTOR_DIMENSIONS);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    // Return unit vector along first dimension if empty
    vector[0] = 1.0;
    return Array.from(vector);
  }

  // Frequency mapping for term weighting
  const freq = {};
  tokens.forEach((t) => {
    freq[t] = (freq[t] || 0) + 1;
  });

  // Project tokens across the 768 dimensions using multiple hash seeds
  Object.keys(freq).forEach((token) => {
    const weight = Math.log(1 + freq[token]);

    // Primary dimension
    const h1 = fnv1a(token, 0x811c9dc5);
    const dim1 = h1 % VECTOR_DIMENSIONS;
    const sign1 = (h1 & 0x80000000) ? -1 : 1;
    vector[dim1] += sign1 * weight;

    // Secondary dimension
    const h2 = fnv1a(token, 0x9e3779b9);
    const dim2 = h2 % VECTOR_DIMENSIONS;
    const sign2 = (h2 & 0x80000000) ? -1 : 1;
    vector[dim2] += sign2 * (weight * 0.75);

    // Tertiary dimension
    const h3 = fnv1a(token, 0x6c62272e);
    const dim3 = h3 % VECTOR_DIMENSIONS;
    const sign3 = (h3 & 0x80000000) ? -1 : 1;
    vector[dim3] += sign3 * (weight * 0.5);
  });

  // L2 Normalization (Euclidean norm) so dot product equals cosine similarity
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    sumSq += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSq) || 1.0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    vector[i] = Number((vector[i] / norm).toFixed(6));
  }

  return Array.from(vector);
};

/**
 * cosineSimilarity — helper to compute similarity between two 768-dim vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} cosine similarity (-1 to 1)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
};

module.exports = {
  VECTOR_DIMENSIONS,
  generateLocalEmbedding,
  cosineSimilarity,
};
