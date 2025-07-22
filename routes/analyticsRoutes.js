const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { query, param } = require('express-validator');

// Analytics validation middleware
const analyticsValidation = {
  agentActivity: [
    query('period')
      .optional()
      .isIn(['24h', '7d', '30d', '90d', '1y'])
      .withMessage('Period must be one of: 24h, 7d, 30d, 90d, 1y'),
    query('granularity')
      .optional()
      .isIn(['hourly', 'daily', 'weekly', 'monthly'])
      .withMessage('Granularity must be one of: hourly, daily, weekly, monthly')
  ],
  
  performance: [
    query('period')
      .optional()
      .isIn(['24h', '7d', '30d'])
      .withMessage('Period must be one of: 24h, 7d, 30d'),
    query('granularity')
      .optional()
      .isIn(['hourly', 'daily'])
      .withMessage('Granularity must be one of: hourly, daily')
  ],
  
  commands: [
    query('period')
      .optional()
      .isIn(['24h', '7d', '30d'])
      .withMessage('Period must be one of: 24h, 7d, 30d')
  ],
  
  topAgents: [
    query('metric')
      .optional()
      .isIn(['uptime', 'cpu', 'memory', 'disk', 'commands'])
      .withMessage('Metric must be one of: uptime, cpu, memory, disk, commands'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  
  activationCodes: [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Period must be one of: 7d, 30d, 90d')
  ],
  
  alerts: [
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be one of: low, medium, high, critical'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// All analytics endpoints require authentication
router.use(authenticateToken);

// 1. Dashboard Overview Stats
router.get('/overview', analyticsController.getOverview);

// 2. Agent Activity Trends
router.get('/agent-activity', analyticsValidation.agentActivity, analyticsController.getAgentActivity);

// 3. System Performance Metrics
router.get('/performance', analyticsValidation.performance, analyticsController.getPerformanceMetrics);

// 4. Geographic Distribution
router.get('/geographic', analyticsController.getGeographicDistribution);

// 5. Command Analytics
router.get('/commands', analyticsValidation.commands, analyticsController.getCommandAnalytics);

// 6. Top Agents Performance
router.get('/top-agents', analyticsValidation.topAgents, analyticsController.getTopAgents);

// 7. Activation Code Analytics
router.get('/activation-codes', analyticsValidation.activationCodes, analyticsController.getActivationCodeAnalytics);

// 8. Alerts & Notifications
router.get('/alerts', analyticsValidation.alerts, analyticsController.getAlerts);

module.exports = router; 