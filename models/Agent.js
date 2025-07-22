const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true },
  systemInfo: { type: Object, required: false, default: {} },
  location: { type: Object, required: false, default: {} },
  pcName: { type: String, required: true },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true 
  },
  activationCodeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ActivationCode',
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
AgentSchema.index({ adminId: 1 });
AgentSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('Agent', AgentSchema); 