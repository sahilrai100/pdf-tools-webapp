const { editPdf } = require('../services/editPdfService');
const { deleteFile } = require('../utils/fileUtils');
const path = require('path');

exports.edit = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    let operations = [];
    if (req.body.operations) {
      operations = JSON.parse(req.body.operations);
    }

    const outputPath = await editPdf(req.file.path, operations);
    deleteFile(req.file.path);

    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    next(err);
  }
};
