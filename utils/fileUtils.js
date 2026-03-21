const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

function ensureDirs() {
  [config.uploadDir, config.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function generateOutputPath(ext) {
  return path.join(config.outputDir, `${uuidv4()}.${ext}`);
}

function deleteFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) { /* ignore */ }
}

function deleteFiles(filePaths) {
  if (Array.isArray(filePaths)) filePaths.forEach(deleteFile);
}

function getFileAgeMins(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return (Date.now() - stats.mtimeMs) / 60000;
  } catch { return Infinity; }
}

module.exports = { ensureDirs, generateOutputPath, deleteFile, deleteFiles, getFileAgeMins };
