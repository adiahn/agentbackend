const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireSuperAdmin, requireVerifiedAdmin } = require('../middleware/auth');
const { adminValidation, validateAccessRequestRejection } = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/register', adminValidation.register, adminController.registerAdmin);
router.post('/login', adminValidation.login, adminController.loginAdmin);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, adminController.getProfile);
router.put('/profile', authenticateToken, adminValidation.updateProfile, adminController.updateProfile);
router.put('/change-password', authenticateToken, adminValidation.changePassword, adminController.changePassword);

// Super admin only routes
router.get('/all', authenticateToken, requireSuperAdmin, adminController.getAllAdmins);



// Super admin endpoints for verification workflow
router.get('/pending', authenticateToken, requireSuperAdmin, adminController.getPendingAdmins);
router.post('/verify/:adminId', authenticateToken, requireSuperAdmin, adminController.verifyAdmin);
router.post('/reject/:adminId', authenticateToken, requireSuperAdmin, adminController.rejectAdmin);

// Access Request Management Routes (Super Admin Only)
router.get('/access-requests', authenticateToken, requireSuperAdmin, adminController.getAccessRequests);
router.get('/access-requests/stats', authenticateToken, requireSuperAdmin, adminController.getAccessRequestStats);
router.get('/access-requests/:id', authenticateToken, requireSuperAdmin, adminController.getAccessRequest);
router.put('/access-requests/:id/approve', authenticateToken, requireSuperAdmin, adminController.approveAccessRequest);
router.put('/access-requests/:id/reject', authenticateToken, requireSuperAdmin, validateAccessRequestRejection, adminController.rejectAccessRequest);

module.exports = router; 