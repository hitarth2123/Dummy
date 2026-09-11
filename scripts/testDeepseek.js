#!/usr/bin/env node
/**
 * scripts/testDeepseek.js
 * Quick health check script for DeepSeek API connectivity.
 *
 * Usage:
 *   node scripts/testDeepseek.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const { chat } = require('../server/src/services/llm.service');

async function healthCheck() {
  console.log('────────────────────────────────────────');
  console.log('        DeepSeek API Health Check       ');
  console.log('────────────────────────────────────────');
  console.log(' Provider :', process.env.LLM_PROVIDER);
  console.log(' Model    :', process.env.LLM_MODEL);
  console.log(' Endpoint :', process.env.DEEPSEEK_BASE_URL);

  const key = process.env.DEEPSEEK_API_KEY || '';
  if (!key) {
    console.log(' API Key  : ❌ Not set in server/.env');
    process.exit(1);
  }

  const masked = key.length > 10 ? `${key.substring(0, 7)}...${key.slice(-4)}` : '***';
  console.log(' API Key  :', masked);
  console.log('────────────────────────────────────────\n');

  try {
    console.log('⏳ Sending test prompt to DeepSeek API...');
    const start = Date.now();
    const res = await chat('Respond with a short greeting and confirm you are DeepSeek.');
    const latency = Date.now() - start;

    console.log('\n✅ Status: HEALTHY');
    console.log(`⏱️ Latency: ${latency}ms`);
    console.log(`💬 Response:\n${res}\n`);
    process.exit(0);
  } catch (err) {
    console.log('\n❌ Status: UNHEALTHY');
    console.error(`⚠️ Error: ${err.message}\n`);
    process.exit(1);
  }
}

healthCheck();
