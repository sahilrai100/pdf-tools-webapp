const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');
const { generateOutputPath } = require('../utils/fileUtils');

async function wordToPdf(filePath) {
  // Extract text and basic structure from DOCX using mammoth
  const [htmlResult, rawResult] = await Promise.all([
    mammoth.convertToHtml({ path: filePath }),
    mammoth.extractRawText({ path: filePath }),
  ]);

  const outputPath = generateOutputPath('pdf');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 72, // 1 inch margins
      size: 'A4',
      info: { Title: path.basename(filePath, '.docx'), Creator: 'PDF Tools' },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);

    // Parse the HTML from mammoth to render with basic formatting
    const html = htmlResult.value;
    renderHtmlToPdf(doc, html);

    doc.end();
  });
}

function renderHtmlToPdf(doc, html) {
  // Simple HTML parser - handles common tags from mammoth output
  // mammoth produces: <p>, <h1>-<h6>, <strong>, <em>, <ul>, <ol>, <li>, <br>, <table>

  const blocks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n\n')
    .split(/(<h[1-6][^>]*>|<\/h[1-6]>|<strong>|<\/strong>|<em>|<\/em>|<b>|<\/b>|<i>|<\/i>|<ul>|<\/ul>|<ol>|<\/ol>|<li[^>]*>|<p[^>]*>|<[^>]+>)/i)
    .filter(Boolean);

  let currentFontSize = 11;
  let currentBold = false;
  let currentItalic = false;
  let inList = false;
  let listIndent = 0;
  let textBuffer = '';
  let isHeading = false;
  let headingLevel = 0;

  function flushText() {
    if (!textBuffer.trim() && textBuffer !== '\n\n') {
      textBuffer = '';
      return;
    }

    const text = textBuffer
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    if (!text.trim() && !text.includes('\n')) {
      textBuffer = '';
      return;
    }

    const fontSize = isHeading
      ? [0, 24, 20, 17, 14, 13, 12][headingLevel] || 14
      : currentFontSize;

    const fontStyle = isHeading || currentBold
      ? (currentItalic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold')
      : (currentItalic ? 'Helvetica-Oblique' : 'Helvetica');

    doc.font(fontStyle).fontSize(fontSize);

    const lineText = text.replace(/\n+$/, '');
    if (lineText.trim()) {
      const x = inList ? 72 + listIndent + 12 : 72;
      const width = doc.page.width - x - 72;
      doc.text(lineText, x, undefined, { width, lineBreak: true, align: isHeading ? 'left' : 'left' });
    }

    // Handle paragraph/heading spacing
    if (text.endsWith('\n\n')) {
      doc.moveDown(isHeading ? 0.5 : 0.3);
    }

    textBuffer = '';
  }

  for (const part of blocks) {
    if (!part) continue;

    // Tag handling
    if (part.startsWith('<')) {
      const tag = part.toLowerCase().replace(/<\/?([a-z0-9]+)[^>]*>/, '$1');
      const isClose = part.startsWith('</');

      if (/^h[1-6]$/.test(tag)) {
        flushText();
        isHeading = !isClose;
        headingLevel = isClose ? 0 : parseInt(tag[1]);
      } else if (tag === 'strong' || tag === 'b') {
        flushText();
        currentBold = !isClose;
      } else if (tag === 'em' || tag === 'i') {
        flushText();
        currentItalic = !isClose;
      } else if (tag === 'ul' || tag === 'ol') {
        flushText();
        if (!isClose) { inList = true; listIndent = 0; }
        else { inList = false; listIndent = 0; }
      } else if (tag === 'li') {
        flushText();
        if (!isClose) {
          textBuffer = '• ';
        }
      } else if (tag === 'p') {
        if (isClose) textBuffer += '\n\n';
        else flushText();
      }
      // Skip other tags (span, div, td, th, table, tr, etc.)
    } else {
      // Text content
      textBuffer += part;
    }
  }

  flushText();

  // If nothing was rendered, show a fallback message
  if (doc.bufferedPageRange().count === 1 && doc.y < 100) {
    doc.font('Helvetica').fontSize(11).text('Document content could not be fully rendered.', { align: 'center' });
  }
}

module.exports = { wordToPdf };
