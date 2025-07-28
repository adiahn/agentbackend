# USB Control System Documentation

## Overview

The USB Control System allows administrators to remotely enable or disable USB devices on managed agents. This system provides secure, auditable control over USB access with full command history tracking.

## Features

- **Remote USB Control**: Enable/disable USB devices on agents
- **Audit Trail**: Complete history of all USB control commands
- **Real-time Status**: Current USB status for each agent
- **Admin Authentication**: Secure access control
- **Command Priority**: Priority-based command execution
- **Fallback Support**: In-memory storage when database is unavailable

## Database Schema

### UsbControlCommand Model

Tracks individual USB control commands sent to agents.

```javascript
{
  commandId: String,        // Unique command identifier (usb-XXXXXXXX)
  agentId: String,          // Target agent ID
  adminId: ObjectId,        // Admin who sent the command
  action: String,           // 'enable' or 'disable'
  reason: String,           // Admin's reason for the command
  status: String,           // 'pending', 'executing', 'completed', 'failed', 'cancelled'
  priority: Number,         // 1-10 (higher = more important)
  createdAt: Date,          // When command was created
  executedAt: Date,         // When agent started executing
  completedAt: Date,        // When command completed
  result: Object,           // Execution result from agent
  error: String,            // Error message if failed
  retryCount: Number,       // Number of retry attempts
  maxRetries: Number,       // Maximum retry attempts (default: 3)
  timeout: Number           // Command timeout in milliseconds
}
```

### UsbStatus Model

Tracks current USB status for each agent.

```javascript
{
  agentId: String,          // Agent identifier
  isEnabled: Boolean,       // Current USB status
  lastUpdated: Date,        // Last status update
  lastCommandId: String,    // ID of last command executed
  lastCommandAction: String, // 'enable' or 'disable'
  lastCommandReason: String, // Reason for last command
  lastCommandAdminId: ObjectId, // Admin who sent last command
  lastCommandAt: Date,      // When last command was sent
  notes: String             // Additional notes
}
```

## API Endpoints

### 1. Send USB Control Command

**POST** `/api/usb/agent/:agentId/usb-command`

Send a USB control command to a specific agent.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "disable",
  "reason": "Security lockdown - unauthorized device detected",
  "priority": 1,
  "timeout": 300000
}
```

**Response:**
```json
{
  "message": "USB disable command sent successfully to agent",
  "command": {
    "id": "usb-A1B2C3D4",
    "action": "disable",
    "reason": "Security lockdown - unauthorized device detected",
    "priority": 1,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "usbStatus": {
    "isEnabled": false,
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "lastCommandAction": "disable",
    "lastCommandReason": "Security lockdown - unauthorized device detected"
  }
}
```

### 2. Get USB Status

**GET** `/api/usb/agent/:agentId/usb-status`

Get current USB status for an agent.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "agentId": "agent-123",
  "isEnabled": false,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "lastCommandId": "usb-A1B2C3D4",
  "lastCommandAction": "disable",
  "lastCommandReason": "Security lockdown",
  "lastCommandAdmin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@company.com"
  },
  "lastCommandAt": "2024-01-15T10:30:00.000Z",
  "notes": null
}
```

### 3. Get USB History

**GET** `/api/usb/agent/:agentId/usb-history?page=1&limit=20`

Get USB control command history for an agent.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "commands": [
    {
      "id": "usb-A1B2C3D4",
      "action": "disable",
      "reason": "Security lockdown",
      "status": "completed",
      "priority": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "executedAt": "2024-01-15T10:30:05.000Z",
      "completedAt": "2024-01-15T10:30:10.000Z",
      "result": {
        "success": true,
        "message": "USB devices disabled successfully"
      },
      "error": null,
      "admin": {
        "id": "507f1f77bcf86cd799439011",
        "username": "admin",
        "email": "admin@company.com"
      }
    }
  ],
  "totalPages": 1,
  "currentPage": 1,
  "total": 1
}
```

### 4. Agent Polling (Public)

**GET** `/api/usb/agent/:agentId/usb-commands`

Get pending USB commands for an agent (no authentication required).

**Response:**
```json
[
  {
    "id": "usb-A1B2C3D4",
    "type": "usb_control",
    "parameters": {
      "action": "disable",
      "reason": "Security lockdown",
      "adminId": "507f1f77bcf86cd799439011"
    },
    "priority": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "timeout": 300000
  }
]
```

### 5. Start Command Execution (Public)

**POST** `/api/usb/agent/:agentId/usb-command/:commandId/start`

Mark a USB command as executing (no authentication required).

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "message": "USB command marked as executing",
  "command": {
    "id": "usb-A1B2C3D4",
    "action": "disable",
    "status": "executing",
    "executedAt": "2024-01-15T10:30:05.000Z"
  }
}
```

### 6. Complete Command (Public)

**POST** `/api/usb/agent/:agentId/usb-command/:commandId/complete`

Mark a USB command as completed or failed (no authentication required).

**Request Body:**
```json
{
  "status": "completed",
  "result": {
    "success": true,
    "message": "USB devices disabled successfully",
    "devicesAffected": 3
  }
}
```

**Response:**
```json
{
  "message": "USB command completed",
  "command": {
    "id": "usb-A1B2C3D4",
    "action": "disable",
    "status": "completed",
    "completedAt": "2024-01-15T10:30:10.000Z",
    "result": {
      "success": true,
      "message": "USB devices disabled successfully",
      "devicesAffected": 3
    },
    "error": null
  }
}
```

## General Command Endpoint Support

The USB control system also integrates with the general command endpoint:

**POST** `/api/command/agent/:agentId/command`

**Request Body:**
```json
{
  "type": "usb_control",
  "parameters": {
    "action": "disable",
    "reason": "Security lockdown",
    "adminId": "507f1f77bcf86cd799439011"
  },
  "priority": 1
}
```

## Command Format for Agents

When agents poll for commands, USB control commands are returned in this format:

```json
{
  "id": "usb-A1B2C3D4",
  "type": "usb_control",
  "parameters": {
    "action": "disable",
    "reason": "Security lockdown - unauthorized device detected",
    "adminId": "507f1f77bcf86cd799439011"
  },
  "priority": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "timeout": 300000
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid action. Must be \"enable\" or \"disable\""
}
```

**401 Unauthorized:**
```json
{
  "error": "Access denied. Valid token required."
}
```

**404 Not Found:**
```json
{
  "error": "Agent not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Server error"
}
```

## Security Considerations

1. **Authentication Required**: All admin endpoints require valid JWT tokens
2. **Agent Verification**: Commands can only be sent to agents owned by the authenticated admin
3. **Input Validation**: All inputs are validated and sanitized
4. **Audit Trail**: All commands are logged with admin information
5. **Fallback Security**: In-memory storage maintains security when database is unavailable

## Testing

Use the provided test file to verify functionality:

```bash
node test-usb-control.js
```

## Integration with Frontend

The frontend can integrate with these endpoints to provide:

1. **USB Control Panel**: Enable/disable buttons with reason input
2. **Status Display**: Real-time USB status indicators
3. **History View**: Paginated command history with filtering
4. **Admin Dashboard**: USB control section with agent management

## Database Indexes

The following indexes are created for optimal performance:

- `{ agentId: 1, status: 1 }` - Fast command queries by agent and status
- `{ adminId: 1 }` - Fast queries by admin
- `{ createdAt: 1 }` - Fast chronological queries
- `{ commandId: 1 }` - Fast command lookups

## Fallback System

When the database is unavailable, the system falls back to in-memory storage:

- Commands are stored in memory
- Status is maintained in memory
- All functionality remains available
- Data is lost on server restart
- Warning messages indicate fallback mode

## Monitoring and Logging

All USB control operations are logged with:
- Timestamp
- Admin information
- Agent information
- Command details
- Execution results
- Error messages

This provides complete auditability for compliance and security purposes. 