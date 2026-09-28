/**
 * Standardized API response helper
 */

function success(res, data, message = 'Success', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

function badRequest(res, message = 'Invalid request data', errors = null) {
  return error(res, message, 400, errors);
}

module.exports = {
  success,
  created,
  error,
  notFound,
  badRequest
};
