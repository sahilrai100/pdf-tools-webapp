const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function addPageNumbers(filePath, { position = 'bottom-center', startNumber = 1, fontSize = 12, format = 'numeric' }) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const num = parseInt(startNumber) + i;
    let label;
    if (format === 'of-total') label = `${num} of ${total}`;
    else if (format === 'page-n') label = `Page ${num}`;
    else label = `${num}`;

    const size = parseInt(fontSize) || 12;
    const textWidth = font.widthOfTextAtSize(label, size);

    let x, y;
    if (position === 'bottom-center') { x = (width - textWidth) / 2; y = 20; }
    else if (position === 'bottom-right') { x = width - textWidth - 24; y = 20; }
    else if (position === 'bottom-left') { x = 24; y = 20; }
    else if (position === 'top-center') { x = (width - textWidth) / 2; y = height - 30; }
    else if (position === 'top-right') { x = width - textWidth - 24; y = height - 30; }
    else if (position === 'top-left') { x = 24; y = height - 30; }
    else { x = (width - textWidth) / 2; y = 20; }

    page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.3) });
  });

  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await doc.save());
  return outputPath;
}

module.exports = { addPageNumbers };
