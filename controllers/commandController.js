const Command = require('../models/Command');
const Agent = require('../models/Agent');

// In-memory fallback store for when database is not available
const fallbackCommands = {};

// Get pending commands for an agent (polling endpoint)
exports.getPendingCommands = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Try to use database first
    if (Command.db.readyState === 1) {
      // Find agent to verify it exists
      const agent = await Agent.findOne({ agentId });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get pending commands for this agent (only truly pending, not executing)
      const commands = await Command.find({
        agentId,
        status: 'pending'
      })
      .sort({ priority: -1, createdAt: 1 })
      .limit(10); // Limit to prevent overwhelming the agent

      // Return commands in the expected format
      const formattedCommands = commands.map(cmd => ({
        id: cmd.commandId,
        type: cmd.type,
        parameters: cmd.parameters,
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        scheduledFor: cmd.scheduledFor,
        timeout: cmd.timeout
      }));

      return res.json(formattedCommands);
    } else {
      // Fallback to in-memory storage
      const commands = Object.values(fallbackCommands)
        .filter(cmd => cmd.agentId === agentId && cmd.status === 'pending')
        .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
        .slice(0, 10);

      const formattedCommands = commands.map(cmd => ({
        id: cmd.commandId,
        type: cmd.type,
        parameters: cmd.parameters,
        priority: cmd.priority,
        createdAt: cmd.createdAt,
        scheduledFor: cmd.scheduledFor,
        timeout: cmd.timeout
      }));

      return res.json(formattedCommands);
    }
  } catch (error) {
    console.error('Get pending commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark command as executing (agent starts processing)
exports.startCommand = async (req, res) => {
  try {
    const { agentId, commandId } = req.params;

    // Try to use database first
    if (Command.db.readyState === 1) {
      const command = await Command.findOne({ 
        commandId, 
        agentId,
        status: 'pending'
      });

      if (!command) {
        return res.status(404).json({ error: 'Command not found or already processed' });
      }

      await command.markAsExecuting();

      return res.json({
        message: 'Command marked as executing',
        command: {
          id: command.commandId,
          type: command.type,
          status: command.status,
          executedAt: command.executedAt
        }
      });
    } else {
      // Fallback to in-memory storage
      const command = fallbackCommands[commandId];
      
      if (!command || command.agentId !== agentId || command.status !== 'pending') {
        return res.status(404).json({ error: 'Command not found or already processed' });
      }

      command.status = 'executing';
      command.executedAt = new Date();

      return res.json({
        message: 'Command marked as executing',
        command: {
          id: command.commandId,
          type: command.type,
          status: command.status,
          executedAt: command.executedAt
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Start command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Complete command (agent finished processing)
exports.completeCommand = async (req, res) => {
  try {
    const { agentId, commandId } = req.params;
    const { status, result, error } = req.body;

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "completed" or "failed"' });
    }

    // Try to use database first
    if (Command.db.readyState === 1) {
      const command = await Command.findOne({ 
        commandId, 
        agentId,
        status: { $in: ['pending', 'executing'] }
      });

      if (!command) {
        return res.status(404).json({ error: 'Command not found or already completed' });
      }

      if (status === 'completed') {
        await command.markAsCompleted(result);
      } else {
        await command.markAsFailed(error || 'Command execution failed');
      }

      return res.json({
        message: `Command ${status}`,
        command: {
          id: command.commandId,
          type: command.type,
          status: command.status,
          completedAt: command.completedAt,
          result: command.result,
          error: command.error
        }
      });
    } else {
      // Fallback to in-memory storage
      const command = fallbackCommands[commandId];
      
      if (!command || command.agentId !== agentId || !['pending', 'executing'].includes(command.status)) {
        return res.status(404).json({ error: 'Command not found or already completed' });
      }

      command.status = status;
      command.completedAt = new Date();
      
      if (status === 'completed') {
        command.result = result || {};
      } else {
        command.error = error || 'Command execution failed';
        command.retryCount += 1;
      }

      return res.json({
        message: `Command ${status}`,
        command: {
          id: command.commandId,
          type: command.type,
          status: command.status,
          completedAt: command.completedAt,
          result: command.result,
          error: command.error
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Complete command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send command to agent (admin endpoint)
exports.sendCommand = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    const { 
      type, 
      parameters = {}, 
      priority = 1, 
      scheduledFor, 
      timeout = 300000 
    } = req.body;

    // Validate command type
    const validTypes = ['shutdown', 'restart', 'sleep', 'hibernate', 'lock', 'unlock'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid command type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Validate priority
    if (priority < 1 || priority > 10) {
      return res.status(400).json({ error: 'Priority must be between 1 and 10' });
    }

    // Process parameters for shutdown and restart commands
    let processedParameters = { ...parameters };
    if (type === 'shutdown' || type === 'restart') {
      // Ensure delay parameter exists and defaults to 0
      processedParameters = {
        delay: parameters.delay !== undefined ? parameters.delay : 0
      };
    }

    // Try to use database first
    if (Command.db.readyState === 1) {
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
        commandId = Command.generateCommandId();
        const existingCommand = await Command.findOne({ commandId });
        if (!existingCommand) isUnique = true;
      }

      // Create command
      const command = new Command({
        commandId,
        agentId,
        adminId,
        type,
        parameters: processedParameters,
        priority,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        timeout
      });

      await command.save();

      return res.status(201).json({
        message: `${type} command sent successfully to agent`,
        command: {
          id: command.commandId,
          type: command.type,
          parameters: command.parameters,
          priority: command.priority,
          status: command.status,
          createdAt: command.createdAt,
          scheduledFor: command.scheduledFor
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
        commandId = Command.generateCommandId();
        if (!fallbackCommands[commandId]) isUnique = true;
      }

      // Create command in memory
      const command = {
        commandId,
        agentId,
        adminId: adminId.toString(),
        type,
        parameters: processedParameters,
        priority,
        status: 'pending',
        createdAt: new Date(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        timeout,
        result: {},
        error: null,
        retryCount: 0,
        maxRetries: 3
      };

      fallbackCommands[commandId] = command;

      return res.status(201).json({
        message: `${type} command sent successfully to agent`,
        command: {
          id: command.commandId,
          type: command.type,
          parameters: command.parameters,
          priority: command.priority,
          status: command.status,
          createdAt: command.createdAt,
          scheduledFor: command.scheduledFor
        },
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (error) {
    console.error('Send command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all commands for admin's agents
exports.getMyCommands = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { page = 1, limit = 20, status, agentId } = req.query;

    // Try to use database first
    if (Command.db.readyState === 1) {
      const query = { adminId };
      
      if (status) {
        query.status = status;
      }
      
      if (agentId) {
        query.agentId = agentId;
      }

      const commands = await Command.find(query)
        .populate('adminId', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Command.countDocuments(query);

      return res.json({
        commands,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Fallback to in-memory storage
      let commands = Object.values(fallbackCommands).filter(cmd => 
        cmd.adminId === adminId.toString()
      );

      if (status) {
        commands = commands.filter(cmd => cmd.status === status);
      }
      
      if (agentId) {
        commands = commands.filter(cmd => cmd.agentId === agentId);
      }

      commands.sort((a, b) => b.createdAt - a.createdAt);
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCommands = commands.slice(startIndex, endIndex);

      return res.json({
        commands: paginatedCommands,
        totalPages: Math.ceil(commands.length / limit),
        currentPage: page,
        total: commands.length,
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (error) {
    console.error('Get my commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export fallback commands for other controllers
exports.fallbackCommands = fallbackCommands; 