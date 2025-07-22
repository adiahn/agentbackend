const mongoose = require('mongoose');

const CommandSchema = new mongoose.Schema({
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
  type: { 
    type: String, 
    required: true,
    enum: ['shutdown', 'restart', 'sleep', 'hibernate', 'lock', 'unlock', 'lockdown', 'unlockdown', 'emergency_override', 'lockdown_status_update', 'usb_control']
  },
  parameters: { 
    type: Object, 
    default: {} 
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
  scheduledFor: { 
    type: Date 
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
CommandSchema.index({ agentId: 1, status: 1 });
CommandSchema.index({ adminId: 1 });
CommandSchema.index({ createdAt: 1 });
CommandSchema.index({ scheduledFor: 1 });

// Method to check if command is ready for execution
CommandSchema.methods.isReadyForExecution = function() {
  const now = new Date();
  
  // Check if command is pending and scheduled time has passed (if scheduled)
  if (this.status !== 'pending') return false;
  if (this.scheduledFor && this.scheduledFor > now) return false;
  
  return true;
};

// Method to mark command as executing
CommandSchema.methods.markAsExecuting = function() {
  this.status = 'executing';
  this.executedAt = new Date();
  return this.save();
};

// Method to mark command as completed
CommandSchema.methods.markAsCompleted = function(result = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result = result;
  return this.save();
};

// Method to mark command as failed
CommandSchema.methods.markAsFailed = function(error = 'Unknown error') {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = error;
  this.retryCount += 1;
  return this.save();
};

// Static method to generate unique command ID
CommandSchema.statics.generateCommandId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let commandId = 'cmd-';
  for (let i = 0; i < 8; i++) {
    commandId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return commandId;
};

module.exports = mongoose.model('Command', CommandSchema); 