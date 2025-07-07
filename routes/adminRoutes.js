const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { adminValidation } = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/register', adminValidation.register, adminController.registerAdmin);
router.post('/login', adminValidation.login, adminController.loginAdmin);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, adminController.getProfile);
router.put('/profile', authenticateToken, adminValidation.updateProfile, adminController.updateProfile);
router.put('/change-password', authenticateToken, adminValidation.changePassword, adminController.changePassword);

// Super admin only routes
router.get('/all', authenticateToken, requireSuperAdmin, adminController.getAllAdmins);

module.exports = router; 