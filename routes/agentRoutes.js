const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const commandController = require('../controllers/commandController');
const { authenticateToken, requireSuperAdmin, excludeSuperAdmin } = require('../middleware/auth');
const { agentValidation, commandValidation } = require('../middleware/validation');

// Public route for agent reporting (no authentication required)
router.post('/report', agentValidation.report, agentController.reportAgent);

// Public route for agent command polling (no authentication required)
router.get('/:agentId/commands', commandValidation.getPendingCommands, commandController.getPendingCommands);

// Regular admin routes (authentication required, super admin excluded)
router.get('/my-agents', authenticateToken, excludeSuperAdmin, agentController.getMyAgents);
router.get('/:agentId', authenticateToken, excludeSuperAdmin, agentValidation.getAgent, agentController.getAgent);
router.put('/:agentId', authenticateToken, excludeSuperAdmin, agentValidation.updateAgent, agentController.updateAgent);
router.put('/deactivate/:agentId', authenticateToken, excludeSuperAdmin, agentValidation.deactivateAgent, agentController.deactivateAgent);

// Super admin only routes
router.get('/agents', authenticateToken, requireSuperAdmin, agentController.getAllAgents);

module.exports = router; 