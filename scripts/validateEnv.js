#!/usr/bin/env node
/**
 * scripts/validateEnv.js
 * Pre-start CLI check — validates all required environment variables.
 * Run before starting the server: `node scripts/validateEnv.js`
 *
 * Exit code 0 → all vars valid
 * Exit code 1 → one or more vars missing or invalid (names are printed)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('5000'),

  MONGO_URI: z.string({ required_error: 'MONGO_URI is required' }).url('MONGO_URI must be a valid URL'),
  DB_NAME: z.string({ required_error: 'DB_NAME is required' }).min(1),

  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string({ required_error: 'JWT_REFRESH_SECRET is required' }).min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  MAILER_HOST: z.string({ required_error: 'MAILER_HOST is required' }),
  MAILER_PORT: z.string().regex(/^\d+$/).default('587'),
  MAILER_USER: z.string({ required_error: 'MAILER_USER is required' }),
  MAILER_PASS: z.string({ required_error: 'MAILER_PASS is required' }),
  MAILER_FROM: z.string({ required_error: 'MAILER_FROM is required' }),

  LLM_PROVIDER: z.enum(['openai', 'gemini', 'ollama']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),

  VECTOR_DB_PROVIDER: z.enum(['pinecone', 'qdrant', 'weaviate', 'mongodb']).default('mongodb'),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  QDRANT_URL: z.string().url().optional().or(z.literal('')),

  CLIENT_URL: z.string({ required_error: 'CLIENT_URL is required' }).url(),
});

const result = envSchema.safeParse(process.env);

if (result.success) {
  console.log('\n✅ Environment validation passed — all required variables are set.\n');
  process.exit(0);
} else {
  console.error('\n❌ Environment validation FAILED. Missing or invalid variables:\n');
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.') || 'unknown';
    console.error(`  • ${path}: ${issue.message}`);
  });
  console.error('\nAdd or fix the above variables in your .env file.\n');
  process.exit(1);
}
