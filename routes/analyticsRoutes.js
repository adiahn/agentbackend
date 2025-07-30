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

// ========================================
// SUPER ADMIN ANALYTICS ENDPOINTS
// ========================================
// All super admin endpoints require super admin authentication
router.use('/super', authenticateToken, requireSuperAdmin);

// 1. Super Admin Dashboard Overview Stats
router.get('/super/overview', analyticsController.getOverview);

// 2. Super Admin Agent Activity Trends
router.get('/super/agent-activity', analyticsValidation.agentActivity, analyticsController.getAgentActivity);

// 3. Super Admin System Performance Metrics
router.get('/super/performance', analyticsValidation.performance, analyticsController.getPerformanceMetrics);

// 4. Super Admin Geographic Distribution
router.get('/super/geographic', analyticsController.getGeographicDistribution);

// 5. Super Admin Command Analytics
router.get('/super/commands', analyticsValidation.commands, analyticsController.getCommandAnalytics);

// 6. Super Admin Top Agents Performance
router.get('/super/top-agents', analyticsValidation.topAgents, analyticsController.getTopAgents);

// 7. Super Admin Activation Code Analytics
router.get('/super/activation-codes', analyticsValidation.activationCodes, analyticsController.getActivationCodeAnalytics);

// 8. Super Admin Alerts & Notifications
router.get('/super/alerts', analyticsValidation.alerts, analyticsController.getAlerts);

// ========================================
// REGULAR ADMIN ANALYTICS ENDPOINTS
// ========================================
// All admin endpoints require regular authentication (filtered by adminId)

// 1. Admin Dashboard Overview Stats
router.get('/overview', authenticateToken, analyticsController.getAdminOverview);

// 2. Admin Agent Activity Trends
router.get('/agent-activity', authenticateToken, analyticsValidation.agentActivity, analyticsController.getAdminAgentActivity);

// 3. Admin Performance Metrics
router.get('/performance', authenticateToken, analyticsValidation.performance, analyticsController.getAdminPerformanceMetrics);

// 4. Admin Geographic Distribution
router.get('/geographic', authenticateToken, analyticsController.getAdminGeographicDistribution);

// 5. Admin Command Analytics
router.get('/commands', authenticateToken, analyticsValidation.commands, analyticsController.getAdminCommandAnalytics);

// 6. Admin Top Agents Performance
router.get('/top-agents', authenticateToken, analyticsValidation.topAgents, analyticsController.getAdminTopAgents);

// 7. Admin Activation Code Analytics
router.get('/activation-codes', authenticateToken, analyticsValidation.activationCodes, analyticsController.getAdminActivationCodeAnalytics);

// 8. Admin Alerts & Notifications
router.get('/alerts', authenticateToken, analyticsValidation.alerts, analyticsController.getAdminAlerts);

module.exports = router; 