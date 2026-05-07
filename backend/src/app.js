'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const { defaultLimiter } = require('./middleware/rateLimit');

// Module routers
const authRouter = require('./modules/auth');
const landRouter = require('./modules/land');
const listingRouter = require('./modules/listing');
const userRouter = require('./modules/user');
const heatmapRouter = require('./modules/heatmap');
const comparisonRouter = require('./modules/comparison');
const bankValuationRouter = require('./modules/bankValuation');
const paymentRouter = require('./modules/payment');
const adminRouter = require('./modules/admin');
const crawlerRouter = require('./modules/crawler');
const chatRouter = require('./modules/chat');

// Search router (inline — uses land + listing repositories)
const searchRouter = require('./search.routes');

const app = express();

// ============================================================
// Security & Parsing Middleware
// ============================================================
app.set('trust proxy', 1);
app.set('etag', false); // Disable ETags — Redis handles server-side caching; ETags cause 304s with empty browser cache

app.use(helmet({
  contentSecurityPolicy: false, // adjust per frontend needs
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(config.isDev ? 'dev' : 'combined'));

// ============================================================
// Rate limiting (applies to all routes)
// ============================================================
app.use(defaultLimiter);

// ============================================================
// Health check
// ============================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version || '1.0.0' });
});

// ============================================================
// API Routes
// ============================================================
const prefix = config.server.apiPrefix;

app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/lands`, landRouter);
app.use(`${prefix}/listings`, listingRouter);
app.use(`${prefix}/users/me`, userRouter);
app.use(`${prefix}/heatmap`, heatmapRouter);
app.use(`${prefix}/comparison`, comparisonRouter);
app.use(`${prefix}/comparisons`, comparisonRouter);
app.use(`${prefix}/bank-valuations`, bankValuationRouter);
app.use(`${prefix}/payment`, paymentRouter);
app.use(`${prefix}/admin`, adminRouter);
app.use(`${prefix}/admin/crawler`, crawlerRouter);
app.use(`${prefix}/chat`, chatRouter);
app.use(`${prefix}/search`, searchRouter);

// ============================================================
// 404 handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
});

// ============================================================
// Global error handler (must be last)
// ============================================================
app.use(errorHandler);

module.exports = app;
