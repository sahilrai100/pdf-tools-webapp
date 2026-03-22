const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function signPdf(filePath, { signatureDataUrl, pageNumber = 0, x = 100, y = 100, width = 200, height = 80 }) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);

  // signatureDataUrl is "data:image/png;base64,..."
  const base64 = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
  const pngBytes = Buffer.from(base64, 'base64');
  const pngImage = await doc.embedPng(pngBytes);

  const pages = doc.getPages();
  const pageIdx = Math.min(parseInt(pageNumber) || 0, pages.length - 1);
  const page = pages[pageIdx];
  const { height: pageHeight } = page.getSize();

  // Convert from top-left coords to pdf-lib bottom-left coords
  const pdfY = pageHeight - parseInt(y) - parseInt(height);

  page.drawImage(pngImage, {
    x: parseInt(x),
    y: pdfY,
    width: parseInt(width),
    height: parseInt(height),
    opacity: 1,
  });

  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await doc.save());
  return outputPath;
}

module.exports = { signPdf };
