const fs = require('fs');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { generateOutputPath } = require('../utils/fileUtils');

async function pdfToWord(filePath) {
  const pdfBuffer = fs.readFileSync(filePath);
  let data;
  try {
    data = await pdfParse(pdfBuffer);
  } catch (err) {
    // pdf-parse can fail on some PDFs — fallback with empty text
    data = { text: '' };
  }

  // Split text into paragraphs by double newlines or single newlines
  const rawText = data.text || '';
  const lines = rawText.split('\n');

  const paragraphs = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line = spacer paragraph
      return new Paragraph({ children: [new TextRun('')] });
    }
    return new Paragraph({
      children: [
        new TextRun({
          text: trimmed,
          size: 24, // 12pt
          font: 'Calibri',
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs.length > 0 ? paragraphs : [
        new Paragraph({ children: [new TextRun('No text content found in this PDF.')] })
      ],
    }],
  });

  const outputPath = generateOutputPath('docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

module.exports = { pdfToWord };
