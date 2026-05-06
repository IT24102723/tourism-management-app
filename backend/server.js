// ============================================================
//  server.js — Tourism Support System API Entry Point
//  Node.js + Express | MySQL (XAMPP) | JWT Auth
// ============================================================
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');

// ── Internal modules ────────────────────────────────────────
const { connectMongo } = require('./config/mongo');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const attractionRoutes = require('./routes/attraction.routes');
const packageRoutes = require('./routes/package.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const transportRoutes = require('./routes/transport.routes');
const providerRoutes = require('./routes/provider.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const uploadRoutes = require('./routes/upload.routes');

// ── App initialisation ───────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5051;

// Required for Railway/Vercel/Heroku to correctly identify the user's IP
// for the express-rate-limit middleware.
app.set('trust proxy', 1);

// ── Security & logging middleware ────────────────────────────
app.use(helmet());                              // Sets secure HTTP headers

app.use(cors({
  origin: [
    'http://localhost:8081',
    'https://tourism-management-app-beta.vercel.app',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 🔍 DEBUG: Log all incoming connections
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (uploaded images, etc.) ────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Global rate limiter (protect all routes) ─────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,               // max 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Strict limiter for auth endpoints ────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts.' },
});

// ── Health-check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tourism Support System API is running.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Root route to avoid 404 logs on base URL
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Tourism Support System API' });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/attractions', attractionRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/upload', uploadRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Centralised error handler ──────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
(async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongo();
    console.log('✅ MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      const nets = os.networkInterfaces();
      const addresses = [];
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(`http://${net.address}:${PORT}`);
          }
        }
      }

      console.log(`\n🚀  Tourism Support System API`);
      console.log(`   Listening on  : http://0.0.0.0:${PORT}`);
      console.log(`   Primary IP    : http://${addresses[0].split('://')[1]}`);
      console.log(`   Available IPs : ${addresses.join(', ')}`);
      console.log(`   Environment   : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check  : ${addresses[0]}/api/health\n`);
    });
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
})();

module.exports = app;   // for testing
