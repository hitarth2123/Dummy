/**
 * catchAsync — wraps async route handlers to forward errors to Express error middleware.
 * Eliminates try/catch boilerplate in every controller.
 *
 * Usage:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
