const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { pdfUpload, imageUpload, wordUpload, pdfOrImageUpload } = require('../middleware/upload');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const mergePdfController = require('../controllers/mergePdfController');
const splitPdfController = require('../controllers/splitPdfController');
const rotatePdfController = require('../controllers/rotatePdfController');
const watermarkPdfController = require('../controllers/watermarkPdfController');
const compressPdfController = require('../controllers/compressPdfController');
const imageToPdfController = require('../controllers/imageToPdfController');
const pdfToImageController = require('../controllers/pdfToImageController');
const wordToPdfController = require('../controllers/wordToPdfController');
const pdfToWordController = require('../controllers/pdfToWordController');

// Merge PDF - multiple PDF files
router.post('/merge', pdfUpload.array('files', 20), mergePdfController.merge);

// Split PDF - single PDF
router.post('/split', pdfUpload.single('file'), splitPdfController.split);

// Rotate PDF - single PDF
router.post('/rotate', pdfUpload.single('file'), rotatePdfController.rotate);

// Compress PDF - single PDF
router.post('/compress', pdfUpload.single('file'), compressPdfController.compress);

// Image to PDF - multiple images
router.post('/image-to-pdf', imageUpload.array('files', 20), imageToPdfController.imageToPdf);

// PDF to Image - single PDF
router.post('/pdf-to-image', pdfUpload.single('file'), pdfToImageController.pdfToImage);

// Word to PDF - single DOCX
router.post('/word-to-pdf', wordUpload.single('file'), wordToPdfController.convert);

// PDF to Word - single PDF
router.post('/pdf-to-word', pdfUpload.single('file'), pdfToWordController.convert);

// Watermark PDF - PDF + optional image
const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});
const watermarkUpload = multer({
  storage: watermarkStorage,
  limits: { fileSize: config.maxFileSizeBytes },
});
router.post('/watermark', watermarkUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 },
]), watermarkPdfController.watermark);

// Download endpoint
router.get('/download/:filename', (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename); // prevent path traversal
    const filePath = path.join(config.outputDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found or has expired.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.zip': 'application/zip',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const downloadName = `converted${ext}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
