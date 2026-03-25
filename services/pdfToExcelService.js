const fs = require('fs');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const { generateOutputPath } = require('../utils/fileUtils');

async function pdfToExcel(filePath) {
  const pdfBuffer = fs.readFileSync(filePath);
  let data;
  try {
    data = await pdfParse(pdfBuffer);
  } catch (err) {
    data = { text: '' };
  }
  const text = data.text || '';

  // Parse text into rows and columns
  const lines = text.split('\n').filter(line => line.trim());
  const rows = [];

  for (const line of lines) {
    // Try to split by tabs first, then by multiple spaces
    let cells;
    if (line.includes('\t')) {
      cells = line.split('\t').map(c => c.trim());
    } else {
      // Split by 2+ spaces (common in tabular PDF text)
      cells = line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
    }

    if (cells.length === 0) cells = [line.trim()];
    rows.push(cells);
  }

  if (rows.length === 0) {
    rows.push(['No text content found in this PDF.']);
  }

  // Normalize column count (pad shorter rows)
  const maxCols = Math.max(...rows.map(r => r.length));
  const normalizedRows = rows.map(row => {
    while (row.length < maxCols) row.push('');
    return row;
  });

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet(normalizedRows);

  // Auto-size columns
  const colWidths = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    for (const row of normalizedRows) {
      if (row[c] && row[c].length > maxLen) maxLen = Math.max(maxLen, Math.min(row[c].length, 50));
    }
    colWidths.push({ wch: maxLen + 2 });
  }
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PDF Data');

  const outputPath = generateOutputPath('xlsx');
  XLSX.writeFile(wb, outputPath);
  return outputPath;
}

module.exports = { pdfToExcel };
