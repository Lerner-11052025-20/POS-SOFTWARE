const { Server } = require('socket.io');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowed = /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.).*$/;
        if (allowed.test(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
    });

    socket.on('join_kitchen_room', () => {
      socket.join('kitchen');
      console.log(`Socket ${socket.id} joined KITCHEN room`);
    });

    socket.on('join_table_room', (token) => {
      socket.join(`table_${token}`);
      console.log(`Socket ${socket.id} joined TABLE room: table_${token}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitOrderUpdate = (orderId, statusData) => {
  if (io) {
    // 1. Notify specific order room (Customer)
    io.to(`order_${orderId}`).emit('order_status_updated', statusData);
    
    // 2. Notify kitchen room (Staff)
    io.to('kitchen').emit('kitchen_order_updated', { orderId, ...statusData });
    
    console.log(`Emitted update for order_${orderId} and KITCHEN:`, statusData.status);
  }
};

module.exports = { init, getIO, emitOrderUpdate };