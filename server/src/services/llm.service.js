/**
 * Groq-backed AI service for normal conversation and grounded answers.
 */
const { generateLocalEmbedding } = require('./localEmbedding.service');

const groqBaseUrl = () => (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const groqModel = () => process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const apinexBaseUrl = () => (process.env.APINEX_BASE_URL || 'https://api.apinex.ai/v1').replace(/\/$/, '');
const apinexModel = () => process.env.APINEX_MODEL || 'free/claude-sonnet-4.6';
const apinexApiKey = () => process.env.APINEX_API_KEY || process.env.apinex;
const groqApiKeys = () => [...new Set([
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  ...(process.env.GROQ_API_KEYS || '').split(','),
  process.env.GROQ_API_KEY,
  process.env.groq_api,
].map((key) => key?.trim()).filter(Boolean))].slice(0, 4);
const groqApiKey = () => groqApiKeys()[0];
const preferredModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const requestChat = (model, messages, temperature, apiKey) => fetch(`${groqBaseUrl()}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ model, messages, stream: false, temperature }),
});

const requestApinexChat = (model, messages, temperature, apiKey) => fetch(`${apinexBaseUrl()}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ model, messages, stream: false, temperature }),
});

const findAvailableModel = async (apiKey) => {
  const response = await fetch(`${groqBaseUrl()}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const models = (data.data || []).map((model) => model.id).filter(Boolean);
  return preferredModels.find((model) => models.includes(model)) || models[0] || null;
};

const chat = async (prompt, options = {}) => {
  const context = options.context ? `\n\nREFERENCE CONTEXT:\n${options.context}` : '';
  const systemPrompt = options.systemPrompt || 'You are AI Buddy, a helpful academic and coding assistant.';
  const messages = [
    { role: 'system', content: `${systemPrompt}${context}` },
    ...(options.history || []).filter((message) => message?.role && message?.content).slice(-12).map((message) => ({
      ...message,
      content: String(message.content).slice(0, 4000),
    })),
    { role: 'user', content: prompt },
  ];
  const useApinex = options.provider === 'apinex'
    || (!options.provider && !options.apiKey && apinexApiKey());
  const apiKey = options.apiKey || (useApinex ? apinexApiKey() : groqApiKey());
  if (!apiKey) {
    const missing = new Error(`${useApinex ? 'APINEX_API_KEY' : 'GROQ_API_KEY'} is not configured`);
    missing.statusCode = 503;
    throw missing;
  }
  const requestedModel = options.model || (useApinex ? apinexModel() : groqModel());
  let response;
  try {
    response = useApinex
      ? await requestApinexChat(requestedModel, messages, options.temperature ?? 0.2, apiKey)
      : await requestChat(requestedModel, messages, options.temperature ?? 0.2, apiKey);
    if (!useApinex && response.status === 404 && !options.model) {
      const availableModel = await findAvailableModel(apiKey);
      if (availableModel && availableModel !== requestedModel) {
        response = await requestChat(availableModel, messages, options.temperature ?? 0.2, apiKey);
      }
    }
  } catch (error) {
    const unavailable = new Error(
      `${useApinex ? 'Apinex' : 'Groq'} is unavailable: ${error.message}`
    );
    unavailable.statusCode = 503;
    throw unavailable;
  }
  if (!response.ok) {
    let details = '';
    try {
      const errorBody = await response.json();
      details = errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
    } catch {
      details = response.statusText || '';
    }
    throw new Error(
      `${useApinex ? 'Apinex' : 'Groq'} request failed with status ${response.status} for model ${requestedModel}`
      + (details ? `: ${details}` : '')
    );
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

/**
 * embed — generates an embedding vector for the given text.
 * @param {string} text
 * @returns {Promise<number[]>} 768-dim embedding
 */
const embed = async (text) => {
  return generateLocalEmbedding(text);
};

module.exports = { chat, embed, groqBaseUrl, groqModel, groqApiKeys };
