/**
 * Routes correspond to platform flow:
 * - /api/auth      → Sign up, login, me (JWT)
 * - /api/projects  → Admin creates Projects (folders), GET /tree for folder structure
 * - /api/services  → Step 2: Admin creates Service under Project, gets API key
 * - /api/ingest    → Steps 5–6: Admin's middleware sends metrics, we validate & save
 * - /api/usage/*   → Step 7: Dashboard fetches summary, endpoints, trends
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admins');
const ingestRoutes = require('./routes/ingest');
const usageRoutes = require('./routes/usage');
const servicesRoutes = require('./routes/services');
const projectsRoutes = require('./routes/projects');

const app = express();

// Rate limit for ingestion (e.g. 1000 requests per minute per IP)
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests', message: 'Please try again later' },
});

// Rate limit for dashboard API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests', message: 'Please try again later' },
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/admins', apiLimiter, adminRoutes);
app.use('/api/ingest', ingestLimiter, ingestRoutes);
app.use('/api/usage', apiLimiter, usageRoutes);
app.use('/api/services', apiLimiter, servicesRoutes);
app.use('/api/projects', apiLimiter, projectsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = app;
