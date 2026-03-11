const dotenv = require('dotenv');

dotenv.config();

// For prototype: use defaults if env vars not set (don't exit)
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'AI_SERVICE_URL'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.error(`Error: Environment variable ${envVar} is required in production`);
      process.exit(1);
    }
  });
}

module.exports = {
  port: process.env.PORT || 5010,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/AI-goverence-Copilot',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceTimeout: parseInt(process.env.AI_SERVICE_TIMEOUT),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX),
  logLevel: process.env.LOG_LEVEL
};
