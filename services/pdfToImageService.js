const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { generateOutputPath } = require('../utils/fileUtils');
const { zipFiles } = require('../utils/archiver');
const config = require('../config/config');

async function pdfToImages(filePath, options) {
  // Dynamically import mupdf (ESM module)
  const mupdf = await import('mupdf');

  const format = options.format === 'png' ? 'png' : 'jpg';
  const dpi = parseInt(options.dpi) || 150;
  const scale = dpi / 72; // PDF base unit is 72 DPI

  const data = fs.readFileSync(filePath);
  const doc = mupdf.Document.openDocument(data, 'application/pdf');
  const totalPages = doc.countPages();

  // Parse page selection
  let pageNumbers = [];
  if (options.pages && options.pages !== 'all') {
    pageNumbers = options.pages
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= totalPages);
  } else {
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (pageNumbers.length === 0) throw new Error('No valid pages selected.');

  const outputPaths = [];

  for (const pageNum of pageNumbers) {
    const page = doc.loadPage(pageNum - 1); // mupdf is 0-indexed

    // Build scale matrix [sx, shy, shx, sy, tx, ty]
    const matrix = mupdf.Matrix.scale(scale, scale);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    const pngBuffer = Buffer.from(pixmap.asPNG());

    let outPath;
    if (format === 'png') {
      outPath = path.join(config.outputDir, `${uuidv4()}.png`);
      fs.writeFileSync(outPath, pngBuffer);
    } else {
      outPath = path.join(config.outputDir, `${uuidv4()}.jpg`);
      await sharp(pngBuffer).jpeg({ quality: 90 }).toFile(outPath);
    }

    outputPaths.push(outPath);
  }

  if (outputPaths.length === 0) throw new Error('No images were generated from the PDF.');

  if (outputPaths.length === 1) {
    return { type: format, path: outputPaths[0], cleanup: [] };
  }

  const fileNames = outputPaths.map((_, i) => `page_${i + 1}.${format}`);
  const zipPath = generateOutputPath('zip');
  await zipFiles(outputPaths, zipPath, fileNames);
  return { type: 'zip', path: zipPath, cleanup: outputPaths };
}

module.exports = { pdfToImages };
