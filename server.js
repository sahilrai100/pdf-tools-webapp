require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { ensureDirs } = require('./utils/fileUtils');
const { startCleaner } = require('./middleware/fileCleaner');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

// Ensure upload/output directories exist
ensureDirs();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);

// Serve tool pages
app.get('/pages/:page', (req, res) => {
  const pagePath = path.join(__dirname, 'public', 'pages', req.params.page);
  if (require('fs').existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Global error handler
app.use(errorHandler);

// Start file cleaner
startCleaner();

const server = app.listen(config.port, () => {
  console.log(`\n✅ PDF Converter running at http://localhost:${config.port}`);
  console.log(`📁 Uploads: ${config.uploadDir}`);
  console.log(`📁 Outputs: ${config.outputDir}`);
  console.log(`🕐 File TTL: ${config.fileTtlMinutes} minutes\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${config.port} is already in use.`);
    console.error(`   Run this command to fix it, then try again:`);
    console.error(`   npx kill-port ${config.port}\n`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
