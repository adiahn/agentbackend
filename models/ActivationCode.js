const mongoose = require('mongoose');

const ActivationCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  agentId: { 
    type: String, 
    unique: true, 
    sparse: true // Allows null/undefined values
  },
  isUsed: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  usedAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
ActivationCodeSchema.index({ code: 1 });
ActivationCodeSchema.index({ adminId: 1 });
ActivationCodeSchema.index({ expiresAt: 1 });

// Method to check if code is expired
ActivationCodeSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if code is valid for use
ActivationCodeSchema.methods.isValid = function() {
  return this.isActive && !this.isUsed && !this.isExpired();
};

// Static method to generate a unique code
ActivationCodeSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = mongoose.model('ActivationCode', ActivationCodeSchema); 