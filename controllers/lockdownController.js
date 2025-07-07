const LockdownState = require('../models/LockdownState');
const LockdownEvent = require('../models/LockdownEvent');
const Agent = require('../models/Agent');
const Command = require('../models/Command');

// Initiate lockdown on agent
exports.initiateLockdown = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { 
      adminContactInfo, 
      reason = 'Administrative lockdown',
      priority = 10, // Highest priority for lockdown
      unlockPin, // New field for admin-set PIN
      expiresAt // New field for expiration
    } = req.body;

    // Validate required contact info
    if (!adminContactInfo || !adminContactInfo.phone) {
      return res.status(400).json({ 
        error: 'Admin contact information with phone number is required' 
      });
    }

    // Validate PIN if provided
    if (unlockPin) {
      if (!/^\d{4}$/.test(unlockPin)) {
        return res.status(400).json({ 
          error: 'PIN must be exactly 4 digits' 
        });
      }
    }

    // Validate expiration if provided
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        return res.status(400).json({ 
          error: 'Expiration date must be a valid future date' 
        });
      }
    }

    // Verify agent exists and belongs to admin
    const agent = await Agent.findOne({ agentId, adminId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (!agent.isActive) {
      return res.status(400).json({ error: 'Cannot lockdown inactive agent' });
    }

    // Check if already locked down
    let lockdownState = await LockdownState.findOne({ agentId });
    if (lockdownState && lockdownState.isLockedDown) {
      return res.status(400).json({ 
        error: 'Agent is already in lockdown mode',
        lockdownInfo: {
          initiatedAt: lockdownState.lockdownInitiatedAt,
          reason: lockdownState.lockdownReason,
          contactInfo: lockdownState.adminContactInfo
        }
      });
    }

    // Create or update lockdown state
    if (!lockdownState) {
      lockdownState = new LockdownState({
        agentId,
        adminId,
        systemInfo: {
          hostname: agent.hostname,
          platform: agent.platform,
          version: agent.version,
          lastBootTime: new Date()
        }
      });
    }

    await lockdownState.initiateLockdown(adminContactInfo, reason, unlockPin, expiresAt);

    // Log the lockdown event
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'lockdown',
      reason,
      adminId,
      adminContactInfo,
      unlockPin,
      metadata: {
        expiresAt,
        isPersistent: !!expiresAt,
        priority
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate unique command ID
    let commandId;
    let isUnique = false;
    while (!isUnique) {
      commandId = Command.generateCommandId();
      const existingCommand = await Command.findOne({ commandId });
      if (!existingCommand) isUnique = true;
    }

    // Create lockdown command
    const command = new Command({
      commandId,
      agentId,
      adminId,
      type: 'lockdown',
      parameters: {
        adminContactInfo,
        reason,
        priority,
        unlockPin, // Include PIN in command parameters
        expiresAt // Include expiration in command parameters
      },
      priority,
      timeout: 60000 // 1 minute timeout for lockdown
    });

    await command.save();

    // Update lockdown state with command info
    lockdownState.metadata.commandId = commandId;
    lockdownState.metadata.sessionId = req.sessionID;
    lockdownState.metadata.clientIp = req.ip;
    lockdownState.metadata.userAgent = req.get('User-Agent');
    await lockdownState.save();

    console.log('Lockdown initiated:', {
      agentId,
      adminId: adminId.toString(),
      commandId,
      reason,
      hasPin: !!unlockPin,
      expiresAt
    });

    return res.status(201).json({
      message: 'Lockdown command sent successfully to agent',
      lockdown: {
        id: lockdownState._id,
        agentId: lockdownState.agentId,
        isLockedDown: lockdownState.isLockedDown,
        initiatedAt: lockdownState.lockdownInitiatedAt,
        reason: lockdownState.lockdownReason,
        adminContactInfo: lockdownState.adminContactInfo,
        hasPin: !!lockdownState.unlockPin,
        expiresAt: lockdownState.expiresAt,
        isPersistent: lockdownState.isPersistent
      },
      command: {
        id: command.commandId,
        type: command.type,
        priority: command.priority,
        status: command.status,
        createdAt: command.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to initiate lockdown:', error);
    return res.status(500).json({ 
      error: 'Failed to initiate lockdown',
      details: error.message 
    });
  }
};

// Emergency override endpoint
exports.emergencyOverride = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { reason = 'Emergency override executed by admin' } = req.body;

    // Verify agent exists and belongs to admin (or super admin can override any)
    let agent;
    if (req.admin.role === 'super_admin') {
      agent = await Agent.findOne({ agentId });
    } else {
      agent = await Agent.findOne({ agentId, adminId });
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check lockdown state
    const lockdownState = await LockdownState.findOne({ agentId });
    if (!lockdownState || !lockdownState.isLockedDown) {
      return res.status(400).json({ error: 'Agent is not in lockdown mode' });
    }

    // Generate unique command ID
    let commandId;
    let isUnique = false;
    while (!isUnique) {
      commandId = Command.generateCommandId();
      const existingCommand = await Command.findOne({ commandId });
      if (!existingCommand) isUnique = true;
    }

    // Create emergency override command
    const command = new Command({
      commandId,
      agentId,
      adminId,
      type: 'emergency_override',
      parameters: {
        reason,
        adminId: adminId.toString(),
        timestamp: new Date().toISOString()
      },
      priority: 10,
      timeout: 60000
    });

    await command.save();

    // Log the emergency override event
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'emergency_override',
      reason,
      adminId,
      metadata: {
        commandId,
        adminId: adminId.toString(),
        timestamp: new Date().toISOString()
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Release lockdown state
    await lockdownState.emergencyOverride(adminId.toString(), reason);

    console.log('Emergency override executed:', {
      agentId,
      adminId: adminId.toString(),
      commandId,
      reason
    });

    return res.status(200).json({
      success: true,
      message: 'Emergency override logged and agent notified',
      timestamp: new Date().toISOString(),
      command: {
        id: command.commandId,
        type: command.type,
        status: command.status,
        createdAt: command.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to execute emergency override:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to execute emergency override',
      details: error.message 
    });
  }
};

// Verify PIN for unlocking (public endpoint for agent)
exports.verifyPin = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        error: 'PIN must be exactly 4 digits' 
      });
    }

    const lockdownState = await LockdownState.findOne({ agentId });
    
    if (!lockdownState || !lockdownState.isLockedDown) {
      return res.status(400).json({ 
        error: 'Agent is not in lockdown mode' 
      });
    }

    const isValidPin = lockdownState.verifyPin(pin);

    // Log PIN verification attempt
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'pin_verification',
      reason: isValidPin ? 'PIN verification successful' : 'PIN verification failed',
      metadata: {
        pinAttempted: pin,
        isValid: isValidPin,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.json({
      isValid: isValidPin,
      message: isValidPin ? 'PIN is valid' : 'Invalid PIN'
    });

  } catch (error) {
    console.error('Failed to verify PIN:', error);
    return res.status(500).json({ 
      error: 'Failed to verify PIN',
      details: error.message 
    });
  }
};

// Unlock with PIN (public endpoint for agent)
exports.unlockWithPin = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        error: 'PIN must be exactly 4 digits' 
      });
    }

    const lockdownState = await LockdownState.findOne({ agentId });
    
    if (!lockdownState || !lockdownState.isLockedDown) {
      return res.status(400).json({ error: 'Agent is not in lockdown mode' });
    }

    const isValidPin = lockdownState.verifyPin(pin);
    
    if (!isValidPin) {
      // Log failed PIN unlock attempt
      await LockdownEvent.logEvent({
        agentId,
        eventType: 'pin_unlock',
        reason: 'PIN unlock failed - invalid PIN',
        metadata: {
          pinAttempted: pin,
          isValid: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({ 
        error: 'Invalid PIN' 
      });
    }

    // Generate unlock command
    let commandId;
    let isUnique = false;
    while (!isUnique) {
      commandId = Command.generateCommandId();
      const existingCommand = await Command.findOne({ commandId });
      if (!existingCommand) isUnique = true;
    }

    // Create unlock command
    const command = new Command({
      commandId,
      agentId,
      adminId: lockdownState.adminId,
      type: 'unlock',
      parameters: {
        reason: 'Unlocked with PIN',
        pin: pin
      },
      priority: 10,
      timeout: 60000
    });

    await command.save();

    // Log successful PIN unlock
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'pin_unlock',
      reason: 'PIN unlock successful',
      adminId: lockdownState.adminId,
      metadata: {
        commandId,
        pin: pin,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Release lockdown state
    await lockdownState.releaseLockdown();

    console.log('System unlocked with PIN:', {
      agentId,
      commandId
    });

    return res.json({
      message: 'System unlocked successfully',
      command: {
        id: command.commandId,
        type: command.type,
        status: command.status,
        createdAt: command.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to unlock with PIN:', error);
    return res.status(500).json({ 
      error: 'Failed to unlock system',
      details: error.message 
    });
  }
};

// Release lockdown on agent
exports.releaseLockdown = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { reason = 'Administrative release' } = req.body;

    // Verify agent exists and belongs to admin
    const agent = await Agent.findOne({ agentId, adminId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check lockdown state
    const lockdownState = await LockdownState.findOne({ agentId });
    if (!lockdownState || !lockdownState.isLockedDown) {
      return res.status(400).json({ error: 'Agent is not in lockdown mode' });
    }

    // Generate unique command ID
    let commandId;
    let isUnique = false;
    while (!isUnique) {
      commandId = Command.generateCommandId();
      const existingCommand = await Command.findOne({ commandId });
      if (!existingCommand) isUnique = true;
    }

    // Create unlockdown command
    const command = new Command({
      commandId,
      agentId,
      adminId,
      type: 'unlockdown',
      parameters: {
        reason: reason
      },
      priority: 10,
      timeout: 60000
    });

    await command.save();

    // Log the unlock event
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'unlock',
      reason,
      adminId,
      metadata: {
        commandId,
        method: 'administrative_release',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Release lockdown state
    await lockdownState.releaseLockdown();

    console.log('Lockdown released:', {
      agentId,
      adminId: adminId.toString(),
      commandId
    });

    return res.status(200).json({
      message: 'Unlockdown command sent successfully to agent',
      lockdown: {
        id: lockdownState._id,
        agentId: lockdownState.agentId,
        isLockedDown: lockdownState.isLockedDown,
        releasedAt: new Date()
      },
      command: {
        id: command.commandId,
        type: command.type,
        priority: command.priority,
        status: command.status,
        createdAt: command.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to release lockdown:', error);
    return res.status(500).json({ 
      error: 'Failed to release lockdown',
      details: error.message 
    });
  }
};

// Enhanced status check endpoint
exports.getLockdownStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;

    // Verify agent exists and belongs to admin
    const agent = await Agent.findOne({ agentId, adminId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const lockdownState = await LockdownState.findOne({ agentId });
    
    if (!lockdownState) {
      return res.status(200).json({
        isLockedDown: false,
        agentId,
        message: 'No lockdown state found'
      });
    }

    return res.status(200).json({
      isLockedDown: lockdownState.isLockedDown,
      agentId: lockdownState.agentId,
      lockdownInfo: lockdownState.isLockedDown ? {
        initiatedAt: lockdownState.lockdownInitiatedAt,
        reason: lockdownState.lockdownReason,
        adminContactInfo: lockdownState.adminContactInfo,
        lastHeartbeat: lockdownState.lastHeartbeat,
        securityChecks: lockdownState.securityChecks,
        expiresAt: lockdownState.expiresAt,
        isPersistent: lockdownState.isPersistent
      } : null,
      systemInfo: lockdownState.systemInfo
    });

  } catch (error) {
    console.error('Failed to get lockdown status:', error);
    return res.status(500).json({ 
      error: 'Failed to get lockdown status',
      details: error.message 
    });
  }
};

// Lockdown state validation endpoint
exports.validateLockdownState = async (req, res) => {
  try {
    const { agentId } = req.params;

    const lockdownState = await LockdownState.findOne({ agentId });
    
    if (!lockdownState || !lockdownState.isLockedDown) {
      return res.status(200).json({
        isLockedDown: false,
        shouldClear: true,
        reason: 'No active lockdown found'
      });
    }

    // Check if lockdown should be cleared
    const shouldClear = lockdownState.shouldClear();
    const isExpired = lockdownState.isExpired();

    return res.status(200).json({
      isLockedDown: lockdownState.isLockedDown,
      shouldClear,
      reason: isExpired ? 'Lockdown has expired' : 'Lockdown is still active',
      expiresAt: lockdownState.expiresAt,
      lastHeartbeat: lockdownState.lastHeartbeat,
      isPersistent: lockdownState.isPersistent
    });

  } catch (error) {
    console.error('Failed to validate lockdown state:', error);
    return res.status(500).json({ 
      error: 'Failed to validate lockdown state',
      details: error.message 
    });
  }
};

// Lockdown history endpoint
exports.getLockdownHistory = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { limit = 50, offset = 0, eventType } = req.query;

    // Verify agent exists and belongs to admin
    const agent = await Agent.findOne({ agentId, adminId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const events = await LockdownEvent.getAgentHistory(agentId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      eventType
    });

    const total = await LockdownEvent.countDocuments({ agentId });

    return res.status(200).json({
      events: events.map(event => ({
        id: event._id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        reason: event.reason,
        adminId: event.adminId,
        metadata: event.metadata
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Failed to get lockdown history:', error);
    return res.status(500).json({ 
      error: 'Failed to get lockdown history',
      details: error.message 
    });
  }
};

// Get all locked down agents for admin
exports.getLockedDownAgents = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { page = 1, limit = 20 } = req.query;

    const lockdownStates = await LockdownState.find({ 
      adminId, 
      isLockedDown: true 
    })
    .populate('adminId', 'username email')
    .sort({ lockdownInitiatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await LockdownState.countDocuments({ 
      adminId, 
      isLockedDown: true 
    });

    return res.status(200).json({
      lockdowns: lockdownStates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Failed to get locked down agents:', error);
    return res.status(500).json({ 
      error: 'Failed to get locked down agents',
      details: error.message 
    });
  }
};

// Get all lockdowns (super admin only)
exports.getAllLockdowns = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;

    let query = {};
    
    if (status === 'active') {
      query.isLockedDown = true;
    }

    const lockdownStates = await LockdownState.find(query)
      .populate('adminId', 'username email')
      .sort({ lockdownInitiatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LockdownState.countDocuments(query);

    return res.status(200).json({
      lockdowns: lockdownStates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Failed to get all lockdowns:', error);
    return res.status(500).json({ 
      error: 'Failed to get all lockdowns',
      details: error.message 
    });
  }
};

// Update heartbeat (for agents)
exports.updateHeartbeat = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { securityChecks } = req.body;

    const lockdownState = await LockdownState.findOne({ agentId });
    
    if (!lockdownState) {
      return res.status(404).json({ error: 'Lockdown state not found' });
    }

    await lockdownState.updateHeartbeat();

    // Update security checks if provided
    if (securityChecks) {
      Object.keys(securityChecks).forEach(checkType => {
        if (lockdownState.securityChecks.hasOwnProperty(checkType)) {
          lockdownState.updateSecurityCheck(checkType, securityChecks[checkType]);
        }
      });
    }

    // Log heartbeat event
    await LockdownEvent.logEvent({
      agentId,
      eventType: 'heartbeat',
      reason: 'Agent heartbeat update',
      metadata: {
        securityChecks,
        lastHeartbeat: lockdownState.lastHeartbeat
      }
    });

    return res.status(200).json({
      message: 'Heartbeat updated successfully',
      lastHeartbeat: lockdownState.lastHeartbeat
    });

  } catch (error) {
    console.error('Failed to update heartbeat:', error);
    return res.status(500).json({ 
      error: 'Failed to update heartbeat',
      details: error.message 
    });
  }
}; 