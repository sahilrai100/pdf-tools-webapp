const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function organizePdf(filePath, pageOrder) {
  // pageOrder is array of 0-based page indices in desired order
  const bytes = fs.readFileSync(filePath);
  const srcDoc = await PDFDocument.load(bytes);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, pageOrder);
  pages.forEach(p => newDoc.addPage(p));
  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await newDoc.save());
  return outputPath;
}

module.exports = { organizePdf };
