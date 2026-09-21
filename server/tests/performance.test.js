const percentile = (values, p) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

const baseUrl = process.env.PERFORMANCE_BASE_URL;
const accessToken = process.env.PERFORMANCE_ACCESS_TOKEN;
const concurrency = Math.max(Number(process.env.PERFORMANCE_CONCURRENCY) || 10, 1);
const iterations = Math.max(Number(process.env.PERFORMANCE_ITERATIONS) || 20, concurrency);
const describeLoad = baseUrl && accessToken ? describe : describe.skip;

describeLoad('EPIC-09 peak AI performance', () => {
  const requests = [
    ['mcq', '/api/llm/mcq/generate', { topic: 'database normalization', subject: 'DBMS', count: 5 }],
    ['mock-test', '/api/llm/mock-test/generate', { topic: 'database normalization', subject: 'DBMS', count: 5 }],
    ['ai-tutor', '/api/llm/tutor/chat', { message: 'Explain database normalization briefly.' }],
  ];

  const runLoad = async (path, body) => {
    const durations = [];
    let completed = 0;
    const runOne = async () => {
      const started = performance.now();
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      durations.push(performance.now() - started);
      if (!response.ok) throw new Error(`${path} returned ${response.status}`);
      completed += 1;
    };
    while (completed < iterations) {
      await Promise.all(Array.from({ length: Math.min(concurrency, iterations - completed) }, runOne));
    }
    return { p95: percentile(durations, 95), samples: durations.length };
  };

  test.each(requests)('%s stays within the 3-second P95 budget', async (_name, path, body) => {
    const result = await runLoad(path, body);
    console.log(`[Performance] ${path}: P95=${result.p95.toFixed(0)}ms samples=${result.samples}`);
    expect(result.p95).toBeLessThanOrEqual(3000);
  }, 180000);
});

module.exports = { percentile };
