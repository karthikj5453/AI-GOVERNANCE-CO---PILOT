require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./src/modules/utils/logger');
const config = require('./src/config/env');

const server = http.createServer(app);

// Socket.io for real-time updates
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  next();
});

io.on('connection', (socket) => {
  logger.info('New client connected');

  socket.on('join-simulation', (simulationId) => {
    socket.join(`simulation:${simulationId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = config.port || 5010;

server.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = server;
