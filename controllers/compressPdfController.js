const { compressPdf } = require('../services/compressPdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

async function compress(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const quality = req.body.quality || 'medium';
    if (!['low', 'medium', 'high'].includes(quality)) {
      return res.status(400).json({ success: false, error: 'Quality must be low, medium, or high.' });
    }

    const outputPath = await compressPdf(file.path, quality);
    deleteFile(file.path);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    next(err);
  }
}

module.exports = { compress };
