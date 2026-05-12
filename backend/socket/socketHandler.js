let io;

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000'
]);

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`User connected via socket: ${socket.id}`);

      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room.`);

      });

      socket.on('sendMessage', (data) => {

        console.log('Message received on socket:', data);

        io.to(data.receiverId).emit('receiveMessage', data);
      });

      socket.on('newPost', (post) => {

        socket.broadcast.emit('postUpdate', post);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
