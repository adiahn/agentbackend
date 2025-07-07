const express = require('express');
const router = express.Router();
const commandController = require('../controllers/commandController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { commandValidation, queryValidation } = require('../middleware/validation');

// Public routes for agents (no authentication required)
router.get('/agent/:agentId/commands', commandValidation.getPendingCommands, commandController.getPendingCommands);
router.post('/agent/:agentId/command/:commandId/start', commandValidation.startCommand, commandController.startCommand);
router.post('/agent/:agentId/command/:commandId/complete', commandValidation.completeCommand, commandController.completeCommand);

// Protected routes (authentication required)
router.post('/agent/:agentId/command', authenticateToken, commandValidation.sendCommand, commandController.sendCommand);
router.get('/my-commands', authenticateToken, queryValidation.pagination, commandController.getMyCommands);

module.exports = router; 