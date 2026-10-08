const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const RECRUITMENT_DIR = path.join(UPLOAD_ROOT, 'recruitment');

if (!fs.existsSync(RECRUITMENT_DIR)) {
  fs.mkdirSync(RECRUITMENT_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const processId = req.params.id || req.body.processId || 'misc';
    const targetDir = path.join(RECRUITMENT_DIR, String(processId));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    cb(null, `rec_${timestamp}_${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe berkas tidak didukung (${ext}). Unggah PDF, JPG, PNG, DOCX, XLSX, atau ZIP.`), false);
  }
};

const uploadRecruitment = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  uploadRecruitment,
  RECRUITMENT_DIR
};
