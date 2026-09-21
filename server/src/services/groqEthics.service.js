const { chat } = require('./llm.service');

const classifyEthics = async ({ prompt, category }) => {
  const raw = await chat(
    `Is this student message requesting ${category}? Reply ONLY: VIOLATION or BENIGN\n\nStudent message:\n${prompt.slice(0, 4000)}`,
    {
      provider: 'groq',
      temperature: 0,
      systemPrompt: 'You are a strict ethics classifier. Reply with exactly one word: VIOLATION or BENIGN.',
    },
  );
  const decision = String(raw || '').trim().toUpperCase().startsWith('VIOLATION') ? 'VIOLATION' : 'BENIGN';
  return { decision, provider: 'groq' };
};

module.exports = { classifyEthics };
