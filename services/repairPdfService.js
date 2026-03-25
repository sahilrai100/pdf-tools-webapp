const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function repairPdf(filePath) {
  const bytes = fs.readFileSync(filePath);

  // Load with ignoreEncryption to handle damaged/corrupt PDFs
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  // Re-save - this rebuilds the cross-reference table and fixes most corruption
  const outputPath = generateOutputPath('pdf');
  const repairedBytes = await doc.save();
  fs.writeFileSync(outputPath, repairedBytes);
  return outputPath;
}

module.exports = { repairPdf };
