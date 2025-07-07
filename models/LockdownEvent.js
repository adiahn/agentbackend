const mongoose = require('mongoose');

const LockdownEventSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['lockdown', 'unlock', 'emergency_override', 'expired', 'heartbeat', 'pin_verification', 'pin_unlock'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  reason: {
    type: String,
    required: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  adminContactInfo: {
    name: String,
    phone: String,
    email: String,
    message: String
  },
  unlockPin: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
LockdownEventSchema.index({ agentId: 1, timestamp: -1 });
LockdownEventSchema.index({ eventType: 1, timestamp: -1 });
LockdownEventSchema.index({ adminId: 1, timestamp: -1 });

// Static method to log events
LockdownEventSchema.statics.logEvent = function(eventData) {
  const event = new this({
    ...eventData,
    timestamp: eventData.timestamp || new Date()
  });
  return event.save();
};

// Static method to get agent history
LockdownEventSchema.statics.getAgentHistory = function(agentId, options = {}) {
  const { limit = 50, offset = 0, eventType } = options;
  
  let query = { agentId };
  if (eventType) {
    query.eventType = eventType;
  }
  
  return this.find(query)
    .populate('adminId', 'username email')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset);
};

module.exports = mongoose.model('LockdownEvent', LockdownEventSchema); 