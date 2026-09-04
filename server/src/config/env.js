const { z } = require('zod');

/**
 * Environment Variable Validation — EPIC-02
 * Uses Zod to validate all required .env vars at startup.
 * If any required var is missing or invalid, the process exits
 * immediately with a clear error naming the offending variable.
 */
const envSchema = z.object({
  // ── Node ──────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .default('5000'),

  // ── MongoDB ───────────────────────────────────────────────────────────────
  MONGO_URI: z
    .string({ required_error: 'MONGO_URI is required' })
    .url('MONGO_URI must be a valid URL'),
  DB_NAME: z
    .string({ required_error: 'DB_NAME is required' })
    .min(1, 'DB_NAME must not be empty'),

  // ── JWT ───────────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string({ required_error: 'JWT_REFRESH_SECRET is required' })
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── Email / Mailer ────────────────────────────────────────────────────────
  MAILER_HOST: z.string({ required_error: 'MAILER_HOST is required' }),
  MAILER_PORT: z
    .string()
    .regex(/^\d+$/, 'MAILER_PORT must be a number')
    .default('587'),
  MAILER_USER: z.string({ required_error: 'MAILER_USER is required' }),
  MAILER_PASS: z.string({ required_error: 'MAILER_PASS is required' }),
  MAILER_FROM: z.string({ required_error: 'MAILER_FROM is required' }),

  // ── LLM ───────────────────────────────────────────────────────────────────
  LLM_PROVIDER: z
    .enum(['openai', 'gemini', 'ollama'])
    .default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),

  // ── Vector DB ─────────────────────────────────────────────────────────────
  VECTOR_DB_PROVIDER: z
    .enum(['pinecone', 'qdrant', 'weaviate', 'mongodb'])
    .default('mongodb'),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  QDRANT_URL: z.string().url().optional().or(z.literal('')),

  // ── Frontend ──────────────────────────────────────────────────────────────
  CLIENT_URL: z
    .string({ required_error: 'CLIENT_URL is required' })
    .url('CLIENT_URL must be a valid URL'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const issues = parseResult.error.issues;

  console.error('\n[ENV] ❌ Environment variable validation failed:\n');
  issues.forEach((issue) => {
    const path = issue.path.join('.') || '(unknown)';
    console.error(`  • ${path}: ${issue.message}`);
  });
  console.error('\nFix the above variables in your .env file and restart.\n');

  process.exit(1);
}

/** Validated, typed environment object — import this everywhere */
const env = parseResult.data;

module.exports = { env };
