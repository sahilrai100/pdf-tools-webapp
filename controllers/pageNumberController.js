const { addPageNumbers } = require('../services/pageNumberService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function pageNumber(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });
    const outputPath = await addPageNumbers(file.path, req.body);
    deleteFiles([file.path]);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFiles([file.path]);
    next(err);
  }
}

module.exports = { pageNumber };
