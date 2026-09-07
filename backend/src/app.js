import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();

// Behind a platform reverse proxy (Render/Railway/Vercel/etc.) in
// production, requests arrive from the proxy's own address unless Express is
// told to trust X-Forwarded-For — without this, express-rate-limit either
// mis-keys every visitor to the same proxy IP or throws its
// X-Forwarded-For validation error. Left off locally so dev keeps keying on
// the real socket address.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet());

// CORS — FRONTEND_ORIGINS is a comma-separated allowlist of exact origins
// (replaces the old single FRONTEND_URL). PREVIEW_ORIGIN_REGEX is an
// explicit, off-by-default opt-in for platforms with rotating preview URLs
// (e.g. Vercel) — never default this to a wildcard like `*.vercel.app`,
// which would authorize any tenant's deployment on that platform to make
// credentialed requests here. When set, anchor it at both ends and escape
// literal dots, or an unanchored/unescaped pattern also matches something
// like "portfolio-abc-myteam.vercel.app.attacker.com".
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const previewOriginRegex = process.env.PREVIEW_ORIGIN_REGEX
  ? new RegExp(process.env.PREVIEW_ORIGIN_REGEX)
  : null;

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header at all: curl, server-to-server calls, uptime
    // monitors. CORS is a browser-enforced mechanism — these clients ignore
    // it regardless, so rejecting here would only break legitimate
    // non-browser callers, not add real protection.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (previewOriginRegex && previewOriginRegex.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  // X-Requested-With is required by the CSRF mechanism (7.3): it is
  // deliberately not a CORS-safelisted header, so requiring it on
  // state-changing admin requests forces a preflight that an origin outside
  // this allowlist fails.
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security sanitization
app.use(mongoSanitize());

// Performance
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Liveness: 200 whenever the process is up, regardless of DB state. Point
// container/platform health checks at /ready instead — a 200 here while the
// database is down is not something they can act on.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness: reflects whether this instance can actually serve requests
// that touch the database. mongoose.connection.readyState === 1 is
// 'connected'; anything else (0 disconnected, 2 connecting, 3 disconnecting)
// is not ready.
app.get('/ready', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ready' : 'not ready',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

export default app;
