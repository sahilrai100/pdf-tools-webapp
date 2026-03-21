const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function mergePdfs(filePaths) {
  const mergedDoc = await PDFDocument.create();

  for (const filePath of filePaths) {
    const bytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(bytes);
    const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach(page => mergedDoc.addPage(page));
  }

  const outputPath = generateOutputPath('pdf');
  const pdfBytes = await mergedDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { mergePdfs };
