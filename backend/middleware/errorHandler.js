// middleware/errorHandler.js — Centralised Express error handler
/**
 * Catches errors forwarded via next(err) from any route or middleware.
 * Always returns a consistent JSON error envelope.
 */
const errorHandler = (err, req, res, next) => {  // eslint-disable-line no-unused-vars
  // Validation errors from express-validator are forwarded as arrays
  if (Array.isArray(err)) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message    || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${statusCode} — ${message}`, err.stack || '');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
