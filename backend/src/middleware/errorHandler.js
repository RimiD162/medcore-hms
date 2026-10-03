const ApiResponse = require('../utils/ApiResponse');

function errorHandler(err, req, res, next) {
  // Handle known ApiError instances
  if (err.statusCode) {
    if (err.statusCode === 400 && err.errors && err.errors.length > 0) {
      return ApiResponse.validationError(res, err.errors, err.message);
    }
    return ApiResponse.error(res, err.message, err.statusCode, err.errors || []);
  }

  // Handle Prisma errors gracefully without leaking raw internal stacks
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    console.error('Prisma DB Error:', err.code, err.message, err.meta);
    if (err.code === 'P2002') {
      return ApiResponse.error(
        res,
        `Duplicate field constraint violation: ${err.meta?.target ? err.meta.target.join(', ') : 'field already exists'}`,
        409
      );
    }
    if (err.code === 'P2025') {
      return ApiResponse.notFound(res, 'Requested record was not found or has been removed');
    }
    return ApiResponse.error(res, `Database operation error: ${err.message}`, 400);
  }

  // Fallback for unhandled server errors
  console.error('Unhandled Server Error:', err);
  return ApiResponse.error(res, 'An unexpected server error occurred. Please try again.', 500);
}

module.exports = errorHandler;
