const { splitPdf } = require('../services/splitPdfService');
const { deleteFile, deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function split(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const mode = req.body.mode || 'range';
    const options = {
      ranges: req.body.ranges,
      every: req.body.every,
      page: req.body.page,
    };

    const result = await splitPdf(file.path, mode, options);
    deleteFile(file.path);
    deleteFiles(result.cleanup);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(result.path)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    next(err);
  }
}

module.exports = { split };
