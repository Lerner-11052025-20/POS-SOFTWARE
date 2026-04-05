const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const http = require('http');
const socketUtils = require('./utils/socket');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketUtils.init(server);

app.use(
  cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000, 
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/pos', authLimiter, require('./routes/pos'));
app.use('/api/orders', authLimiter, require('./routes/orders'));
app.use('/api/payments', authLimiter, require('./routes/payments'));
app.use('/api/customers', authLimiter, require('./routes/customers'));
app.use('/api/products', authLimiter, require('./routes/products'));
app.use('/api/categories', authLimiter, require('./routes/categories'));
app.use('/api/floors', authLimiter, require('./routes/floors'));
app.use('/api/tables', authLimiter, require('./routes/tables'));
app.use('/api/kitchen', authLimiter, require('./routes/kitchen'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '☕ Odoo POS Cafe API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n  ☕ ═══════════════════════════════════════`);
  console.log(`  ☕  Odoo POS Cafe API Server`);
  console.log(`  ☕  Running on port ${PORT}`);
  console.log(`  ☕  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ☕ ═══════════════════════════════════════\n`);
});

module.exports = app;
