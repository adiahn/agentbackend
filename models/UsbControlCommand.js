const mongoose = require('mongoose');

const UsbControlCommandSchema = new mongoose.Schema({
  commandId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  agentId: { 
    type: String, 
    required: true 
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true 
  },
  action: { 
    type: String, 
    required: true,
    enum: ['enable', 'disable']
  },
  reason: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'executing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 10
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  executedAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  },
  result: { 
    type: Object, 
    default: {} 
  },
  error: { 
    type: String 
  },
  retryCount: { 
    type: Number, 
    default: 0 
  },
  maxRetries: { 
    type: Number, 
    default: 3 
  },
  timeout: { 
    type: Number, 
    default: 300000 // 5 minutes in milliseconds
  }
});

// Indexes for efficient queries
UsbControlCommandSchema.index({ agentId: 1, status: 1 });
UsbControlCommandSchema.index({ adminId: 1 });
UsbControlCommandSchema.index({ createdAt: 1 });

// Method to check if command is ready for execution
UsbControlCommandSchema.methods.isReadyForExecution = function() {
  return this.status === 'pending';
};

// Method to mark command as executing
UsbControlCommandSchema.methods.markAsExecuting = function() {
  this.status = 'executing';
  this.executedAt = new Date();
  return this.save();
};

// Method to mark command as completed
UsbControlCommandSchema.methods.markAsCompleted = function(result = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result = result;
  return this.save();
};

// Method to mark command as failed
UsbControlCommandSchema.methods.markAsFailed = function(error = 'Unknown error') {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = error;
  this.retryCount += 1;
  return this.save();
};

// Static method to generate unique command ID
UsbControlCommandSchema.statics.generateCommandId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let commandId = 'usb-';
  for (let i = 0; i < 8; i++) {
    commandId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return commandId;
};

module.exports = mongoose.model('UsbControlCommand', UsbControlCommandSchema); 