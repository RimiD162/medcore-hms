class ApiResponse {
  static success(res, data = {}, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      errors: null,
    });
  }

  static created(res, data = {}, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'Internal server error', statusCode = 500, errors = []) {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }

  static validationError(res, errors = [], message = 'Validation failed') {
    return res.status(400).json({
      success: false,
      data: null,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden: Insufficient privileges') {
    return this.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static badRequest(res, message = 'Bad request', errors = []) {
    return this.error(res, message, 400, errors);
  }
}

module.exports = ApiResponse;
