const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const VerificationLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['requested', 'approved', 'rejected'], required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  at: { type: Date, default: Date.now },
  note: String
}, { _id: false });

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Business fields (only required for regular admins, not super admin)
  companyName: {
    type: String,
    required: function() {
      return this.role === 'admin';
    }
  },
  businessRegNumber: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    unique: true,
    sparse: true
  },
  businessDocument: {
    type: String, // Cloudinary URL
    required: function() {
      return this.role === 'admin';
    }
  },
  nin: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    unique: true,
    sparse: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  rejected: {
    type: Boolean,
    default: false
  },
  verificationLog: [VerificationLogSchema]
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
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
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
AdminSchema.methods.toPublicJSON = function() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model('Admin', AdminSchema); 