const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { generateOutputPath } = require('../utils/fileUtils');
const { zipFiles } = require('../utils/archiver');
const config = require('../config/config');

function parseRanges(rangeStr, totalPages) {
  const ranges = [];
  const parts = rangeStr.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        throw new Error(`Invalid range: "${part}"`);
      }
      ranges.push({ start: start - 1, end: end - 1 });
    } else {
      const page = parseInt(part);
      if (isNaN(page) || page < 1 || page > totalPages) {
        throw new Error(`Invalid page number: "${part}"`);
      }
      ranges.push({ start: page - 1, end: page - 1 });
    }
  }
  return ranges;
}

async function splitPdf(filePath, mode, options) {
  const bytes = fs.readFileSync(filePath);
  const srcDoc = await PDFDocument.load(bytes);
  const totalPages = srcDoc.getPageCount();

  let ranges = [];

  if (mode === 'range') {
    ranges = parseRanges(options.ranges, totalPages);
  } else if (mode === 'every') {
    const n = parseInt(options.every) || 1;
    for (let i = 0; i < totalPages; i += n) {
      ranges.push({ start: i, end: Math.min(i + n - 1, totalPages - 1) });
    }
  } else if (mode === 'extract') {
    const page = parseInt(options.page);
    if (isNaN(page) || page < 1 || page > totalPages) {
      throw new Error(`Invalid page number: ${options.page}`);
    }
    ranges.push({ start: page - 1, end: page - 1 });
  }

  const outputPaths = [];
  const fileNames = [];

  for (let i = 0; i < ranges.length; i++) {
    const { start, end } = ranges[i];
    const newDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: end - start + 1 }, (_, j) => start + j);
    const pages = await newDoc.copyPages(srcDoc, pageIndices);
    pages.forEach(p => newDoc.addPage(p));
    const pdfBytes = await newDoc.save();
    const outPath = path.join(config.outputDir, `${uuidv4()}.pdf`);
    fs.writeFileSync(outPath, pdfBytes);
    outputPaths.push(outPath);
    fileNames.push(`split_part_${i + 1}.pdf`);
  }

  if (outputPaths.length === 1) return { type: 'pdf', path: outputPaths[0], cleanup: [] };

  const zipPath = generateOutputPath('zip');
  await zipFiles(outputPaths, zipPath, fileNames);
  return { type: 'zip', path: zipPath, cleanup: outputPaths };
}

module.exports = { splitPdf };
