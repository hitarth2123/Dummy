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
  MAILER_HOST: z.string().optional(),
  MAILER_PORT: z
    .string()
    .regex(/^\d+$/, 'MAILER_PORT must be a number')
    .default('587'),
  MAILER_USER: z.string().optional(),
  MAILER_PASS: z.string().optional(),
  MAILER_FROM: z.string().optional(),
  MAILER_STRICT_STARTUP: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // ── AI services ───────────────────────────────────────────────────────────
  GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_API_KEYS: z.string().optional(),
  GROQ_API_KEY_1: z.string().optional(),
  GROQ_API_KEY_2: z.string().optional(),
  GROQ_API_KEY_3: z.string().optional(),
  GROQ_API_KEY_4: z.string().optional(),
  APINEX_BASE_URL: z.string().url().default('https://api.apinex.ai/v1'),
  APINEX_MODEL: z.string().default('free/claude-sonnet-4.6'),
  APINEX_API_KEY: z.string().optional(),
  ETHICS_LAYER2_THRESHOLD: z.string().regex(/^0(?:\.\d+)?|1(?:\.0+)?$/, 'ETHICS_LAYER2_THRESHOLD must be between 0 and 1').default('0.75'),
  REDIS_URL: z.string().url().optional(),
  DEVDOCS_BASE_URL: z.string().url().default('http://127.0.0.1:9292'),

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

  // Local development login. Never enable this mode in production.
  DEV_LOGIN_ENABLED: z.enum(['true', 'false']).default('true'),
  DEV_LOGIN_EMAIL: z.string().email().optional(),

  // Institutional SSO (DEP-002)
  SSO_CLIENT_ID: z.string().optional(),
  SSO_CLIENT_SECRET: z.string().optional(),
  SSO_TOKEN_URL: z.string().url().optional(),
  SSO_USERINFO_URL: z.string().url().optional(),
  SSO_REDIRECT_URI: z.string().url().optional(),
  SEED_MODE: z.enum(['true', 'false']).default('false'),
}).superRefine((data, ctx) => {
  if (data.SEED_MODE === 'true') return;

  const requiredAlternatives = [
    ['SMTP_HOST', data.SMTP_HOST, data.MAILER_HOST],
    ['SMTP_USER', data.SMTP_USER, data.MAILER_USER],
    ['SMTP_PASS', data.SMTP_PASS, data.MAILER_PASS],
    ['SMTP_FROM', data.SMTP_FROM, data.MAILER_FROM],
  ];
  requiredAlternatives.forEach(([name, primary, legacy]) => {
    if (!primary && !legacy) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [name], message: `${name} is required` });
    }
  });
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
