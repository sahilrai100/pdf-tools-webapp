const { addTextWatermark, addImageWatermark } = require('../services/watermarkPdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

async function watermark(req, res, next) {
  const file = req.files && req.files.file && req.files.file[0];
  const wmImage = req.files && req.files.watermarkImage && req.files.watermarkImage[0];
  try {
    if (!file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const type = req.body.type || 'text';
    let outputPath;

    if (type === 'image') {
      if (!wmImage) {
        return res.status(400).json({ success: false, error: 'Please upload a watermark image.' });
      }
      outputPath = await addImageWatermark(file.path, wmImage.path, req.body);
      deleteFile(wmImage.path);
    } else {
      const text = req.body.text || 'CONFIDENTIAL';
      outputPath = await addTextWatermark(file.path, text, req.body);
    }

    deleteFile(file.path);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (file) deleteFile(file.path);
    if (wmImage) deleteFile(wmImage.path);
    next(err);
  }
}

module.exports = { watermark };
