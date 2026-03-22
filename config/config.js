require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  uploadDir: path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
  outputDir: path.join(__dirname, '..', process.env.OUTPUT_DIR || 'outputs'),
  fileTtlMinutes: parseInt(process.env.FILE_TTL_MINUTES || '10'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '100'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '100') * 1024 * 1024,
  nodeEnv: process.env.NODE_ENV || 'development',
};
