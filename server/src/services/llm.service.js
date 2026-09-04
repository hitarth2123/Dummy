/**
 * llm.service.js
 * Abstraction layer for LLM API calls.
 * Supports OpenAI, Gemini, and Ollama based on LLM_PROVIDER env var.
 */
const { env } = require('../config/env');

/**
 * chat — sends a prompt to the configured LLM and returns the response text.
 * @param {string} prompt
 * @param {Object} [options]
 * @param {string} [options.model]
 * @param {number} [options.temperature]
 * @param {Array}  [options.history]     - conversation history for multi-turn
 * @returns {Promise<string>}
 */
const chat = async (prompt, options = {}) => {
  const provider = env.LLM_PROVIDER;

  // TODO: implement per-provider logic in EPIC-04
  throw new Error(`LLM provider "${provider}" not yet implemented`);
};

/**
 * embed — generates an embedding vector for the given text.
 * @param {string} text
 * @returns {Promise<number[]>} 768-dim embedding
 */
const embed = async (text) => {
  // TODO: implement embedding calls in EPIC-04
  throw new Error('Embedding not yet implemented');
};

module.exports = { chat, embed };
