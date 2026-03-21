const { imagesToPdf } = require('../services/imageToPdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');

async function imageToPdf(req, res, next) {
  const files = req.files;
  try {
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one image.' });
    }

    const options = {
      pageSize: req.body.pageSize || 'auto',
      orientation: req.body.orientation || 'portrait',
      margin: req.body.margin || '0',
    };

    const filePaths = files.map(f => f.path);
    const outputPath = await imagesToPdf(filePaths, options);
    deleteFiles(filePaths);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    if (files) deleteFiles(files.map(f => f.path));
    next(err);
  }
}

module.exports = { imageToPdf };
