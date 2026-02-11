// ==========================================
// MongoDB Connection
// ==========================================

const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      // Production-recommended settings
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const logger = require('../services/logger');
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`, {
      database: conn.connection.name,
    });
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
