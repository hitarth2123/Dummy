const crypto = require('crypto');
const { logger, redact } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  const startedAt = process.hrtime.bigint();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  logger.info('request.started', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    body: Object.keys(req.body || {}).length ? redact(req.body) : undefined,
  });

  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info('request.completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      response: res.locals.responseSummary,
        output: res.locals.responseOutput,
    });
  };

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.locals.responseSummary = {
      type: 'json',
      success: body?.success,
      keys: body && typeof body === 'object' ? Object.keys(body) : [],
    };
    res.locals.responseOutput = body;
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (!res.locals.responseSummary) {
      res.locals.responseSummary = { type: 'body', size: typeof body === 'string' ? body.length : undefined };
      res.locals.responseOutput = body;
    }
    return originalSend(body);
  };

  res.once('finish', finish);
  res.once('close', finish);
  next();
};

module.exports = { requestLogger };