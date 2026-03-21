const { mergePdfs } = require('../services/mergePdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function merge(req, res, next) {
  const files = req.files;
  try {
    if (!files || files.length < 2) {
      return res.status(400).json({ success: false, error: 'Please upload at least 2 PDF files.' });
    }
    const filePaths = files.map(f => f.path);
    const outputPath = await mergePdfs(filePaths);
    deleteFiles(filePaths);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (files) deleteFiles(files.map(f => f.path));
    next(err);
  }
}

module.exports = { merge };
