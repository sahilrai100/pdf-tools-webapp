const { protectPdf } = require('../services/protectPdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function protect(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });
    const { userPassword, ownerPassword } = req.body;
    if (!userPassword) return res.status(400).json({ success: false, error: 'Please provide a password.' });
    const outputPath = await protectPdf(file.path, { userPassword, ownerPassword });
    deleteFiles([file.path]);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFiles([file.path]);
    next(err);
  }
}

module.exports = { protect };
