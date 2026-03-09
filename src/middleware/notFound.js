const { errorResponse } = require('../utils/response');

const notFound = (req, res) => {
  return errorResponse(res, 'Route not found', [
    { field: 'route', message: `${req.method} ${req.originalUrl} does not exist` },
  ], 404);
};

module.exports = notFound;
