const ApiResponse = require('../utils/ApiResponse');

function notFound(req, res, next) {
  return ApiResponse.notFound(res, `Route not found: [${req.method}] ${req.originalUrl}`);
}

module.exports = notFound;
