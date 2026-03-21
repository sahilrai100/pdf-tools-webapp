const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function rotatePdf(filePath, angle, pagesOption) {
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  let targetIndices = [];

  if (pagesOption === 'all' || !pagesOption) {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else {
    const parts = pagesOption.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
        for (let i = start; i <= end; i++) {
          if (i >= 0 && i < totalPages) targetIndices.push(i);
        }
      } else {
        const idx = parseInt(part) - 1;
        if (idx >= 0 && idx < totalPages) targetIndices.push(idx);
      }
    }
  }

  targetIndices.forEach(idx => {
    const page = pages[idx];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + parseInt(angle)) % 360));
  });

  const outputPath = generateOutputPath('pdf');
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { rotatePdf };
