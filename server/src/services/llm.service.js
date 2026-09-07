/**
 * llm.service.js
 * Abstraction layer for LLM API calls.
 */
const { generateCustomResponse } = require('./customLlm.engine');
const { completeWithFallback } = require('../config/llm');

const getProvider = () => process.env.LLM_PROVIDER || 'custom';

const chatDeepSeek = async (prompt, options = {}) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const messages = [
    ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
    ...(options.history || []),
    { role: 'user', content: prompt },
  ];
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'deepseek-chat',
      temperature: options.temperature ?? 0.7,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const chatPuter = async (prompt, options = {}) => {
  const { init, getAuthToken } = require('@heyputer/puter.js/src/init.cjs');
  const puter = init();
  const token = await getAuthToken();
  if (token && puter.setAuthToken) {
    puter.setAuthToken(token);
  }
  return puter.ai.chat(prompt, options);
};

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
  const provider = getProvider();

  if (provider === 'custom') return generateCustomResponse(prompt, options);
  if (provider === 'puter') return chatPuter(prompt, options);
  if (provider === 'deepseek') return chatDeepSeek(prompt, options);
  if (provider === 'gemini' || provider === 'groq') {
    return completeWithFallback([
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      ...(options.history || []),
      { role: 'user', content: prompt },
    ], options);
  }
  throw new Error(`LLM provider "${provider}" not yet implemented`);
};

/**
 * embed — generates an embedding vector for the given text.
 * @param {string} text
 * @returns {Promise<number[]>} 768-dim embedding
 */
const embed = async (text) => {
  if (getProvider() === 'gemini' && process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] } }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.embedding?.values) && data.embedding.values.length === 768) {
        return data.embedding.values;
      }
    }
  }
  const { generateLocalEmbedding } = require('./localEmbedding.service');
  return generateLocalEmbedding(text);
};

module.exports = { chat, chatDeepSeek, chatPuter, embed };
