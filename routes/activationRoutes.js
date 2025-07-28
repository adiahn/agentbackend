const express = require('express');
const router = express.Router();
const activationController = require('../controllers/activationController');
const { authenticateToken, requireSuperAdmin, excludeSuperAdmin } = require('../middleware/auth');
const { activationCodeValidation, queryValidation } = require('../middleware/validation');

// Regular admin routes (authentication required, super admin excluded)
router.post('/generate', authenticateToken, excludeSuperAdmin, activationCodeValidation.generate, activationController.generateCodes);
router.get('/my-codes', authenticateToken, excludeSuperAdmin, queryValidation.pagination, activationController.getMyCodes);
router.get('/code/:codeId', authenticateToken, excludeSuperAdmin, activationCodeValidation.getCode, activationController.getCode);
router.put('/deactivate/:codeId', authenticateToken, excludeSuperAdmin, activationCodeValidation.deactivateCode, activationController.deactivateCode);

// Public route for using activation codes (agent registration)
router.post('/use', activationCodeValidation.useCode, activationController.useCode);

// Super admin only routes
router.get('/all', authenticateToken, requireSuperAdmin, queryValidation.pagination, activationController.getAllCodes);

module.exports = router; 