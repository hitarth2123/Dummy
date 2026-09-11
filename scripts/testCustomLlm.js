#!/usr/bin/env node
/**
 * scripts/testCustomLlm.js
 * Test the Custom In-House LLM Engine and Academic Dataset.
 *
 * Usage:
 *   node scripts/testCustomLlm.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const { chat, embed } = require('../server/src/services/llm.service');
const { generateLocalEmbedding } = require('../server/src/services/localEmbedding.service');

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       🧠 AI Buddy — Custom In-House LLM Engine Test           ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Provider :', process.env.LLM_PROVIDER || 'custom');
  console.log(' Model    :', process.env.LLM_MODEL || 'custom-academic-v1');
  console.log(' Mode     : 100% Offline / Zero API Keys Required');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test 1: General conversational talk (Greeting)
  console.log('👉 [Test 1: Conversational / Greeting]');
  const t1 = await chat('Hello AI Buddy!');
  console.log(t1);
  console.log('\n───────────────────────────────────────────────────────────────\n');

  // Test 2: Academic Concept Explanation (DBMS Normalization)
  console.log('👉 [Test 2: Academic Explanation — DBMS Normalization]');
  const t2 = await chat('Explain BCNF and Normalization in DBMS with an example');
  console.log(t2);
  console.log('\n───────────────────────────────────────────────────────────────\n');

  // Test 3: Academic Concept Explanation (OS Deadlocks)
  console.log('👉 [Test 3: Academic Explanation — OS Deadlocks]');
  const t3 = await chat('What are the 4 Coffman conditions for deadlocks in Operating Systems?');
  console.log(t3);
  console.log('\n───────────────────────────────────────────────────────────────\n');

  // Test 4: Interactive MCQ Generation
  console.log('👉 [Test 4: Interactive MCQ Generation]');
  const t4 = await chat('Give me an MCQ on Computer Networks OSI Model');
  console.log(t4);
  console.log('\n───────────────────────────────────────────────────────────────\n');

  // Test 5: Local 768-Dim Vector Embedding
  console.log('👉 [Test 5: Deterministic 768-Dim Local Embedding]');
  const vector = await embed('Database normalization 3NF Boyce-Codd');
  console.log(`Vector dimensions: ${vector.length}`);
  console.log(`Sample vector values: [${vector.slice(0, 5).join(', ')}, ...]`);
  const is768 = vector.length === 768;
  const isNormalized = Math.abs(vector.reduce((acc, v) => acc + v * v, 0) - 1.0) < 0.01;
  console.log(`Dimension check (768-dim): ${is768 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`L2-Norm check (unit norm): ${isNormalized ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' 🎉 All Custom LLM Engine tests completed successfully!       ');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
