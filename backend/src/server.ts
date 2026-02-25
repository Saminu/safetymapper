import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import config from './config';
import connectDB from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import eventRoutes, { videoRouter, imageRouter } from './routes/eventRoutes';
import mapperRoutes from './routes/mapperRoutes';
import sessionRoutes from './routes/sessionRoutes';
import adminRoutes from './routes/adminRoutes';
const app = express();

// ── Security & Middleware ──────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow video streaming cross-origin
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// ── Static Files ───────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/videos', videoRouter);
app.use('/api/media/images', imageRouter);
app.use('/api/mappers', mapperRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/network-stats', (_req, res) => {
  // Redirect to session's network stats handler
  res.redirect(307, '/api/sessions/network-stats');
});

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

// ── Welcome Route ──────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'SafetyMapper API',
    version: '1.0.0',
    description: 'Backend API for SafetyMapper - Real-time safety event mapping platform',
    docs: '/api/health',
    endpoints: {
      auth: {
        'POST /api/auth/user/signup': 'Register a new user',
        'POST /api/auth/user/login': 'Login as user',
        'POST /api/auth/mapper/signup': 'Register a new mapper',
        'POST /api/auth/mapper/login': 'Login as mapper',
        'POST /api/auth/refresh': 'Refresh access token',
        'GET /api/auth/me': 'Get current profile',
        'DELETE /api/auth/account': 'Delete account',
        'PUT /api/auth/password': 'Change password',
      },
      events: {
        'GET /api/events': 'Get all events (filterable)',
        'GET /api/events/active': 'Get active events for map',
        'GET /api/events/recent': 'Get recent events in area',
        'GET /api/events/:id': 'Get single event',
        'POST /api/events': 'Create event (with video)',
        'POST /api/events/:id/update': 'Update event status (mapper)',
        'DELETE /api/events/:id': 'Delete event',
      },
      mappers: {
        'GET /api/mappers': 'Get all mappers (public)',
        'GET /api/mappers/profile': 'Get mapper profile',
        'PUT /api/mappers/profile': 'Update mapper profile',
        'GET /api/mappers/earnings': 'Get earnings (daily/weekly/total)',
        'POST /api/mappers/withdraw': 'Request withdrawal',
        'GET /api/mappers/transactions': 'Transaction history',
        'PUT /api/mappers/location': 'Update live location',
      },
      sessions: {
        'GET /api/sessions': 'Get all sessions',
        'POST /api/sessions': 'Start mapping session',
        'GET /api/sessions/:id': 'Get session details',
        'PATCH /api/sessions/:id': 'Update/end session',
        'POST /api/sessions/:id/location': 'Update session location',
        'POST /api/sessions/:id/upload': 'Upload session video',
      },
      videos: {
        'GET /api/videos/:filename': 'Stream video (supports range requests)',
      },
      stats: {
        'GET /api/network-stats': 'Get network-wide statistics',
      },
    },
  });
});

// ── Error Handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(config.port, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║                                                           ║');
      console.log('║   🗺️  SafetyMapper API Server                              ║');
      console.log(`║   🌐 Running on: http://localhost:${config.port}                  ║`);
      console.log(`║   📊 Environment: ${config.nodeEnv.padEnd(38)}║`);
      console.log('║   ✅ MongoDB Connected                                    ║');
      console.log('║                                                           ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
