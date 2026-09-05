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
});
