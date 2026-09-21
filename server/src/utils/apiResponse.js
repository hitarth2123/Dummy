/**
 * apiResponse — standardised JSON response helpers.
 * All API responses follow the same envelope:
 *   { success, message, data?, meta? }
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendCreated = (res, data = null, message = 'Created') =>
  sendSuccess(res, data, message, 201);

const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendNotFound = (res, message = 'Resource not found') =>
  sendError(res, message, 404);

const sendUnauthorized = (res, message = 'Unauthorized') =>
  sendError(res, message, 401);

const sendForbidden = (res, message = 'Forbidden') =>
  sendError(res, message, 403);

const sendValidationError = (res, errors, message = 'Validation failed') =>
  sendError(res, message, 422, errors);

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
};
