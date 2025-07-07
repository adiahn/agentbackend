const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const commandController = require('../controllers/commandController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { agentValidation, commandValidation } = require('../middleware/validation');

// Public route for agent reporting (no authentication required)
router.post('/report', agentValidation.report, agentController.reportAgent);

// Public route for agent command polling (no authentication required)
router.get('/:agentId/commands', commandValidation.getPendingCommands, commandController.getPendingCommands);

// Protected routes (authentication required)
router.get('/my-agents', authenticateToken, agentController.getMyAgents);
router.get('/:agentId', authenticateToken, agentValidation.getAgent, agentController.getAgent);
router.put('/deactivate/:agentId', authenticateToken, agentValidation.deactivateAgent, agentController.deactivateAgent);

// Super admin only routes
router.get('/agents', authenticateToken, requireSuperAdmin, agentController.getAllAgents);

module.exports = router; 