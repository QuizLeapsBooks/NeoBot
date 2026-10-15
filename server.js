import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { sessionRouter } from './backend/routes/session.js';
import { setupWebSocketProxy } from './backend/routes/proxy.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigin === '*') {
      return callback(null, true);
    }
    const origins = allowedOrigin.split(',').map((o) => o.trim());
    if (origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve frontend static assets (index.html, css/, js/) from root
app.use(express.static('.'));

// Health check endpoint (for Render health checks & frontend wake-up pings)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'neobot-backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    model: process.env.GEMINI_MODEL || 'gemini-3.8-live',
    voice: process.env.GEMINI_VOICE || 'Puck',
    robotName: process.env.ROBOT_NAME || 'NeoBot',
    hasApiKey: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    )
  });
});

// Mount session API routes
app.use('/api', sessionRouter);

// Fallback 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error'
  });
});

// Create HTTP Server & attach WebSocket proxy
const server = http.createServer(app);
setupWebSocketProxy(server);

// Start server
server.listen(PORT, () => {
  console.log(`🤖 NeoBot Server listening on port ${PORT}`);
  console.log(`📡 Local Web Interface: http://localhost:${PORT}`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Gemini Key Configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
});

// Graceful shutdown
const handleShutdown = (signal) => {
  console.log(`[Server] Received ${signal}. Shutting down cleanly...`);
  server.close(() => {
    console.log('[Server] HTTP and WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
