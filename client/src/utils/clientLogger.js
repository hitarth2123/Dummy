const enabled = import.meta.env.DEV || import.meta.env.VITE_API_LOGGING === 'true';

const redact = (value, depth = 0) => {
  if (depth > 2 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => redact(item, depth + 1));
  if (typeof value !== 'object') return value;

  const sensitive = new Set(['password', 'password_hash', 'token', 'accessToken', 'refreshToken', 'authorization']);
  return Object.fromEntries(Object.entries(value).slice(0, 20).map(([key, item]) => [
    key,
    sensitive.has(key) ? '[REDACTED]' : redact(item, depth + 1),
  ]));
};

const outputSummary = (value) => {
  if (value === undefined) return undefined;
  const output = typeof value === 'string' ? value : JSON.stringify(redact(value));
  return output.length > 500 ? `${output.slice(0, 500)}...[truncated]` : output;
};

const clientLogger = {
  info(message, context = {}) {
    if (enabled) {
      const readable = context.method && context.url
        ? `[Client] ${message} ${context.method} ${context.url}`
          + `${context.status ? ` -> ${context.status}` : ''}`
          + `${context.durationMs !== undefined ? ` (${context.durationMs}ms)` : ''}`
          + `${context.output !== undefined ? ` output=${outputSummary(context.output)}` : ''}`
        : `[Client] ${message}`;
      console.info(readable, redact(context));
    }
  },
  error(message, context = {}) {
    if (enabled) {
      const readable = context.method && context.url
        ? `[Client] ${message} ${context.method} ${context.url}`
          + `${context.status ? ` -> ${context.status}` : ''}`
          + `${context.durationMs !== undefined ? ` (${context.durationMs}ms)` : ''}`
          + `${context.output !== undefined ? ` output=${outputSummary(context.output)}` : ''}`
        : `[Client] ${message}`;
      console.error(readable, redact(context));
    }
  },
};

export default clientLogger;