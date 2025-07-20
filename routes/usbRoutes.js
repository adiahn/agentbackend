const express = require('express');
const router = express.Router();
const usbController = require('../controllers/usbController');
const { authenticateToken } = require('../middleware/auth');
const { usbValidation } = require('../middleware/validation');

// Public routes for agents (no authentication required)
router.get('/agent/:agentId/usb-commands', usbValidation.getPendingUsbCommands, usbController.getPendingUsbCommands);
router.post('/agent/:agentId/usb-command/:commandId/start', usbValidation.startUsbCommand, usbController.startUsbCommand);
router.post('/agent/:agentId/usb-command/:commandId/complete', usbValidation.completeUsbCommand, usbController.completeUsbCommand);

// Protected routes (authentication required)
router.post('/agent/:agentId/usb-command', authenticateToken, usbValidation.sendUsbCommand, usbController.sendUsbCommand);
router.get('/agent/:agentId/usb-status', authenticateToken, usbValidation.getUsbStatus, usbController.getUsbStatus);
router.get('/agent/:agentId/usb-history', authenticateToken, usbValidation.getUsbHistory, usbController.getUsbHistory);

module.exports = router; 