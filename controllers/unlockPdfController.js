const { unlockPdf } = require('../services/unlockPdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function unlock(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });
    const { password } = req.body;
    const outputPath = await unlockPdf(file.path, password);
    deleteFiles([file.path]);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFiles([file.path]);
    if (err.message && err.message.includes('password')) {
      return res.status(400).json({ success: false, error: 'Incorrect password. Please try again.' });
    }
    next(err);
  }
}

module.exports = { unlock };
