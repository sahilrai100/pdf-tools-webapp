const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

async function editPdf(filePath, operations = []) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  const fonts = {
    'Helvetica': await doc.embedFont(StandardFonts.Helvetica),
    'Helvetica-Bold': await doc.embedFont(StandardFonts.HelveticaBold),
    'Times-Roman': await doc.embedFont(StandardFonts.TimesRoman),
    'Courier': await doc.embedFont(StandardFonts.Courier),
  };

  for (const op of operations) {
    const pageIndex = (op.page || 1) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const { height } = page.getSize();

    if (op.type === 'text') {
      const fontName = op.font || 'Helvetica';
      const font = fonts[fontName] || fonts['Helvetica'];
      const size = op.size || 14;
      const color = parseColor(op.color || '#000000');

      page.drawText(op.text || '', {
        x: op.x || 50,
        y: height - (op.y || 50) - size,
        size,
        font,
        color,
      });
    }

    if (op.type === 'rectangle') {
      const color = parseColor(op.color || '#000000');
      page.drawRectangle({
        x: op.x || 0,
        y: height - (op.y || 0) - (op.height || 20),
        width: op.width || 100,
        height: op.height || 20,
        color,
        opacity: op.opacity !== undefined ? op.opacity : 1,
      });
    }

    if (op.type === 'image' && op.imageData) {
      let image;
      const imgBuffer = Buffer.from(op.imageData, 'base64');
      try {
        image = await doc.embedPng(imgBuffer);
      } catch {
        image = await doc.embedJpg(imgBuffer);
      }
      const dims = image.scale(op.scale || 0.5);
      page.drawImage(image, {
        x: op.x || 50,
        y: height - (op.y || 50) - dims.height,
        width: dims.width,
        height: dims.height,
      });
    }
  }

  const outputPath = generateOutputPath('pdf');
  const editedBytes = await doc.save();
  fs.writeFileSync(outputPath, editedBytes);
  return outputPath;
}

function parseColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

module.exports = { editPdf };
