const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function cropPdf(filePath, options = {}) {
  const { top = 0, bottom = 0, left = 0, right = 0, pages = 'all' } = options;
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const allPages = doc.getPages();

  const pageIndices = pages === 'all'
    ? allPages.map((_, i) => i)
    : pages.split(',').map(p => parseInt(p.trim()) - 1).filter(i => i >= 0 && i < allPages.length);

  for (const idx of pageIndices) {
    const page = allPages[idx];
    const { width, height } = page.getSize();
    const mediaBox = page.getMediaBox();

    // Apply crop margins (in points, 1pt = 1/72 inch)
    const cropBox = {
      x: mediaBox.x + left,
      y: mediaBox.y + bottom,
      width: width - left - right,
      height: height - top - bottom,
    };

    if (cropBox.width > 0 && cropBox.height > 0) {
      page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    }
  }

  const outputPath = generateOutputPath('pdf');
  const croppedBytes = await doc.save();
  fs.writeFileSync(outputPath, croppedBytes);
  return outputPath;
}

module.exports = { cropPdf };
