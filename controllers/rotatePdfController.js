const { rotatePdf } = require('../services/rotatePdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

async function rotate(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const angle = req.body.angle || '90';
    if (!['90', '180', '270'].includes(String(angle))) {
      return res.status(400).json({ success: false, error: 'Angle must be 90, 180, or 270.' });
    }

    const pages = req.body.pages || 'all';
    const outputPath = await rotatePdf(file.path, angle, pages);
    deleteFile(file.path);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    next(err);
  }
}

module.exports = { rotate };
