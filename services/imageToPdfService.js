const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { generateOutputPath } = require('../utils/fileUtils');

const PAGE_SIZES = {
  auto: null,
  a4: [595.28, 841.89],
  letter: [612, 792],
  a3: [841.89, 1190.55],
};

async function imagesToPdf(filePaths, options) {
  const pdfDoc = await PDFDocument.create();
  const pageSize = PAGE_SIZES[options.pageSize] || null;
  const orientation = options.orientation || 'portrait';
  const margin = parseInt(options.margin) || 0;

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase();
    const sharpImg = sharp(filePath);
    const metadata = await sharpImg.metadata();

    let imgBuffer;
    let embedFn;

    if (ext === '.jpg' || ext === '.jpeg') {
      imgBuffer = fs.readFileSync(filePath);
      embedFn = 'embedJpg';
    } else {
      imgBuffer = await sharpImg.png().toBuffer();
      embedFn = 'embedPng';
    }

    const embeddedImg = await pdfDoc[embedFn](imgBuffer);
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    let pWidth, pHeight;

    if (pageSize) {
      [pWidth, pHeight] = pageSize;
      if (
        (orientation === 'landscape' && pWidth < pHeight) ||
        (orientation === 'portrait' && pWidth > pHeight)
      ) {
        [pWidth, pHeight] = [pHeight, pWidth];
      }
    } else {
      pWidth = imgWidth;
      pHeight = imgHeight;
    }

    const page = pdfDoc.addPage([pWidth, pHeight]);

    const drawWidth = pWidth - margin * 2;
    const drawHeight = pHeight - margin * 2;
    const scale = Math.min(drawWidth / imgWidth, drawHeight / imgHeight);
    const scaledW = imgWidth * scale;
    const scaledH = imgHeight * scale;
    const x = margin + (drawWidth - scaledW) / 2;
    const y = margin + (drawHeight - scaledH) / 2;

    page.drawImage(embeddedImg, { x, y, width: scaledW, height: scaledH });
  }

  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await pdfDoc.save());
  return outputPath;
}

module.exports = { imagesToPdf };
