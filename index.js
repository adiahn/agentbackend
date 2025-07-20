const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const CleanupService = require('./services/cleanupService');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const agentRoutes = require('./routes/agentRoutes');
const activationRoutes = require('./routes/activationRoutes');
const commandRoutes = require('./routes/commandRoutes');
const lockdownRoutes = require('./routes/lockdownRoutes');
const usbRoutes = require('./routes/usbRoutes');

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/command', commandRoutes);
app.use('/api/lockdown', lockdownRoutes);
app.use('/api/usb', usbRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'SystemMonitor Backend is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Admin Authentication',
      'Activation Code Management',
      'Agent Management',
      'JWT Security',
      'Enhanced Lockdown System with PIN',
      'Persistent Lockdown State',
      'Emergency Override',
      'Audit Trail & History',
      'USB Control System'
    ]
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'SystemMonitor Backend API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      admin: '/api/admin',
      agent: '/api/agent',
      activation: '/api/activation',
      command: '/api/command',
      lockdown: '/api/lockdown',
      usb: '/api/usb'
    },
    features: [
      'Admin Authentication',
      'Activation Code Management',
      'Agent Management',
      'JWT Security',
      'Enhanced Lockdown System with PIN',
      'Persistent Lockdown State',
      'Emergency Override',
      'Audit Trail & History',
      'USB Control System'
    ]
  });
});

// Schedule cleanup tasks
const scheduleCleanup = () => {
  // Run cleanup every hour
  setInterval(async () => {
    try {
      await CleanupService.runCleanup();
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Run initial cleanup after 5 minutes
  setTimeout(async () => {
    try {
      await CleanupService.runCleanup();
    } catch (error) {
      console.error('Initial cleanup failed:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

// Start cleanup schedule
scheduleCleanup();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`SystemMonitor Backend listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`API base: http://localhost:${PORT}/api`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`Activation API: http://localhost:${PORT}/api/activation`);
  console.log(`Lockdown API: http://localhost:${PORT}/api/lockdown`);
  console.log('Enhanced Lockdown System with PIN Control is active!');
}); 