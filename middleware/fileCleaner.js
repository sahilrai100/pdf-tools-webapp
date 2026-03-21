const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { getFileAgeMins } = require('../utils/fileUtils');

function cleanOldFiles() {
  [config.uploadDir, config.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (getFileAgeMins(filePath) > config.fileTtlMinutes) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    });
  });
}

function startCleaner() {
  cleanOldFiles();
  setInterval(cleanOldFiles, 5 * 60 * 1000); // every 5 minutes
}

module.exports = { startCleaner };
