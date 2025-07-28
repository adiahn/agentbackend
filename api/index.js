const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const CleanupService = require('../services/cleanupService');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const adminRoutes = require('../routes/adminRoutes');
const agentRoutes = require('../routes/agentRoutes');
const activationRoutes = require('../routes/activationRoutes');
const commandRoutes = require('../routes/commandRoutes');
const lockdownRoutes = require('../routes/lockdownRoutes');
const usbRoutes = require('../routes/usbRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const authRoutes = require('../routes/authRoutes');

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/command', commandRoutes);
app.use('/api/lockdown', lockdownRoutes);
app.use('/api/usb', usbRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    features: [
      'Agent Management',
      'Admin Authentication',
      'Activation Code System',
      'Lockdown System',
      'USB Control',
      'Command Management',
      'Analytics Dashboard',
      'Super Admin Analytics',
      'Access Request System'
    ],
    endpoints: {
      health: '/api/health',
      admin: '/api/admin',
      activation: '/api/activation',
      agent: '/api/agent',
      lockdown: '/api/lockdown',
      usb: '/api/usb',
      commands: '/api/commands',
      analytics: '/api/analytics',
      superAnalytics: '/api/analytics/super',
      auth: '/api/auth'
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SystemMonitor Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: [
      'Agent Management',
      'Admin Authentication',
      'Activation Code System',
      'Lockdown System',
      'USB Control',
      'Command Management',
      'Analytics Dashboard',
      'Super Admin Analytics',
      'Access Request System'
    ],
    documentation: {
      health: '/api/health',
      admin: '/api/admin',
      activation: '/api/activation',
      agent: '/api/agent',
      lockdown: '/api/lockdown',
      usb: '/api/usb',
      commands: '/api/commands',
      analytics: '/api/analytics',
      superAnalytics: '/api/analytics/super',
      auth: '/api/auth'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  });
}

// For Vercel serverless deployment
module.exports = app; 