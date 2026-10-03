const ApiResponse = require('../utils/ApiResponse');

/**
 * Zod request validation middleware
 * Validates req.body, req.query, or req.params against a Zod schema
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return ApiResponse.validationError(res, formattedErrors, 'Validation failed');
      }
      return ApiResponse.badRequest(res, 'Invalid request payload');
    }
  };
}

module.exports = validate;
