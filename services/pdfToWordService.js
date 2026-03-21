const fs = require('fs');
const { generateOutputPath } = require('../utils/fileUtils');

// PDF to Word requires LibreOffice installed on the system.
// This service uses libreoffice-convert if available.
async function pdfToWord(filePath) {
  let libre;
  try {
    libre = require('libreoffice-convert');
    libre.convertAsync = require('util').promisify(libre.convert);
  } catch (e) {
    throw new Error(
      'PDF to Word conversion requires LibreOffice to be installed. ' +
      'Please install LibreOffice from https://www.libreoffice.org and try again.'
    );
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const outputPath = generateOutputPath('docx');

  try {
    const docxBuffer = await libre.convertAsync(pdfBuffer, '.docx', undefined);
    fs.writeFileSync(outputPath, docxBuffer);
    return outputPath;
  } catch (err) {
    if (err.code === 'ENOENT' || err.message.includes('soffice')) {
      throw new Error(
        'LibreOffice is not found. Please install it from https://www.libreoffice.org and add it to your PATH.'
      );
    }
    throw err;
  }
}

module.exports = { pdfToWord };
