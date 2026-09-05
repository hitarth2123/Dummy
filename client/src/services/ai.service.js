/**
 * client/src/services/ai.service.js
 * Browser-side AI service using Puter.js.
 * Provides free, unlimited access to Gemini, DeepSeek, Claude, and GPT models
 * with zero API keys and zero backend configuration needed.
 */
import { puter } from '@heyputer/puter.js';

/**
 * Available Puter AI models
 */
export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', provider: 'Google' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', provider: 'DeepSeek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', provider: 'DeepSeek' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

/**
 * Get the Puter instance (from window.puter CDN or npm module fallback)
 */
export const getPuter = () => {
  if (typeof window !== 'undefined' && window.puter) {
    return window.puter;
  }
  return puter;
};

/**
 * chatWithPuter — sends a prompt to Puter.js AI and returns the response text.
 *
 * @param {string} prompt - User message or prompt
 * @param {Object} [options]
 * @param {string} [options.model='gemini-2.5-flash'] - Model name
 * @param {boolean} [options.stream=false] - Stream response chunks
 * @param {Function} [options.onChunk] - Callback for streamed chunks
 * @returns {Promise<string>}
 */
export const chatWithPuter = async (prompt, options = {}) => {
  const p = getPuter();
  const model = options.model || 'gemini-2.5-flash';

  if (options.stream && typeof options.onChunk === 'function') {
    const stream = await p.ai.chat(prompt, { model, stream: true });
    let fullText = '';
    for await (const part of stream) {
      if (part?.text) {
        fullText += part.text;
        options.onChunk(part.text, fullText);
      }
    }
    return fullText;
  }

  const response = await p.ai.chat(prompt, { model });
  // Puter returns a string or an object with text
  if (typeof response === 'string') return response;
  if (response?.text) return response.text;
  if (response?.message?.content) return response.message.content;
  return JSON.stringify(response);
};

/**
 * textToSpeech — convert text to audio using Puter.js Gemini TTS.
 * @param {string} text
 * @param {Object} [options]
 * @returns {Promise<HTMLAudioElement>}
 */
export const textToSpeech = async (text, options = {}) => {
  const p = getPuter();
  return p.ai.txt2speech(text, {
    provider: options.provider || 'gemini',
    model: options.model || 'gemini-2.5-flash-preview-tts',
    voice: options.voice || 'Puck',
    instructions: options.instructions || 'Speak in a friendly, clear academic tone.',
  });
};

export default {
  AVAILABLE_MODELS,
  getPuter,
  chatWithPuter,
  textToSpeech,
};
