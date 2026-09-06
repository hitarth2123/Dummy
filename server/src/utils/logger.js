const redactKeys = new Set([
  'password',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'client_secret',
]);

const redact = (value, depth = 0) => {
  if (depth > 2 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => redact(item, depth + 1));
  if (typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, item]) => [
    key,
    redactKeys.has(key) ? '[REDACTED]' : redact(item, depth + 1),
  ]));
};

const outputSummary = (value) => {
  if (value === undefined) return undefined;
  const safeValue = redact(value);
  const output = typeof safeValue === 'string' ? safeValue : JSON.stringify(safeValue);
  return output.length > 500 ? `${output.slice(0, 500)}...[truncated]` : output;
};

const write = (level, message, context = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(context),
  };
  const readable = context.method && context.path
    ? `[Server] ${message} ${context.method} ${context.path}`
      + `${context.status ? ` -> ${context.status}` : ''}`
      + `${context.durationMs !== undefined ? ` (${context.durationMs}ms)` : ''}`
      + `${context.output !== undefined ? ` output=${outputSummary(context.output)}` : ''}`
    : `[Server] ${message}`;
  if (level === 'error') console.error(readable, entry);
  else console.log(readable, entry);
};

const logger = {
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
};

module.exports = { logger, redact, outputSummary };