const UsbControlCommand = require('../models/UsbControlCommand');
const UsbStatus = require('../models/UsbStatus');
const Agent = require('../models/Agent');

// In-memory fallback store for when database is not available
const fallbackUsbCommands = {};
const fallbackUsbStatus = {};

// Send USB control command to agent
exports.sendUsbCommand = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { action, reason, priority = 1, timeout = 300000 } = req.body;

    // Validate action
    if (!['enable', 'disable'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be "enable" or "disable"' 
      });
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Validate priority
    if (priority < 1 || priority > 10) {
      return res.status(400).json({ error: 'Priority must be between 1 and 10' });
    }

    // Try to use database first
    if (UsbControlCommand.db.readyState === 1) {
      // Verify agent exists and belongs to admin
      const agent = await Agent.findOne({ agentId, adminId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (!agent.isActive) {
        return res.status(400).json({ error: 'Cannot send command to inactive agent' });
      }

      // Generate unique command ID
      let commandId;
      let isUnique = false;
      while (!isUnique) {
        commandId = UsbControlCommand.generateCommandId();
        const existingCommand = await UsbControlCommand.findOne({ commandId });
        if (!existingCommand) isUnique = true;
      }

      // Create USB control command
      const command = new UsbControlCommand({
        commandId,
        agentId,
        adminId,
        action,
        reason: reason.trim(),
        priority,
        timeout
      });

      await command.save();

      // Update or create USB status
      let usbStatus = await UsbStatus.findOne({ agentId });
      if (!usbStatus) {
        usbStatus = new UsbStatus({ agentId });
      }
      await usbStatus.updateStatus(
        action === 'enable',
        commandId,
        action,
        reason.trim(),
        adminId
      );

      return res.status(201).json({
        message: `USB ${action} command sent successfully to agent`,
        command: {
          id: command.commandId,
          action: command.action,
          reason: command.reason,
          priority: command.priority,
          status: command.status,
          createdAt: command.createdAt
        },
        usbStatus: {
          isEnabled: usbStatus.isEnabled,
          lastUpdated: usbStatus.lastUpdated,
          lastCommandAction: usbStatus.lastCommandAction,
          lastCommandReason: usbStatus.lastCommandReason
        }
      });
    } else {
      // Fallback to in-memory storage
      const agent = Object.values(require('./agentController').fallbackAgents || {})
        .find(a => a.agentId === agentId && a.adminId === adminId.toString());

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (!agent.isActive) {
        return res.status(400).json({ error: 'Cannot send command to inactive agent' });
      }

      // Generate unique command ID
      let commandId;
      let isUnique = false;
      while (!isUnique) {
        commandId = UsbControlCommand.generateCommandId();
        if (!fallbackUsbCommands[commandId]) isUnique = true;
      }

      // Create command in memory
      const command = {
        commandId,
        agentId,
        adminId: adminId.toString(),
        action,
        reason: reason.trim(),
        priority,
        status: 'pending',
        createdAt: new Date(),
        timeout,
        result: {},
        error: null,
        retryCount: 0,
        maxRetries: 3
      };

      fallbackUsbCommands[commandId] = command;

      // Update USB status in memory
      fallbackUsbStatus[agentId] = {
        agentId,
        isEnabled: action === 'enable',
        lastUpdated: new Date(),
        lastCommandId: commandId,
        lastCommandAction: action,
        lastCommandReason: reason.trim(),
        lastCommandAdminId: adminId.toString(),
        lastCommandAt: new Date()
      };

      return res.status(201).json({
        message: `USB ${action} command sent successfully to agent`,
        command: {
          id: command.commandId,
          action: command.action,
          reason: command.reason,
          priority: command.priority,
          status: command.status,
          createdAt: command.createdAt
        },
        usbStatus: {
          isEnabled: fallbackUsbStatus[agentId].isEnabled,
          lastUpdated: fallbackUsbStatus[agentId].lastUpdated,
          lastCommandAction: fallbackUsbStatus[agentId].lastCommandAction,
          lastCommandReason: fallbackUsbStatus[agentId].lastCommandReason
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Send USB command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get USB status for an agent
exports.getUsbStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;

    // Try to use database first
    if (UsbStatus.db.readyState === 1) {
      // Verify agent exists and belongs to admin
      const agent = await Agent.findOne({ agentId, adminId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get USB status
      let usbStatus = await UsbStatus.findOne({ agentId })
        .populate('lastCommandAdminId', 'username email');

      if (!usbStatus) {
        // Create default status if none exists
        usbStatus = new UsbStatus({ agentId });
        await usbStatus.save();
      }

      return res.json({
        agentId: usbStatus.agentId,
        isEnabled: usbStatus.isEnabled,
        lastUpdated: usbStatus.lastUpdated,
        lastCommandId: usbStatus.lastCommandId,
        lastCommandAction: usbStatus.lastCommandAction,
        lastCommandReason: usbStatus.lastCommandReason,
        lastCommandAdmin: usbStatus.lastCommandAdminId ? {
          id: usbStatus.lastCommandAdminId._id,
          username: usbStatus.lastCommandAdminId.username,
          email: usbStatus.lastCommandAdminId.email
        } : null,
        lastCommandAt: usbStatus.lastCommandAt,
        notes: usbStatus.notes
      });
    } else {
      // Fallback to in-memory storage
      const agent = Object.values(require('./agentController').fallbackAgents || {})
        .find(a => a.agentId === agentId && a.adminId === adminId.toString());

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const usbStatus = fallbackUsbStatus[agentId] || {
        agentId,
        isEnabled: true,
        lastUpdated: new Date(),
        lastCommandId: null,
        lastCommandAction: null,
        lastCommandReason: null,
        lastCommandAdminId: null,
        lastCommandAt: null,
        notes: null
      };

      return res.json({
        ...usbStatus,
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (error) {
    console.error('Get USB status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get USB control history for an agent
exports.getUsbHistory = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { page = 1, limit = 20 } = req.query;

    // Try to use database first
    if (UsbControlCommand.db.readyState === 1) {
      // Verify agent exists and belongs to admin
      const agent = await Agent.findOne({ agentId, adminId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get USB control commands
      const commands = await UsbControlCommand.find({ agentId })
        .populate('adminId', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await UsbControlCommand.countDocuments({ agentId });

      const formattedCommands = commands.map(cmd => ({
        id: cmd.commandId,
        action: cmd.action,
        reason: cmd.reason,
        status: cmd.status,
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        executedAt: cmd.executedAt,
        completedAt: cmd.completedAt,
        result: cmd.result,
        error: cmd.error,
        admin: {
          id: cmd.adminId._id,
          username: cmd.adminId.username,
          email: cmd.adminId.email
        }
      }));

      return res.json({
        commands: formattedCommands,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Fallback to in-memory storage
      const agent = Object.values(require('./agentController').fallbackAgents || {})
        .find(a => a.agentId === agentId && a.adminId === adminId.toString());

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      let commands = Object.values(fallbackUsbCommands)
        .filter(cmd => cmd.agentId === agentId)
        .sort((a, b) => b.createdAt - a.createdAt);

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCommands = commands.slice(startIndex, endIndex);

      const formattedCommands = paginatedCommands.map(cmd => ({
        id: cmd.commandId,
        action: cmd.action,
        reason: cmd.reason,
        status: cmd.status,
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        executedAt: cmd.executedAt,
        completedAt: cmd.completedAt,
        result: cmd.result,
        error: cmd.error,
        admin: {
          id: cmd.adminId,
          username: 'Unknown',
          email: 'unknown@example.com'
        }
      }));

      return res.json({
        commands: formattedCommands,
        totalPages: Math.ceil(commands.length / limit),
        currentPage: page,
        total: commands.length,
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (error) {
    console.error('Get USB history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get pending USB commands for an agent (polling endpoint)
exports.getPendingUsbCommands = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Try to use database first
    if (UsbControlCommand.db.readyState === 1) {
      // Find agent to verify it exists
      const agent = await Agent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get pending USB commands for this agent
      const commands = await UsbControlCommand.find({
        agentId,
        status: 'pending'
      })
      .sort({ priority: -1, createdAt: 1 })
      .limit(5); // Limit to prevent overwhelming the agent

      // Return commands in the expected format for usb_control type
      const formattedCommands = commands.map(cmd => ({
        id: cmd.commandId,
        type: 'usb_control',
        parameters: {
          action: cmd.action,
          reason: cmd.reason,
          adminId: cmd.adminId.toString()
        },
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        timeout: cmd.timeout
      }));

      return res.json(formattedCommands);
    } else {
      // Fallback to in-memory storage
      const commands = Object.values(fallbackUsbCommands)
        .filter(cmd => cmd.agentId === agentId && cmd.status === 'pending')
        .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
        .slice(0, 5);

      const formattedCommands = commands.map(cmd => ({
        id: cmd.commandId,
        type: 'usb_control',
        parameters: {
          action: cmd.action,
          reason: cmd.reason,
          adminId: cmd.adminId
        },
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        timeout: cmd.timeout
      }));

      return res.json(formattedCommands);
    }
  } catch (error) {
    console.error('Get pending USB commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark USB command as executing (agent starts processing)
exports.startUsbCommand = async (req, res) => {
  try {
    const { agentId, commandId } = req.params;

    // Try to use database first
    if (UsbControlCommand.db.readyState === 1) {
      const command = await UsbControlCommand.findOne({ 
        commandId, 
        agentId,
        status: 'pending'
      });

      if (!command) {
        return res.status(404).json({ error: 'Command not found or already processed' });
      }

      await command.markAsExecuting();

      return res.json({
        message: 'USB command marked as executing',
        command: {
          id: command.commandId,
          action: command.action,
          status: command.status,
          executedAt: command.executedAt
        }
      });
    } else {
      // Fallback to in-memory storage
      const command = fallbackUsbCommands[commandId];
      
      if (!command || command.agentId !== agentId || command.status !== 'pending') {
        return res.status(404).json({ error: 'Command not found or already processed' });
      }

      command.status = 'executing';
      command.executedAt = new Date();

      return res.json({
        message: 'USB command marked as executing',
        command: {
          id: command.commandId,
          action: command.action,
          status: command.status,
          executedAt: command.executedAt
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Start USB command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Complete USB command (agent finished processing)
exports.completeUsbCommand = async (req, res) => {
  try {
    const { agentId, commandId } = req.params;
    const { status, result, error } = req.body;

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "failed"' });
    }

    // Try to use database first
    if (UsbControlCommand.db.readyState === 1) {
      const command = await UsbControlCommand.findOne({ 
        commandId, 
        agentId,
        status: { $in: ['pending', 'executing'] }
      });

      if (!command) {
        return res.status(404).json({ error: 'Command not found or already completed' });
      }

      if (status === 'completed') {
        await command.markAsCompleted(result);
        
        // Update USB status based on the completed command
        let usbStatus = await UsbStatus.findOne({ agentId });
        if (!usbStatus) {
          usbStatus = new UsbStatus({ agentId });
        }
        await usbStatus.updateStatus(
          command.action === 'enable',
          command.commandId,
          command.action,
          command.reason,
          command.adminId
        );
      } else {
        await command.markAsFailed(error || 'USB command execution failed');
      }

      return res.json({
        message: `USB command ${status}`,
        command: {
          id: command.commandId,
          action: command.action,
          status: command.status,
          completedAt: command.completedAt,
          result: command.result,
          error: command.error
        }
      });
    } else {
      // Fallback to in-memory storage
      const command = fallbackUsbCommands[commandId];
      
      if (!command || command.agentId !== agentId || !['pending', 'executing'].includes(command.status)) {
        return res.status(404).json({ error: 'Command not found or already completed' });
      }

      command.status = status;
      command.completedAt = new Date();
      
      if (status === 'completed') {
        command.result = result || {};
        
        // Update USB status in memory
        if (!fallbackUsbStatus[agentId]) {
          fallbackUsbStatus[agentId] = { agentId };
        }
        fallbackUsbStatus[agentId].isEnabled = command.action === 'enable';
        fallbackUsbStatus[agentId].lastUpdated = new Date();
        fallbackUsbStatus[agentId].lastCommandId = command.commandId;
        fallbackUsbStatus[agentId].lastCommandAction = command.action;
        fallbackUsbStatus[agentId].lastCommandReason = command.reason;
        fallbackUsbStatus[agentId].lastCommandAdminId = command.adminId;
        fallbackUsbStatus[agentId].lastCommandAt = new Date();
      } else {
        command.error = error || 'USB command execution failed';
        command.retryCount += 1;
      }

      return res.json({
        message: `USB command ${status}`,
        command: {
          id: command.commandId,
          action: command.action,
          status: command.status,
          completedAt: command.completedAt,
          result: command.result,
          error: command.error
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Complete USB command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export fallback stores for other controllers
exports.fallbackUsbCommands = fallbackUsbCommands;
exports.fallbackUsbStatus = fallbackUsbStatus; 