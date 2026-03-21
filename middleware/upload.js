const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const PDF_MIME = ['application/pdf'];
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const WORD_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

function createUpload(allowedMimes, maxCount = 1) {
  return multer({
    storage,
    limits: { fileSize: config.maxFileSizeBytes },
    fileFilter: (req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`));
      }
    },
  });
}

module.exports = {
  pdfUpload: createUpload(PDF_MIME),
  imageUpload: createUpload(IMAGE_MIME, 20),
  wordUpload: createUpload(WORD_MIME),
  pdfOrImageUpload: createUpload([...PDF_MIME, ...IMAGE_MIME], 20),
};
