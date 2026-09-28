const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[HRIS API Error]:', err);

  // Sequelize Validation Error
  if (err instanceof ValidationError) {
    const errorDetails = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    return res.status(400).json({
      success: false,
      message: 'Validasi data gagal',
      errors: errorDetails
    });
  }

  // Sequelize Unique Constraint Error (e.g. duplicate NIK)
  if (err instanceof UniqueConstraintError) {
    const errorDetails = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} sudah terdaftar di sistem.`,
      value: e.value
    }));
    return res.status(409).json({
      success: false,
      message: 'Data duplikat terdeteksi',
      errors: errorDetails
    });
  }

  // Sequelize Foreign Key Error
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: 'Referensi data tidak valid atau berelasi dengan data lain',
      details: err.message
    });
  }

  // Multer Error (File too large, etc.)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file melebihi batas maksimum yang diperbolehkan (10MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Kesalahan upload berkas: ${err.message}`
    });
  }

  // Custom client errors
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message || 'Terjadi kesalahan pada permintaan'
    });
  }

  // Fallback 500 error
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
