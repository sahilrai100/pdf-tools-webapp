const { pdfToPptx } = require('../services/pdfToPptxService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

exports.convert = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const outputPath = await pdfToPptx(req.file.path);
    deleteFile(req.file.path);

    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    next(err);
  }
};
