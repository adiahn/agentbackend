const { validationResult } = require('express-validator');
const AccessRequest = require('../models/AccessRequest');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Request access endpoint
const requestAccess = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          acc[error.path] = error.msg;
          return acc;
        }, {})
      });
    }

    const {
      companyName,
      businessRegNumber,
      nin,
      phone,
      email,
      password,
      confirmPassword,
      terms
    } = req.body;

    // Check if terms are accepted
    if (!terms || terms !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          terms: 'You must accept the terms and conditions'
        }
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          confirmPassword: 'Passwords do not match'
        }
      });
    }

    // Check if email already exists in AccessRequest or Admin
    const existingAccessRequest = await AccessRequest.findByEmail(email);
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAccessRequest || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          email: 'Email already exists in the system'
        }
      });
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          document: 'Business registration document is required'
        }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          document: 'Only PDF, JPG, JPEG, and PNG files are allowed'
        }
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          document: 'File size must be less than 10MB'
        }
      });
    }

    // Upload file to Cloudinary
    let uploadResult;
    try {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is missing');
      }

      const uniqueFilename = `business-docs/${uuidv4()}-${req.file.originalname}`;
      
      // Convert buffer to base64 for Cloudinary
      const fileBuffer = req.file.buffer;
      const base64File = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
      
      uploadResult = await cloudinary.uploader.upload(base64File, {
        public_id: uniqueFilename,
        resource_type: 'auto',
        folder: 'systemmonitor/business-documents'
      });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      console.error('Error details:', {
        message: uploadError.message,
        code: uploadError.code,
        status: uploadError.status
      });
      return res.status(500).json({
        success: false,
        message: 'File upload failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
      });
    }

    // Create access request
    const accessRequest = new AccessRequest({
      companyName,
      businessRegNumber,
      documentUrl: uploadResult.secure_url,
      documentFilename: req.file.originalname,
      nin,
      phone,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = accessRequest.generateEmailVerificationToken();

    // Save the access request
    await accessRequest.save();

    // Send confirmation email (implement email service)
    await sendRequestConfirmationEmail(email, companyName, verificationToken);

    // Notify admins (implement admin notification)
    await notifyAdminsOfNewRequest(accessRequest);

    res.status(200).json({
      success: true,
      message: 'Access request submitted successfully. You will be notified once approved.',
      requestId: accessRequest._id
    });

  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again.'
    });
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const accessRequest = await AccessRequest.findByVerificationToken(token);
    
    if (!accessRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    accessRequest.verifyEmail();
    await accessRequest.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check request status
const checkRequestStatus = async (req, res) => {
  try {
    const { email } = req.params;

    const accessRequest = await AccessRequest.findByEmail(email);
    
    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: accessRequest.status,
        companyName: accessRequest.companyName,
        email: accessRequest.email,
        createdAt: accessRequest.createdAt,
        rejectionReason: accessRequest.rejectionReason,
        approvedAt: accessRequest.approvedAt
      }
    });

  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Email service functions (placeholder - implement with your email service)
const sendRequestConfirmationEmail = async (email, companyName, verificationToken) => {
  try {
    // Implement email sending logic here
    // You can use services like SendGrid, Nodemailer, etc.
    console.log(`Sending confirmation email to ${email} for ${companyName}`);
    console.log(`Verification token: ${verificationToken}`);
    
    // Example with a simple console log for now
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    console.log(`Verification URL: ${verificationUrl}`);
    
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

const sendApprovalEmail = async (email, companyName) => {
  try {
    // Implement approval email logic
    console.log(`Sending approval email to ${email} for ${companyName}`);
    
  } catch (error) {
    console.error('Approval email error:', error);
  }
};

const sendRejectionEmail = async (email, companyName, reason) => {
  try {
    // Implement rejection email logic
    console.log(`Sending rejection email to ${email} for ${companyName}`);
    console.log(`Rejection reason: ${reason}`);
    
  } catch (error) {
    console.error('Rejection email error:', error);
  }
};

const notifyAdminsOfNewRequest = async (accessRequest) => {
  try {
    // Implement admin notification logic
    console.log(`Notifying admins of new access request from ${accessRequest.companyName}`);
    
  } catch (error) {
    console.error('Admin notification error:', error);
  }
};

module.exports = {
  requestAccess,
  verifyEmail,
  checkRequestStatus,
  sendRequestConfirmationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  notifyAdminsOfNewRequest
}; 