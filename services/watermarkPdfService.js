const { PDFDocument, StandardFonts, rgb, degrees, grayscale } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

async function addTextWatermark(filePath, text, options) {
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const opacity = parseFloat(options.opacity) || 0.3;
  const fontSize = parseInt(options.fontSize) || 48;
  const color = options.color ? hexToRgb(options.color) : rgb(0.7, 0.7, 0.7);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color,
      opacity,
      rotate: degrees(45),
    });
  }

  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await pdfDoc.save());
  return outputPath;
}

async function addImageWatermark(filePath, imagePath, options) {
  const bytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(bytes);

  const imgBytes = fs.readFileSync(imagePath);
  const ext = require('path').extname(imagePath).toLowerCase();
  const img = ext === '.png'
    ? await pdfDoc.embedPng(imgBytes)
    : await pdfDoc.embedJpg(imgBytes);

  const opacity = parseFloat(options.opacity) || 0.3;
  const scaleFactor = parseFloat(options.scale) || 0.4;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const imgDims = img.scale(scaleFactor);
    const x = (width - imgDims.width) / 2;
    const y = (height - imgDims.height) / 2;

    page.drawImage(img, {
      x,
      y,
      width: imgDims.width,
      height: imgDims.height,
      opacity,
    });
  }

  const outputPath = generateOutputPath('pdf');
  fs.writeFileSync(outputPath, await pdfDoc.save());
  return outputPath;
}

module.exports = { addTextWatermark, addImageWatermark };
