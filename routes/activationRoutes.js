const express = require('express');
const router = express.Router();
const activationController = require('../controllers/activationController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { activationCodeValidation, queryValidation } = require('../middleware/validation');

// Protected routes (authentication required)
router.post('/generate', authenticateToken, activationCodeValidation.generate, activationController.generateCodes);
router.get('/my-codes', authenticateToken, queryValidation.pagination, activationController.getMyCodes);
router.get('/code/:codeId', authenticateToken, activationCodeValidation.getCode, activationController.getCode);
router.put('/deactivate/:codeId', authenticateToken, activationCodeValidation.deactivateCode, activationController.deactivateCode);

// Public route for using activation codes (agent registration)
router.post('/use', activationCodeValidation.useCode, activationController.useCode);

// Super admin only routes
router.get('/all', authenticateToken, requireSuperAdmin, queryValidation.pagination, activationController.getAllCodes);

module.exports = router; 