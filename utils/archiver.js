const archiver = require('archiver');
const fs = require('fs');

function zipFiles(filePaths, outputPath, fileNames) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    filePaths.forEach((filePath, i) => {
      const name = fileNames ? fileNames[i] : require('path').basename(filePath);
      archive.file(filePath, { name });
    });

    archive.finalize();
  });
}

module.exports = { zipFiles };
