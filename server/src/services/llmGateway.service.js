const { env } = require('../config/env');
const AppError = require('../utils/AppError');

const workerBaseUrl = () => env.LLM_SERVICE_URL || `http://127.0.0.1:${env.LLM_SERVICE_PORT || 7031}`;

const requestLlmWorker = async (path, payload) => {
  let response;
  try {
    response = await fetch(`${workerBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new AppError(`LLM worker unavailable at ${workerBaseUrl()}: ${error.message}`, 503);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new AppError(`LLM worker returned an invalid response (${response.status}).`, 502);
  }
  if (!response.ok) {
    throw new AppError(data.message || `LLM worker failed with status ${response.status}.`, response.status >= 500 ? 502 : response.status);
  }
  return data.data || data;
};

const workerEnabled = () => env.LLM_SERVICE_ENABLED === 'true';

module.exports = { requestLlmWorker, workerEnabled, workerBaseUrl };
