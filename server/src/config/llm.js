const AppError = require('../utils/AppError');

const getRequiredKey = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const parseResponse = async (response, provider) => {
  if (!response.ok) {
    const error = new AppError(`${provider} request failed with status ${response.status}`, response.status);
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const createGeminiClient = () => {
  const apiKey = getRequiredKey('GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return {
    async complete(messages, options = {}) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.filter((message) => message.role !== 'system').map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            systemInstruction: messages.find((message) => message.role === 'system')
              ? { parts: [{ text: messages.find((message) => message.role === 'system').content }] }
              : undefined,
            generationConfig: {
              temperature: options.temperature ?? 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      return parseResponse(response, 'Gemini');
    },
  };
};

const createGroqClient = () => {
  const apiKey = getRequiredKey('GROQ_API_KEY');
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return {
    async complete(messages, options = {}) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      return parseResponse(response, 'Groq');
    },
  };
};

const completeWithFallback = async (messages, options = {}) => {
  const gemini = options.gemini || createGeminiClient();
  const groq = options.groq || createGroqClient();
  try {
    return await gemini.complete(messages, options);
  } catch (error) {
    if (!error.retryable) throw error;
    return groq.complete(messages, options);
  }
};

module.exports = {
  createGeminiClient,
  createGroqClient,
  completeWithFallback,
};