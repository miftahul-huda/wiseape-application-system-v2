const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const DOCUMENTS_DIR = path.join(UPLOAD_ROOT, 'documents');

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const employeeId = req.params.employeeId || req.body.employeeId || 'general';
    const targetDir = path.join(DOCUMENTS_DIR, String(employeeId));

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const docType = (req.body.documentType || 'doc')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    cb(null, `${docType}_${timestamp}_${safeBaseName}${ext}`);
  }
});

// File filter (PDF, images, word docs)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file tidak didukung (${ext}). Harap unggah PDF, JPG, PNG, atau DOCX.`), false);
  }
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter
});

module.exports = {
  upload,
  UPLOAD_ROOT,
  DOCUMENTS_DIR
};
