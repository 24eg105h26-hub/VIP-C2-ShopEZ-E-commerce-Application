const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        logger.debug(`Socket ${socket.id} joined room: ${userId}`);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
    logger.debug(`Real-time event '${event}' dispatched to room: ${userId}`);
  }
};

const sendToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    logger.debug(`Real-time event '${event}' broadcasted to all sockets`);
  }
};

module.exports = {
  initSocket,
  sendToUser,
  sendToAll
};
