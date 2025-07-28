const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requestAccess, verifyEmail, checkRequestStatus } = require('../controllers/authController');
const { validateAccessRequest } = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
    }
  }
});

// Request access endpoint
router.post('/request-access', 
  upload.single('document'),
  validateAccessRequest,
  requestAccess
);

// Verify email endpoint
router.get('/verify-email/:token', verifyEmail);

// Check request status endpoint
router.get('/request-status/:email', checkRequestStatus);

module.exports = router; 