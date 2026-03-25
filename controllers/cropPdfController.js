const { cropPdf } = require('../services/cropPdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

exports.crop = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const options = {
      top: parseFloat(req.body.top) || 0,
      bottom: parseFloat(req.body.bottom) || 0,
      left: parseFloat(req.body.left) || 0,
      right: parseFloat(req.body.right) || 0,
      pages: req.body.pages || 'all',
    };

    const outputPath = await cropPdf(req.file.path, options);
    deleteFile(req.file.path);

    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    next(err);
  }
};
