const mongoose = require('mongoose');

const UsbStatusSchema = new mongoose.Schema({
  agentId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isEnabled: { 
    type: Boolean, 
    default: true 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  lastCommandId: { 
    type: String 
  },
  lastCommandAction: { 
    type: String,
    enum: ['enable', 'disable']
  },
  lastCommandReason: { 
    type: String 
  },
  lastCommandAdminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin'
  },
  lastCommandAt: { 
    type: Date 
  },
  notes: { 
    type: String 
  }
});

// Indexes for efficient queries
UsbStatusSchema.index({ lastUpdated: 1 });
UsbStatusSchema.index({ isEnabled: 1 });

// Method to update USB status
UsbStatusSchema.methods.updateStatus = function(isEnabled, commandId, action, reason, adminId) {
  this.isEnabled = isEnabled;
  this.lastUpdated = new Date();
  this.lastCommandId = commandId;
  this.lastCommandAction = action;
  this.lastCommandReason = reason;
  this.lastCommandAdminId = adminId;
  this.lastCommandAt = new Date();
  return this.save();
};

module.exports = mongoose.model('UsbStatus', UsbStatusSchema); 