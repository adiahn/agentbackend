const Agent = require('../models/Agent');
const ActivationCode = require('../models/ActivationCode');

// In-memory fallback store for when database is not available
const fallbackAgents = {};

// Report agent status (create or update)
exports.reportAgent = async (req, res) => {
  const { agentId, systemInfo, location } = req.body;
  if (!agentId || !systemInfo || !location) {
    return res.status(400).json({ error: 'Missing agentId, systemInfo, or location' });
  }
  
  try {
    // Try to use database first
    if (Agent.db.readyState === 1) {
      const agent = await Agent.findOneAndUpdate(
        { agentId },
        { systemInfo, location, lastSeen: new Date() },
        { upsert: false, new: true }
      );
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found. Please register with an activation code first.' });
      }
      
      return res.json({ success: true, agent, source: 'database' });
    } else {
      // Fallback to in-memory storage
      if (!fallbackAgents[agentId]) {
        return res.status(404).json({ error: 'Agent not found. Please register with an activation code first.' });
      }
      
      fallbackAgents[agentId] = { 
        ...fallbackAgents[agentId],
        systemInfo, 
        location, 
        lastSeen: new Date() 
      };
      
      return res.json({ 
        success: true, 
        agent: fallbackAgents[agentId], 
        source: 'memory',
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (err) {
    // If database fails, use fallback
    if (!fallbackAgents[agentId]) {
      return res.status(404).json({ error: 'Agent not found. Please register with an activation code first.' });
    }
    
    fallbackAgents[agentId] = { 
      ...fallbackAgents[agentId],
      systemInfo, 
      location, 
      lastSeen: new Date() 
    };
    
    res.json({ 
      success: true, 
      agent: fallbackAgents[agentId], 
      source: 'memory',
      warning: 'Database error, using in-memory storage'
    });
  }
};

// Get all agents for authenticated admin
exports.getMyAgents = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    // Try to use database first
    if (Agent.db.readyState === 1) {
      const agents = await Agent.find({ adminId })
        .populate('activationCodeId', 'code')
        .sort({ lastSeen: -1 });
      
      return res.json({ agents, source: 'database' });
    } else {
      // Fallback to in-memory storage
      const agents = Object.values(fallbackAgents).filter(agent => 
        agent.adminId === adminId.toString()
      );
      
      return res.json({ 
        agents, 
        source: 'memory',
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (err) {
    // If database fails, use fallback
    const agents = Object.values(fallbackAgents).filter(agent => 
      agent.adminId === req.admin._id.toString()
    );
    
    res.json({ 
      agents, 
      source: 'memory',
      warning: 'Database error, showing in-memory data'
    });
  }
};

// Get specific agent for authenticated admin
exports.getAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    
    // Try to use database first
    if (Agent.db.readyState === 1) {
      const agent = await Agent.findOne({ agentId, adminId })
        .populate('activationCodeId', 'code');
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      return res.json({ agent, source: 'database' });
    } else {
      // Fallback to in-memory storage
      const agent = fallbackAgents[agentId];
      
      if (!agent || agent.adminId !== adminId.toString()) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      return res.json({ 
        agent, 
        source: 'memory',
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all agents (super admin only)
exports.getAllAgents = async (req, res) => {
  try {
    // Try to use database first
    if (Agent.db.readyState === 1) {
      const agents = await Agent.find()
        .populate('adminId', 'username email')
        .populate('activationCodeId', 'code')
        .sort({ lastSeen: -1 });
      
      return res.json({ agents, source: 'database' });
    } else {
      // Fallback to in-memory storage
      const agents = Object.values(fallbackAgents);
      
      return res.json({ 
        agents, 
        source: 'memory',
        warning: 'Database not available, showing in-memory data'
      });
    }
  } catch (err) {
    // If database fails, use fallback
    const agents = Object.values(fallbackAgents);
    
    res.json({ 
      agents, 
      source: 'memory',
      warning: 'Database error, showing in-memory data'
    });
  }
};

// Deactivate agent
exports.deactivateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminId = req.admin._id;
    
    // Try to use database first
    if (Agent.db.readyState === 1) {
      const agent = await Agent.findOne({ agentId, adminId });
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      agent.isActive = false;
      await agent.save();
      
      return res.json({ 
        message: 'Agent deactivated successfully',
        agent,
        source: 'database'
      });
    } else {
      // Fallback to in-memory storage
      const agent = fallbackAgents[agentId];
      
      if (!agent || agent.adminId !== adminId.toString()) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      agent.isActive = false;
      
      return res.json({ 
        message: 'Agent deactivated successfully',
        agent,
        source: 'memory',
        warning: 'Database not available, using in-memory storage'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 