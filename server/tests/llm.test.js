const { chat, embed } = require('../src/services/llm.service');
const { isCodingQuery, searchDevDocs } = require('../src/services/devdocs.service');
const { classifyQuestion, shouldCapture } = require('../src/services/knowledgeCapture.service');
const { datasetPath } = require('../src/services/knowledgeCapture.service');

describe('Local AI services', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test('sends authenticated chat requests to Groq', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hello from Groq' } }] }),
    });

    await expect(chat('Hello')).resolves.toBe('Hello from Groq');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-groq-key' }),
      })
    );
  });

  test('uses the existing 768-dimensional local index embedding', async () => {
    await expect(embed('normalization')).resolves.toHaveLength(768);
  });

  test('identifies coding questions and tolerates unavailable DevDocs', async () => {
    expect(isCodingQuery('How do I use the JavaScript fetch API?')).toBe(true);
    global.fetch.mockRejectedValue(new Error('DevDocs is unavailable'));
    await expect(searchDevDocs('How do I use the JavaScript fetch API?')).resolves.toEqual({ context: '', sources: [] });
  });

  test('classifies questions into topic and subtopic dataset metadata', () => {
    expect(classifyQuestion('Explain the difference between 1NF and 2NF in DBMS')).toEqual({
      department: 'General',
      subject: 'DBMS',
      topic: 'Normalization',
      subtopic: '1NF',
    });
    expect(shouldCapture('Explain the difference between 1NF and 2NF in DBMS')).toBe(true);
    expect(shouldCapture('Hello')).toBe(false);
    expect(classifyQuestion('What is supernet in quantum')).toMatchObject({
      topic: 'Quantum',
      subtopic: 'Supernet',
    });
    expect(datasetPath).toContain('/server/src/dataset/generatedKnowledge.json');
  });
});
