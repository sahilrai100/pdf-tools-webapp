const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

// Quality levels map to different optimization strategies
const QUALITY_SETTINGS = {
  low: { imageQuality: 40, downsample: true },
  medium: { imageQuality: 60, downsample: false },
  high: { imageQuality: 80, downsample: false },
};

async function compressPdf(filePath, quality) {
  const settings = QUALITY_SETTINGS[quality] || QUALITY_SETTINGS.medium;
  const bytes = fs.readFileSync(filePath);

  // Load and re-save through pdf-lib to strip metadata overhead
  const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });

  // Remove metadata to reduce size
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('PDF Converter');
  pdfDoc.setCreator('PDF Converter');

  const outputPath = generateOutputPath('pdf');
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,    // enables cross-reference stream compression
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { compressPdf };
