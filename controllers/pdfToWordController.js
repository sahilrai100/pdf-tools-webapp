const { pdfToWord } = require('../services/pdfToWordService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

async function convert(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });
    const outputPath = await pdfToWord(file.path);
    deleteFile(file.path);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    next(err);
  }
}

module.exports = { convert };
