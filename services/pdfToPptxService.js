const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateOutputPath } = require('../utils/fileUtils');

async function pdfToPptx(filePath) {
  const mupdf = await import('mupdf');
  const PptxGenJS = (await import('pptxgenjs')).default;

  const data = fs.readFileSync(filePath);
  const doc = mupdf.Document.openDocument(data, 'application/pdf');
  const pageCount = doc.countPages();

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const bounds = page.getBounds();
    const pageWidth = bounds[2] - bounds[0];
    const pageHeight = bounds[3] - bounds[1];

    // Render at 150 DPI for good quality without huge files
    const scale = 150 / 72;
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(scale, scale),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true
    );

    const pngBuffer = Buffer.from(pixmap.asPNG());

    // Convert to JPEG for smaller file size
    const jpgBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 85 })
      .toBuffer();

    // Create a slide with the page image
    const slide = pptx.addSlide();

    // Calculate aspect ratio to fit the slide
    const slideW = 13.33;
    const slideH = 7.5;
    const ratio = Math.min(slideW / pageWidth, slideH / pageHeight);
    const imgW = (pageWidth * ratio);
    const imgH = (pageHeight * ratio);
    const imgX = (slideW - imgW) / 2;
    const imgY = (slideH - imgH) / 2;

    slide.addImage({
      data: 'image/jpeg;base64,' + jpgBuffer.toString('base64'),
      x: imgX,
      y: imgY,
      w: imgW,
      h: imgH,
    });
  }

  const outputPath = generateOutputPath('pptx');
  await pptx.writeFile({ fileName: outputPath });
  return outputPath;
}

module.exports = { pdfToPptx };
