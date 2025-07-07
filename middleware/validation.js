const { body, param, query } = require('express-validator');

// Admin validation rules
const adminValidation = {
  register: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['admin', 'super_admin'])
      .withMessage('Role must be either admin or super_admin')
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  updateProfile: [
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ]
};

// Activation code validation rules
const activationCodeValidation = {
  generate: [
    body('count')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Count must be between 1 and 10'),
    body('expiresInDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Expiration days must be between 1 and 365')
  ],
  
  useCode: [
    body('code')
      .isLength({ min: 8, max: 8 })
      .withMessage('Activation code must be exactly 8 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Activation code can only contain uppercase letters and numbers'),
    body('pcName')
      .notEmpty()
      .withMessage('PC name is required')
  ],
  
  getCode: [
    param('codeId')
      .isMongoId()
      .withMessage('Invalid code ID format')
  ],
  
  deactivateCode: [
    param('codeId')
      .isMongoId()
      .withMessage('Invalid code ID format')
  ]
};

// Agent validation rules
const agentValidation = {
  report: [
    body('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('systemInfo')
      .isObject()
      .withMessage('System info must be an object'),
    body('location')
      .isObject()
      .withMessage('Location must be an object')
  ],
  
  getAgent: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required')
  ],
  
  deactivateAgent: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required')
  ]
};

// Query validation rules
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['active', 'used', 'expired'])
      .withMessage('Status must be active, used, or expired')
  ]
};

// Command validation rules
const commandValidation = {
  getPendingCommands: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required')
  ],

  startCommand: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    param('commandId')
      .notEmpty()
      .withMessage('Command ID is required')
  ],

  completeCommand: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    param('commandId')
      .notEmpty()
      .withMessage('Command ID is required'),
    body('status')
      .isIn(['completed', 'failed'])
      .withMessage('Status must be either "completed" or "failed"'),
    body('result')
      .optional()
      .isObject()
      .withMessage('Result must be an object'),
    body('error')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Error message must be less than 1000 characters')
  ],

  sendCommand: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('type')
      .isIn(['shutdown', 'restart', 'sleep', 'hibernate', 'lock', 'unlock'])
      .withMessage('Type must be one of: shutdown, restart, sleep, hibernate, lock, unlock'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('Parameters must be an object')
      .custom((parameters, { req }) => {
        // Special validation for shutdown and restart commands
        if (req.body.type === 'shutdown' || req.body.type === 'restart') {
          // Only allow delay parameter for shutdown/restart commands
          const allowedKeys = ['delay'];
          const providedKeys = Object.keys(parameters || {});
          const invalidKeys = providedKeys.filter(key => !allowedKeys.includes(key));
          
          if (invalidKeys.length > 0) {
            throw new Error(`For ${req.body.type} commands, only 'delay' parameter is allowed. Invalid parameters: ${invalidKeys.join(', ')}`);
          }
          
          // Validate delay parameter if provided
          if (parameters && parameters.delay !== undefined) {
            if (typeof parameters.delay !== 'number' || parameters.delay < 0) {
              throw new Error('Delay parameter must be a non-negative number (seconds)');
            }
          }
        }
        return true;
      }),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Priority must be between 1 and 10'),
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('ScheduledFor must be a valid ISO 8601 date'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 3600000 })
      .withMessage('Timeout must be between 1 second and 1 hour (in milliseconds)')
  ]
};

// Lockdown validation rules
const lockdownValidation = {
  initiateLockdown: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('adminContactInfo')
      .isObject()
      .withMessage('Admin contact info must be an object'),
    body('adminContactInfo.name')
      .notEmpty()
      .withMessage('Admin name is required'),
    body('adminContactInfo.phone')
      .notEmpty()
      .withMessage('Admin phone is required'),
    body('adminContactInfo.email')
      .isEmail()
      .withMessage('Valid admin email is required'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
    body('unlockPin')
      .optional()
      .matches(/^\d{4}$/)
      .withMessage('PIN must be exactly 4 digits'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid ISO 8601 date')
  ],

  releaseLockdown: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
  ],

  emergencyOverride: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
  ],

  getStatus: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required')
  ],

  getHistory: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    query('eventType')
      .optional()
      .isIn(['lockdown', 'unlock', 'emergency_override', 'expired', 'heartbeat', 'pin_verification', 'pin_unlock'])
      .withMessage('Invalid event type')
  ],

  getAllLockdowns: [
    query('status')
      .optional()
      .isIn(['active', 'all'])
      .withMessage('Status must be active or all'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  verifyPin: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('pin')
      .matches(/^\d{4}$/)
      .withMessage('PIN must be exactly 4 digits')
  ],

  unlockWithPin: [
    param('agentId')
      .notEmpty()
      .withMessage('Agent ID is required'),
    body('pin')
      .matches(/^\d{4}$/)
      .withMessage('PIN must be exactly 4 digits')
  ]
};

module.exports = {
  adminValidation,
  activationCodeValidation,
  agentValidation,
  commandValidation,
  queryValidation,
  lockdownValidation
}; 