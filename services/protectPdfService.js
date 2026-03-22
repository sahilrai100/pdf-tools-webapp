const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function protectPdf(filePath, { userPassword, ownerPassword }) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const outputPath = generateOutputPath('pdf');
  const pdfBytes = await doc.save({
    userPassword: userPassword || undefined,
    ownerPassword: ownerPassword || userPassword || undefined,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
      encryptForDRM: false,
    },
  });
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { protectPdf };
