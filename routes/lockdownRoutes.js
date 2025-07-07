const express = require('express');
const router = express.Router();
const lockdownController = require('../controllers/lockdownController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { lockdownValidation } = require('../middleware/validation');

// Public routes for agents (no authentication required)
router.post('/agent/:agentId/verify-pin', lockdownValidation.verifyPin, lockdownController.verifyPin);
router.post('/agent/:agentId/unlock-pin', lockdownValidation.unlockWithPin, lockdownController.unlockWithPin);
router.post('/agent/:agentId/heartbeat', lockdownController.updateHeartbeat);
router.get('/agent/:agentId/validate-state', lockdownController.validateLockdownState);

// Protected routes (authentication required)
router.post('/agent/:agentId/lockdown', authenticateToken, lockdownValidation.initiateLockdown, lockdownController.initiateLockdown);
router.post('/agent/:agentId/release', authenticateToken, lockdownValidation.releaseLockdown, lockdownController.releaseLockdown);
router.post('/agent/:agentId/emergency-override', authenticateToken, lockdownValidation.emergencyOverride, lockdownController.emergencyOverride);
router.get('/agent/:agentId/status', authenticateToken, lockdownValidation.getStatus, lockdownController.getLockdownStatus);
router.get('/agent/:agentId/history', authenticateToken, lockdownValidation.getHistory, lockdownController.getLockdownHistory);

// Super admin only routes
router.get('/all', authenticateToken, requireSuperAdmin, lockdownValidation.getAllLockdowns, lockdownController.getAllLockdowns);

module.exports = router; 