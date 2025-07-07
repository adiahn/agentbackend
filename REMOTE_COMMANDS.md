# V-Agent Remote Commands API

This document describes the remote command system for V-Agent, allowing admins to send commands to agents and agents to execute them.

## 🎯 **Overview**

The remote command system uses a **polling-based approach** where:
1. **Agents poll** the server every 30 seconds for pending commands
2. **Admins send** commands through authenticated endpoints
3. **Agents execute** commands and report back completion status
4. **System tracks** command history and status

## 📋 **Command Types**

| Command | Description | Parameters |
|---------|-------------|------------|
| `shutdown` | Shutdown the computer (always forced, no user alerts) | `delay: number` (optional delay in seconds) |
| `restart` | Restart the computer (always forced, no user alerts) | `delay: number` (optional delay in seconds) |
| `sleep` | Put computer to sleep | `duration: number` (seconds) |
| `hibernate` | Hibernate the computer | `force: boolean` |
| `lock` | Lock the computer | `timeout: number` |
| `unlock` | Unlock the computer | `timeout: number` |

## 🔐 **Security**

- **Agent Authentication**: Agents are identified by their `agentId`
- **Admin Authentication**: Admins use JWT tokens for command sending
- **Access Control**: Admins can only send commands to their own agents
- **Command Validation**: All commands are validated before processing

## 🌐 **API Endpoints**

### **Agent Endpoints (Public)**

#### **1. Get Pending Commands**
```http
GET /api/agent/:agentId/commands
```

**Response:**
```json
[
  {
    "id": "cmd-ABC12345",
    "type": "shutdown",
    "parameters": {
      "delay": 0
    },
    "priority": 1,
    "createdAt": "2024-07-02T12:00:00Z",
    "scheduledFor": null,
    "timeout": 300000
  }
]
```

#### **2. Complete Command**
```http
POST /api/agent/:agentId/command/:commandId/complete
Content-Type: application/json

{
  "status": "completed",
  "result": {
    "shutdownTime": "2024-07-02T12:01:00Z",
    "method": "system_shutdown_forced",
    "success": true
  }
}
```

**Response:**
```json
{
  "message": "Command completed",
  "command": {
    "id": "cmd-ABC12345",
    "type": "shutdown",
    "status": "completed",
    "completedAt": "2024-07-02T12:01:00Z",
    "result": {
      "shutdownTime": "2024-07-02T12:01:00Z",
      "method": "system_shutdown",
      "success": true
    },
    "error": null
  }
}
```

### **Admin Endpoints (Authenticated)**

#### **1. Send Command**
```http
POST /api/agent/:agentId/command
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "shutdown",
  "parameters": {
    "delay": 0
  },
  "priority": 1,
  "scheduledFor": "2024-07-02T13:00:00Z",
  "timeout": 300000
}
```

**Response:**
```json
{
  "message": "shutdown command sent successfully to agent",
  "command": {
    "id": "cmd-ABC12345",
    "type": "shutdown",
    "parameters": {
      "force": false,
      "timeout": 30
    },
    "priority": 1,
    "status": "pending",
    "createdAt": "2024-07-02T12:00:00Z",
    "scheduledFor": "2024-07-02T13:00:00Z"
  }
}
```

#### **2. Get My Commands**
```http
GET /api/my-commands?status=pending&page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "commands": [
    {
      "_id": "...",
      "commandId": "cmd-ABC12345",
      "agentId": "agent_001",
      "adminId": {
        "_id": "...",
        "username": "admin",
        "email": "admin@example.com"
      },
      "type": "shutdown",
      "parameters": {
        "force": false,
        "timeout": 30
      },
      "status": "pending",
      "priority": 1,
      "createdAt": "2024-07-02T12:00:00Z",
      "scheduledFor": null,
      "executedAt": null,
      "completedAt": null,
      "result": {},
      "error": null,
      "retryCount": 0,
      "maxRetries": 3,
      "timeout": 300000
    }
  ],
  "totalPages": 1,
  "currentPage": 1,
  "total": 1
}
```

## 📊 **Command Status Flow**

```
pending → executing → completed/failed
    ↓
cancelled
```

- **pending**: Command is waiting to be executed
- **executing**: Agent is currently processing the command
- **completed**: Command executed successfully
- **failed**: Command execution failed
- **cancelled**: Command was cancelled by admin

## 🔧 **Agent Implementation Guide**

### **Polling Logic**
```javascript
// Poll every 30 seconds
setInterval(async () => {
  try {
    const response = await fetch(`/api/agent/${agentId}/commands`);
    const commands = await response.json();
    
    if (commands.length > 0) {
      // Execute the first command (highest priority)
      const command = commands[0];
      await executeCommand(command);
    }
  } catch (error) {
    console.error('Failed to check commands:', error);
  }
}, 30000);
```

### **Command Execution**
```javascript
async function executeCommand(command) {
  try {
    console.log(`Executing ${command.type} command...`);
    
    // Execute based on command type
    let result = {};
    switch (command.type) {
      case 'shutdown':
        result = await executeShutdown(command.parameters);
        break;
      case 'restart':
        result = await executeRestart(command.parameters);
        break;
      case 'sleep':
        result = await executeSleep(command.parameters);
        break;
      // ... other commands
    }
    
    // Report completion
    await fetch(`/api/agent/${agentId}/command/${command.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        result: result
      })
    });
    
  } catch (error) {
    // Report failure
    await fetch(`/api/agent/${agentId}/command/${command.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'failed',
        error: error.message
      })
    });
  }
}
```

## 📝 **Command Parameters**

### **Shutdown Command**
```json
{
  "type": "shutdown",
  "parameters": {
    "delay": 0          // Optional delay in seconds before shutdown (default: 0)
  }
}
```

### **Restart Command**
```json
{
  "type": "restart",
  "parameters": {
    "delay": 0          // Optional delay in seconds before restart (default: 0)
  }
}
```

### **Sleep Command**
```json
{
  "type": "sleep",
  "parameters": {
    "duration": 300        // Sleep duration in seconds
  }
}
```

## ⚙️ **Advanced Features**

### **Command Priority**
- **1-10 scale** (1 = highest priority)
- Commands with higher priority are executed first
- Default priority is 1

### **Scheduled Commands**
```json
{
  "type": "shutdown",
  "scheduledFor": "2024-07-02T18:00:00Z",
  "parameters": {}
}
```

### **Command Timeouts**
- **Default**: 5 minutes (300,000ms)
- **Range**: 1 second to 1 hour
- Commands that exceed timeout are marked as failed

### **Retry Logic**
- **Max retries**: 3 (configurable)
- Failed commands can be retried automatically
- Retry count is tracked in the command object

## 🧪 **Testing**

Run the command tests:
```bash
npm run test:commands
```

This will test:
- ✅ Command sending
- ✅ Command polling
- ✅ Command completion
- ✅ Different command types
- ✅ Scheduled commands
- ✅ Priority handling

## 🔍 **Monitoring & Debugging**

### **Check Command Status**
```bash
# Get all pending commands for an admin
curl -H "Authorization: Bearer <token>" \
     "http://localhost:4000/api/my-commands?status=pending"

# Get all commands for a specific agent
curl -H "Authorization: Bearer <token>" \
     "http://localhost:4000/api/my-commands?agentId=agent_001"
```

### **Command History**
```bash
# Get completed commands
curl -H "Authorization: Bearer <token>" \
     "http://localhost:4000/api/my-commands?status=completed"

# Get failed commands
curl -H "Authorization: Bearer <token>" \
     "http://localhost:4000/api/my-commands?status=failed"
```

## 🚀 **Future Enhancements**

- **WebSocket support** for real-time command delivery
- **Command templates** for common operations
- **Batch commands** for multiple agents
- **Command approval workflow** for sensitive operations
- **Command logging** and audit trails
- **Conditional commands** based on agent state

## 📞 **Support**

For issues or questions:
1. Check the server logs for detailed error messages
2. Verify agent authentication and permissions
3. Ensure commands are properly formatted
4. Test with the provided test scripts 