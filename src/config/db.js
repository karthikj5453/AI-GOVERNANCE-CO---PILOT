const mongoose = require('mongoose');
const logger = require('../modules/utils/logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/AI-goverence-Copilot';
    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
