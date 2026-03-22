const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function unlockPdf(filePath, password) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes, { password: password || '' });
  const outputPath = generateOutputPath('pdf');
  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { unlockPdf };
