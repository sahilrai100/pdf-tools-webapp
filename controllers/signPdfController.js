const { signPdf } = require('../services/signPdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function sign(req, res, next) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });
    const { signatureDataUrl, pageNumber, x, y, width, height } = req.body;
    if (!signatureDataUrl) return res.status(400).json({ success: false, error: 'Signature is required.' });
    const outputPath = await signPdf(file.path, { signatureDataUrl, pageNumber, x, y, width, height });
    deleteFiles([file.path]);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFiles([file.path]);
    next(err);
  }
}

module.exports = { sign };
