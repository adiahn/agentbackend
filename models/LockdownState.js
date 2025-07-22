const mongoose = require('mongoose');

const LockdownStateSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    unique: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isLockedDown: {
    type: Boolean,
    default: false
  },
  lockdownInitiatedAt: {
    type: Date
  },
  lockdownInitiatedBy: {
    type: String,
    required: false
  },
  adminContactInfo: {
    name: String,
    phone: String,
    email: String,
    message: String
  },
  lockdownReason: {
    type: String,
    default: 'Administrative lockdown'
  },
  // New field for admin-set PIN
  unlockPin: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || (v.length === 4 && /^\d{4}$/.test(v));
      },
      message: 'PIN must be exactly 4 digits'
    }
  },
  // New fields for persistent lockdown
  expiresAt: {
    type: Date,
    required: false
  },
  isPersistent: {
    type: Boolean,
    default: false
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  systemInfo: {
    hostname: String,
    platform: String,
    version: String,
    lastBootTime: Date
  },
  securityChecks: {
    registryTampered: {
      type: Boolean,
      default: false
    },
    processKilled: {
      type: Boolean,
      default: false
    },
    networkDisconnected: {
      type: Boolean,
      default: false
    },
    lastCheckTime: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    commandId: String,
    sessionId: String,
    clientIp: String,
    userAgent: String,
    emergencyOverrideCount: {
      type: Number,
      default: 0
    },
    lastOverrideAt: Date,
    lastOverrideBy: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
LockdownStateSchema.index({ isLockedDown: 1 });
LockdownStateSchema.index({ adminId: 1 });
LockdownStateSchema.index({ expiresAt: 1 });
LockdownStateSchema.index({ 'securityChecks.lastCheckTime': 1 });

// Methods
LockdownStateSchema.methods.initiateLockdown = function(adminContactInfo, reason, unlockPin, expiresAt) {
  this.isLockedDown = true;
  this.lockdownInitiatedAt = new Date();
  this.adminContactInfo = adminContactInfo;
  this.lockdownReason = reason || 'Administrative lockdown';
  this.unlockPin = unlockPin; // Store the admin-set PIN
  this.expiresAt = expiresAt; // Store expiration time
  this.isPersistent = !!expiresAt; // Mark as persistent if expiration is set
  this.lastHeartbeat = new Date();
  return this.save();
};

LockdownStateSchema.methods.releaseLockdown = function() {
  this.isLockedDown = false;
  this.lockdownInitiatedAt = null;
  this.adminContactInfo = {};
  this.lockdownReason = '';
  this.unlockPin = null; // Clear the PIN when lockdown is released
  this.expiresAt = null; // Clear expiration
  this.isPersistent = false;
  this.lastHeartbeat = new Date();
  return this.save();
};

LockdownStateSchema.methods.emergencyOverride = function(adminId, reason) {
  this.isLockedDown = false;
  this.lockdownInitiatedAt = null;
  this.adminContactInfo = {};
  this.lockdownReason = '';
  this.unlockPin = null;
  this.expiresAt = null;
  this.isPersistent = false;
  this.lastHeartbeat = new Date();
  
  // Track emergency override
  this.metadata.emergencyOverrideCount += 1;
  this.metadata.lastOverrideAt = new Date();
  this.metadata.lastOverrideBy = adminId;
  
  return this.save();
};

LockdownStateSchema.methods.updateHeartbeat = function() {
  this.lastHeartbeat = new Date();
  return this.save();
};

LockdownStateSchema.methods.updateSecurityCheck = function(checkType, value) {
  this.securityChecks[checkType] = value;
  this.securityChecks.lastCheckTime = new Date();
  return this.save();
};

// Method to verify PIN
LockdownStateSchema.methods.verifyPin = function(pin) {
  return this.unlockPin === pin;
};

// Method to check if lockdown is expired
LockdownStateSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if lockdown should be cleared
LockdownStateSchema.methods.shouldClear = function() {
  // Check if expired
  if (this.isExpired()) return true;
  
  // Check if heartbeat is too old (more than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (this.lastHeartbeat < fiveMinutesAgo) return true;
  
  return false;
};

// Static method to clean up expired lockdowns
LockdownStateSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      isLockedDown: true, 
      expiresAt: { $lt: new Date() } 
    },
    { 
      $set: { 
        isLockedDown: false,
        lockdownInitiatedAt: null,
        adminContactInfo: {},
        lockdownReason: '',
        unlockPin: null,
        expiresAt: null,
        isPersistent: false
      } 
    }
  );
};

module.exports = mongoose.model('LockdownState', LockdownStateSchema); 