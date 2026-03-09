const { logError } = require('../config/logger');
const { errorResponse } = require('../utils/response');

const errorHandler = (error, req, res, next) => {
  logError('Unhandled error', {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  return errorResponse(
    res,
    'Internal server error',
    [{ field: 'server', message: 'Something went wrong' }],
    500,
  );
};

module.exports = errorHandler;
