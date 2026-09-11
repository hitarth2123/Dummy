jest.mock('@heyputer/puter.js/src/init.cjs', () => ({
  init: jest.fn(() => ({
    setAuthToken: jest.fn(),
    ai: {
      chat: jest.fn().mockResolvedValue('Puter Gemini answer'),
    },
  })),
  getAuthToken: jest.fn().mockResolvedValue('mock-token'),
}), { virtual: true });

const { chatDeepSeek, chatPuter, chat } = require('../src/services/llm.service');
const { createGeminiClient, completeWithFallback } = require('../src/config/llm');

describe('LLM Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('throws error when DEEPSEEK_API_KEY is missing', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    await expect(chatDeepSeek('test')).rejects.toThrow('DEEPSEEK_API_KEY is not set');
  });

  test('sends formatted request to DeepSeek endpoint', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key';
    process.env.DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

    const mockResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'DeepSeek response content',
          },
        },
      ],
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });
    global.fetch = mockFetch;

    const result = await chatDeepSeek('Hello', {
      systemPrompt: 'You are an AI assistant',
      temperature: 0.5,
    });

    expect(result).toBe('DeepSeek response content');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        },
      })
    );

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.model).toBe('deepseek-chat');
    expect(sentBody.temperature).toBe(0.5);
    expect(sentBody.messages).toEqual([
      { role: 'system', content: 'You are an AI assistant' },
      { role: 'user', content: 'Hello' },
    ]);
  });

  test('chat router routes to custom LLM by default and answers academic topics', async () => {
    delete process.env.LLM_PROVIDER;
    const res = await chat('Explain Normalization in DBMS');
    expect(res).toContain('Normalization');
    expect(res).toContain('1NF');
  });

  test('custom LLM answers conversational greetings', async () => {
    process.env.LLM_PROVIDER = 'custom';
    const res = await chat('Hello AI Buddy');
    expect(res).toContain('AI Buddy');
  });

  test('custom LLM generates MCQs on request', async () => {
    process.env.LLM_PROVIDER = 'custom';
    const res = await chat('Give me an MCQ on Operating Systems CPU scheduling');
    expect(res).toContain('Practice MCQ');
    expect(res).toContain('Options:');
  });

  test('embed generates 768-dim vector locally', async () => {
    process.env.LLM_PROVIDER = 'custom';
    const { embed } = require('../src/services/llm.service');
    const vec = await embed('test academic query');
    expect(vec.length).toBe(768);
  });

  test('chat router routes to puter when configured', async () => {
    process.env.LLM_PROVIDER = 'puter';
    const res = await chat('What is AI?');
    expect(res).toBe('Puter Gemini answer');
  });

  test('falls back from Gemini 429 to Groq', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.GROQ_API_KEY = 'groq-test-key';
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ choices: [{ message: { content: '{"answer":"groq"}' } }] }),
      });

    const result = await completeWithFallback([{ role: 'user', content: 'test' }]);

    expect(result).toBe('{"answer":"groq"}');
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer groq-test-key' }) })
    );
  });

  test('fails clearly when a provider key is missing', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => createGeminiClient()).toThrow('GEMINI_API_KEY is not configured');
  });
});
