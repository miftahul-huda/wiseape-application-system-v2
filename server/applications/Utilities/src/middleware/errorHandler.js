const { ValidationError, UniqueConstraintError } = require('sequelize');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'A link with the same type and name already exists. Choose a different name.',
    });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: ' + err.errors.map((e) => e.message).join('; '),
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error('[Utilities API Error]:', err);
  return res.status(500).json({ success: false, message: 'Internal Server Error' });
}

module.exports = errorHandler;
