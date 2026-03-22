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
const protectPdfController = require('../controllers/protectPdfController');
const unlockPdfController = require('../controllers/unlockPdfController');
const pageNumberController = require('../controllers/pageNumberController');
const organizePdfController = require('../controllers/organizePdfController');
const signPdfController = require('../controllers/signPdfController');

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

// Protect PDF - single PDF
router.post('/protect', pdfUpload.single('file'), protectPdfController.protect);

// Unlock PDF - single PDF
router.post('/unlock', pdfUpload.single('file'), unlockPdfController.unlock);

// Add Page Numbers - single PDF
router.post('/page-numbers', pdfUpload.single('file'), pageNumberController.pageNumber);

// Organize PDF - no file upload (file already in uploads/ from /pdf-info)
router.post('/organize', organizePdfController.organize);

// Sign PDF - single PDF
router.post('/sign', pdfUpload.single('file'), signPdfController.sign);

// PDF Info - get page count, stores file in uploads for organize workflow
router.post('/pdf-info', pdfUpload.single('file'), async (req, res, next) => {
  const { PDFDocument } = require('pdf-lib');
  const fs = require('fs');
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const bytes = fs.readFileSync(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const pageCount = doc.getPageCount();
    // Do not delete - file is kept for the subsequent /organize call
    res.json({ success: true, pageCount, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
});

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
