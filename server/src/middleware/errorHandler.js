const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.details = err.details || null;

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error.statusCode = 409;
    error.status = 'fail';
    error.message = `Duplicate value '${value}' for ${field}. A record with this ${field} already exists.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error.statusCode = 400;
    error.status = 'fail';
    error.message = 'Validation failed';
    error.details = details;
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.status = 'fail';
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log unexpected errors
  if (error.statusCode === 500) {
    console.error('SERVER ERROR 💥:', err);
  }

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message || 'An unexpected error occurred',
    details: error.details,
    ...(process.env.NODE_ENV === 'development' && error.statusCode === 500
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
