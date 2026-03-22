const { organizePdf } = require('../services/organizePdfService');
const { deleteFiles } = require('../utils/fileUtils');
const path = require('path');
const config = require('../config/config');

async function organize(req, res, next) {
  try {
    const { filename, pageOrder: pageOrderRaw } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'filename required' });
    const filePath = path.join(config.uploadDir, path.basename(filename));
    let pageOrder = pageOrderRaw;
    if (typeof pageOrder === 'string') pageOrder = JSON.parse(pageOrder);
    pageOrder = pageOrder.map(Number);
    const outputPath = await organizePdf(filePath, pageOrder);
    deleteFiles([filePath]);
    res.json({ success: true, downloadUrl: `/api/download/${path.basename(outputPath)}` });
  } catch (err) {
    next(err);
  }
}

module.exports = { organize };
