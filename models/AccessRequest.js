const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accessRequestSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  businessRegNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    trim: true,
    maxlength: [50, 'Business registration number cannot exceed 50 characters']
  },
  documentUrl: {
    type: String,
    required: [true, 'Business registration document is required']
  },
  documentFilename: {
    type: String,
    required: [true, 'Document filename is required']
  },
  nin: {
    type: String,
    required: [true, 'NIN is required'],
    minlength: [8, 'NIN must be at least 8 characters'],
    maxlength: [20, 'NIN cannot exceed 20 characters'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    minlength: [7, 'Phone number must be at least 7 characters'],
    maxlength: [15, 'Phone number cannot exceed 15 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
accessRequestSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
accessRequestSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
accessRequestSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to verify email
accessRequestSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
};

// Static method to find by email
accessRequestSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find pending requests
accessRequestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to find by email verification token
accessRequestSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

module.exports = mongoose.model('AccessRequest', accessRequestSchema); 