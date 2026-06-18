const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Make sure error inherits from ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  // Handle Mongoose / MongoDB duplicates
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `Duplicate field value entered: ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // Handle JWT signature errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.');
  }

  // Handle JWT expired errors
  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Your session has expired. Please log in again.');
  }

  const { statusCode, message } = error;

  // Log in server
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (process.env.NODE_ENV !== 'production' && !error.isOperational) {
    logger.error(error.stack);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

module.exports = errorHandler;
