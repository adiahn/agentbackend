const { validationResult } = require('express-validator');
const ActivationCode = require('../models/ActivationCode');
const Agent = require('../models/Agent');
const { v4: uuidv4 } = require('uuid');

// Generate activation codes
exports.generateCodes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { count = 1, expiresInDays = 30 } = req.body;
    const adminId = req.admin._id;

    if (count < 1 || count > 10) {
      return res.status(400).json({ error: 'Count must be between 1 and 10' });
    }

    const codes = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    for (let i = 0; i < count; i++) {
      let code;
      let isUnique = false;
      
      // Generate unique code
      while (!isUnique) {
        code = ActivationCode.generateCode();
        const existingCode = await ActivationCode.findOne({ code });
        if (!existingCode) {
          isUnique = true;
        }
      }

      const activationCode = new ActivationCode({
        code,
        adminId,
        expiresAt
      });

      await activationCode.save();
      codes.push(activationCode);
    }

    res.status(201).json({
      message: `${count} activation code(s) generated successfully`,
      codes: codes.map(code => ({
        id: code._id,
        code: code.code,
        expiresAt: code.expiresAt,
        isUsed: code.isUsed
      }))
    });
  } catch (error) {
    console.error('Generate codes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get admin's activation codes
exports.getMyCodes = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { adminId };
    
    // Filter by status
    if (status === 'active') {
      query.isUsed = false;
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'used') {
      query.isUsed = true;
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    }

    const codes = await ActivationCode.find(query)
      .populate('agentId', 'agentId systemInfo lastSeen')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivationCode.countDocuments(query);

    res.json({
      codes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get specific activation code
exports.getCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    const adminId = req.admin._id;

    const activationCode = await ActivationCode.findOne({
      _id: codeId,
      adminId
    }).populate('agentId', 'agentId systemInfo lastSeen');

    if (!activationCode) {
      return res.status(404).json({ error: 'Activation code not found' });
    }

    res.json({ activationCode });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Deactivate activation code
exports.deactivateCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    const adminId = req.admin._id;

    const activationCode = await ActivationCode.findOne({
      _id: codeId,
      adminId
    });

    if (!activationCode) {
      return res.status(404).json({ error: 'Activation code not found' });
    }

    if (activationCode.isUsed) {
      return res.status(400).json({ error: 'Cannot deactivate used code' });
    }

    activationCode.isActive = false;
    await activationCode.save();

    res.json({
      message: 'Activation code deactivated successfully',
      activationCode
    });
  } catch (error) {
    console.error('Deactivate code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Use activation code (for agent registration)
exports.useCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, pcName } = req.body;

    // Find activation code
    const activationCode = await ActivationCode.findOne({ code });
    if (!activationCode) {
      return res.status(404).json({ error: 'Invalid activation code' });
    }

    // Check if code is valid
    if (!activationCode.isValid()) {
      return res.status(400).json({ 
        error: activationCode.isUsed ? 'Code already used' : 
               activationCode.isExpired() ? 'Code expired' : 'Code inactive'
      });
    }

    // Generate unique agentId
    let agentId;
    let isUnique = false;
    while (!isUnique) {
      agentId = uuidv4();
      const existingAgent = await Agent.findOne({ agentId });
      if (!existingAgent) isUnique = true;
    }

    // Create agent
    const agent = new Agent({
      agentId,
      systemInfo: {}, // Will be updated later
      location: {},   // Will be updated later
      pcName,
      adminId: activationCode.adminId,
      activationCodeId: activationCode._id
    });

    await agent.save();

    // Mark activation code as used
    activationCode.isUsed = true;
    activationCode.agentId = agentId;
    activationCode.usedAt = new Date();
    await activationCode.save();

    res.status(201).json({
      message: 'Agent registered successfully',
      agent: {
        agentId: agent.agentId,
        adminId: agent.adminId,
        pcName: agent.pcName
      }
    });
  } catch (error) {
    console.error('Use code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all activation codes (super admin only)
exports.getAllCodes = async (req, res) => {
  try {
    const { page = 1, limit = 20, adminId } = req.query;

    const query = {};
    if (adminId) {
      query.adminId = adminId;
    }

    const codes = await ActivationCode.find(query)
      .populate('adminId', 'username email')
      .populate('agentId', 'agentId systemInfo lastSeen')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivationCode.countDocuments(query);

    res.json({
      codes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all codes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 