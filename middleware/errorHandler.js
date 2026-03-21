const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error(err.message || err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err.message && err.message.includes('password')) {
    return res.status(422).json({ success: false, error: 'This PDF is password-protected.' });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  res.status(500).json({ success: false, error: err.message || 'An unexpected error occurred.' });
}

module.exports = errorHandler;
