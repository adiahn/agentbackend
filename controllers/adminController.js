const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const AccessRequest = require('../models/AccessRequest');
const { sendApprovalEmail, sendRejectionEmail } = require('./authController');

// Generate JWT token
const generateToken = (admin) => {
  return jwt.sign(
    { adminId: admin._id, verified: admin.verified, rejected: admin.rejected, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Multer + Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'admin_business_docs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    public_id: (req, file) => {
      return `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    }
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
      return cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
    cb(null, true);
  }
});





// Register new admin (only super admins can create other admins)
exports.registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'admin' } = req.body;

    // Check if super admin already exists (if role is super_admin)
    if (role === 'super_admin') {
      const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
      if (existingSuperAdmin) {
        return res.status(400).json({ error: 'A super admin already exists. Only one super admin is allowed.' });
      }
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already in use.' });
    }

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password,
      role
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: admin.toPublicJSON(),
      token
    });
  } catch (error) {
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
      if (error.keyPattern && error.keyPattern.username) {
        return res.status(400).json({ error: 'Username is already in use.' });
      }
      return res.status(400).json({ error: 'Duplicate key error.' });
    }
    console.error('Admin registration error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Admin login
exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin);

    res.json({
      message: 'Login successful',
      admin: { ...admin.toPublicJSON(), verified: admin.verified, rejected: admin.rejected },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    res.json({
      admin: req.admin
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update admin profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const admin = req.admin;

    // Check if email/username is already taken by another admin
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(400).json({ error: 'Username already in use' });
      }
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;

    await admin.save();

    res.json({
      message: 'Profile updated successfully',
      admin: admin.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const admin = req.admin;

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all admins (super admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({ admins });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users (admins + access requests) - super admin only
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      type, // 'all', 'admins', 'access_requests'
      status, // 'all', 'pending', 'approved', 'rejected', 'verified', 'unverified'
      page = 1, 
      limit = 20,
      search // search by email, company name, or username
    } = req.query;

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    let admins = [];
    let accessRequests = [];
    let totalAdmins = 0;
    let totalAccessRequests = 0;

    // Build admin query
    let adminQuery = {};
    if (status && status !== 'all') {
      if (status === 'verified') {
        adminQuery.verified = true;
        adminQuery.rejected = false;
      } else if (status === 'unverified') {
        adminQuery.verified = false;
        adminQuery.rejected = false;
      } else if (status === 'rejected') {
        adminQuery.rejected = true;
      }
    }

    // Build access request query
    let accessRequestQuery = {};
    if (status && status !== 'all') {
      if (['pending', 'approved', 'rejected'].includes(status)) {
        accessRequestQuery.status = status;
      }
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      adminQuery.$or = [
        { email: searchRegex },
        { username: searchRegex },
        { companyName: searchRegex }
      ];
      accessRequestQuery.$or = [
        { email: searchRegex },
        { companyName: searchRegex }
      ];
    }

    // Fetch admins if requested
    if (type !== 'access_requests') {
      const adminResults = await Admin.find(adminQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      admins = adminResults.map(admin => ({
        ...admin.toObject(),
        userType: 'admin',
        displayName: admin.companyName || admin.username || admin.email,
        status: admin.rejected ? 'rejected' : (admin.verified ? 'verified' : 'pending')
      }));

      totalAdmins = await Admin.countDocuments(adminQuery);
    }

    // Fetch access requests if requested
    if (type !== 'admins') {
      const accessRequestResults = await AccessRequest.find(accessRequestQuery)
        .select('-password -emailVerificationToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      accessRequests = accessRequestResults.map(request => ({
        ...request.toObject(),
        userType: 'access_request',
        displayName: request.companyName || request.email,
        status: request.status
      }));

      totalAccessRequests = await AccessRequest.countDocuments(accessRequestQuery);
    }

    // Combine and sort results
    let allUsers = [...admins, ...accessRequests];
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination to combined results
    const startIndex = skip;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    const totalUsers = totalAdmins + totalAccessRequests;

    res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers,
          totalAdmins,
          totalAccessRequests,
          hasNextPage: endIndex < totalUsers,
          hasPrevPage: page > 1
        },
        filters: {
          type: type || 'all',
          status: status || 'all',
          search: search || null
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
};

// List all pending admins (super admin only)
exports.getPendingAdmins = async (req, res) => {
  try {
    const pending = await Admin.find({ verified: false, rejected: false }).select('-password');
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Email helper function (placeholder - implement with your email service)
async function sendEmail(to, subject, text) {
  try {
    // Implement email sending logic here
    // You can use services like SendGrid, Nodemailer, etc.
    console.log(`Sending email to ${to}: ${subject}`);
    console.log(`Email content: ${text}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

// Approve admin (super admin only)
exports.verifyAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (admin.verified) return res.status(400).json({ error: 'Admin already verified' });
    admin.verified = true;
    admin.rejected = false;
    admin.verificationLog.push({ action: 'approved', by: req.admin._id });
    await admin.save();
    // Send approval email
    await sendEmail(
      admin.email,
      'Your Admin Account Has Been Approved',
      `Hello ${admin.companyName},\n\nYour admin account has been approved. You can now access all dashboard features.\n\nBest regards,\nVelixify Team`
    );
    res.json({ success: true, message: 'Admin approved and notified.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Reject admin (super admin only)
exports.rejectAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (admin.rejected) return res.status(400).json({ error: 'Admin already rejected' });
    admin.verified = false;
    admin.rejected = true;
    admin.verificationLog.push({ action: 'rejected', by: req.admin._id });
    await admin.save();
    // Send rejection email
    await sendEmail(
      admin.email,
      'Your Admin Account Request Was Rejected',
      `Hello ${admin.companyName},\n\nWe regret to inform you that your admin account request was rejected. Please contact support for more information.\n\nBest regards,\nVelixify Team`
    );
    res.json({ success: true, message: 'Admin rejected and notified.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all access requests (super admin only)
const getAccessRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const accessRequests = await AccessRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -emailVerificationToken');

    const total = await AccessRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests: accessRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNextPage: skip + accessRequests.length < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single access request (super admin only)
const getAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const accessRequest = await AccessRequest.findById(id)
      .select('-password -emailVerificationToken');

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: accessRequest
    });

  } catch (error) {
    console.error('Get access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve access request (super admin only)
const approveAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const accessRequest = await AccessRequest.findById(id);

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Access request is not pending'
      });
    }

    // Check if email is verified
    if (!accessRequest.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email must be verified before approval'
      });
    }

    // Create admin account from access request
    const admin = new Admin({
      username: accessRequest.email.split('@')[0], // Use email prefix as username
      email: accessRequest.email,
      password: accessRequest.password, // Password is already hashed
      role: 'admin',
      companyName: accessRequest.companyName,
      businessRegNumber: accessRequest.businessRegNumber,
      nin: accessRequest.nin,
      phone: accessRequest.phone
    });

    await admin.save();

    // Update access request status
    accessRequest.status = 'approved';
    accessRequest.approvedBy = adminId;
    accessRequest.approvedAt = new Date();
    await accessRequest.save();

    // Send approval email
    await sendApprovalEmail(accessRequest.email, accessRequest.companyName);

    res.status(200).json({
      success: true,
      message: 'Access request approved successfully',
      data: {
        requestId: accessRequest._id,
        adminId: admin._id,
        email: accessRequest.email,
        companyName: accessRequest.companyName
      }
    });

  } catch (error) {
    console.error('Approve access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject access request (super admin only)
const rejectAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const accessRequest = await AccessRequest.findById(id);

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Access request is not pending'
      });
    }

    // Update access request status
    accessRequest.status = 'rejected';
    accessRequest.rejectionReason = reason.trim();
    accessRequest.approvedBy = adminId;
    accessRequest.approvedAt = new Date();
    await accessRequest.save();

    // Send rejection email
    await sendRejectionEmail(accessRequest.email, accessRequest.companyName, reason);

    res.status(200).json({
      success: true,
      message: 'Access request rejected successfully',
      data: {
        requestId: accessRequest._id,
        email: accessRequest.email,
        companyName: accessRequest.companyName,
        rejectionReason: reason
      }
    });

  } catch (error) {
    console.error('Reject access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get access request statistics (super admin only)
const getAccessRequestStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      AccessRequest.countDocuments({ status: 'pending' }),
      AccessRequest.countDocuments({ status: 'approved' }),
      AccessRequest.countDocuments({ status: 'rejected' }),
      AccessRequest.countDocuments()
    ]);

    // Get recent requests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRequests = await AccessRequest.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
        recentRequests,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get access request stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerAdmin: exports.registerAdmin,
  loginAdmin: exports.loginAdmin,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  changePassword: exports.changePassword,
  getAllAdmins: exports.getAllAdmins,
  getAllUsers: exports.getAllUsers,
  getPendingAdmins: exports.getPendingAdmins,
  verifyAdmin: exports.verifyAdmin,
  rejectAdmin: exports.rejectAdmin,
  getAccessRequests,
  getAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
  getAccessRequestStats
}; 