const { redactPdf } = require('../services/redactPdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

exports.redact = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    let redactions = [];
    if (req.body.redactions) {
      redactions = JSON.parse(req.body.redactions);
    }

    const outputPath = await redactPdf(req.file.path, redactions);
    deleteFile(req.file.path);

    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    next(err);
  }
};
