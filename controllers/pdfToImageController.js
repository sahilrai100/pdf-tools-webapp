const { pdfToImages } = require('../services/pdfToImageService');
const { deleteFile, deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function pdfToImage(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const options = {
      format: req.body.format || 'jpg',
      dpi: req.body.dpi || '150',
      pages: req.body.pages || 'all',
    };

    const result = await pdfToImages(file.path, options);
    deleteFile(file.path);
    deleteFiles(result.cleanup);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(result.path)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    next(err);
  }
}

module.exports = { pdfToImage };
