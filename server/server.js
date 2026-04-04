const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// — Middleware —

// CORS — allow frontend
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// — Routes —
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/pos', authLimiter, require('./routes/pos'));
app.use('/api/orders', authLimiter, require('./routes/orders'));
app.use('/api/payments', authLimiter, require('./routes/payments'));
app.use('/api/customers', authLimiter, require('./routes/customers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '☕ Odoo POS Cafe API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// — Start Server —
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n  ☕ ═══════════════════════════════════════`);
  console.log(`  ☕  Odoo POS Cafe API Server`);
  console.log(`  ☕  Running on port ${PORT}`);
  console.log(`  ☕  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ☕ ═══════════════════════════════════════\n`);
});

module.exports = app;
