const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function redactPdf(filePath, redactions = []) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  for (const r of redactions) {
    const pageIndex = (r.page || 1) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const { height } = page.getSize();

    const fillColor = r.color === 'white' ? rgb(1, 1, 1) : rgb(0, 0, 0);

    // Draw opaque rectangle over the redacted area
    page.drawRectangle({
      x: r.x || 0,
      y: height - (r.y || 0) - (r.height || 20),
      width: r.width || 100,
      height: r.height || 20,
      color: fillColor,
      opacity: 1,
    });
  }

  const outputPath = generateOutputPath('pdf');
  const redactedBytes = await doc.save();
  fs.writeFileSync(outputPath, redactedBytes);
  return outputPath;
}

module.exports = { redactPdf };
