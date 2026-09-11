jest.mock('../src/services/llm.service', () => ({
  embed: jest.fn().mockResolvedValue(Array(768).fill(0.1)),
  chat: jest.fn().mockResolvedValue('{"invalid":true}'),
}));

jest.mock('../src/config/vectorDb', () => ({
  vectorSearch: jest.fn().mockResolvedValue([
    {
      _id: 'chunk-normalization',
      content: 'Normalization reduces database redundancy using 1NF, 2NF, and 3NF.',
      source_document: 'dbms-lecture.pdf',
      source_type: 'pdf',
      department: 'Computer Science',
      subject: 'DBMS',
      topic: 'Normalization',
      score: 0.94,
    },
  ]),
}));

const { searchKnowledge } = require('../src/services/rag.service');
const { generateMcqSet, difficultyPlan } = require('../src/services/mcq.service');

describe('RAG service', () => {
  test('returns relevant chunk IDs, assembled context, and citations', async () => {
    const result = await searchKnowledge('Explain normalization in DBMS', {
      department: 'Computer Science',
      subject: 'DBMS',
    });

    expect(result.chunkIds).toEqual(['chunk-normalization']);
    expect(result.context).toContain('1NF');
    expect(result.rag_sources[0]).toMatchObject({
      chunk_id: 'chunk-normalization',
      source_document: 'dbms-lecture.pdf',
    });
  });
});

describe('MCQ service', () => {
  test('creates the requested 40/40/20 difficulty plan', () => {
    expect(difficultyPlan(10)).toEqual([
      'easy', 'easy', 'easy', 'easy',
      'medium', 'medium', 'medium', 'medium',
      'hard', 'hard',
    ]);
  });

  test('falls back to valid cited MCQs when model JSON is malformed', async () => {
    const result = await generateMcqSet({ topic: 'Normalization', count: 5, department: 'Computer Science' });

    expect(result.questions).toHaveLength(5);
    expect(result.questions.every((question) => question.rag_sources.length > 0)).toBe(true);
    expect(result.questions.map((question) => question.difficulty)).toEqual([
      'easy', 'easy', 'medium', 'medium', 'hard',
    ]);
  });
});
