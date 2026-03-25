const mongoose = require('mongoose');
const config = require('./config');

let isConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    isConnected = false;
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Auth features (login/signup) will be unavailable.');
    console.error('   To fix: install & start MongoDB, or set MONGO_URI in .env');
  }

  // Handle disconnect after initial connect
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️  MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('✅ MongoDB reconnected');
  });
}

function getConnectionStatus() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, getConnectionStatus };
