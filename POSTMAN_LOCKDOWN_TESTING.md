# 🚨 V-Agent Lockdown System - Postman Testing Guide

## 📋 Prerequisites

1. **Server Running**: Make sure your V-Agent server is running on `http://localhost:4000`
2. **Database Connected**: Ensure MongoDB is connected and running
3. **Postman Installed**: Download and install Postman from [postman.com](https://postman.com)

## 🚀 Quick Setup

### **Step 1: Import Collection**
1. Open Postman
2. Click **Import** button
3. Select the `postman-lockdown-collection.json` file
4. The collection will be imported with all requests pre-configured

### **Step 2: Verify Environment Variables**
The collection uses these variables automatically:
- `{{baseUrl}}` = `http://localhost:4000`
- `{{adminToken}}` = Will be set automatically after login
- `{{agentId}}` = Will be set automatically after agent registration

## 🧪 Testing Sequence

### **Phase 1: System Health Check**

#### **1. Health Check**
```
GET {{baseUrl}}/
```
**Expected Response:**
```json
{
  "message": "SystemMonitor Backend is running",
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "2.0.0",
  "features": [
    "Admin Authentication",
    "Activation Code Management", 
    "Agent Management",
    "JWT Security"
  ]
}
```

### **Phase 2: Authentication**

#### **2. Admin Login**
```
POST {{baseUrl}}/api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```
**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "username": "admin",
    "email": "admin@company.com"
  }
}
```

**✅ This automatically saves the token to `{{adminToken}}`**

### **Phase 3: Agent Setup**

#### **3. Register Test Agent**
```
POST {{baseUrl}}/api/agent/register
Content-Type: application/json

{
  "hostname": "TEST-PC-001",
  "platform": "win32",
  "version": "10.0.19044",
  "macAddress": "00:11:22:33:44:55",
  "ipAddress": "192.168.1.100"
}
```
**Expected Response:**
```json
{
  "message": "Agent registered successfully",
  "agent": {
    "agentId": "agt-ABC12345",
    "hostname": "TEST-PC-001",
    "platform": "win32",
    "isActive": true
  }
}
```

**✅ This automatically saves the agent ID to `{{agentId}}`**

#### **4. Report Agent Status**
```
POST {{baseUrl}}/api/agent/{{agentId}}/status
Content-Type: application/json

{
  "status": "online",
  "lastSeen": "2024-01-01T12:00:00.000Z",
  "systemInfo": {
    "cpu": "Intel Core i7",
    "memory": "16GB",
    "disk": "1TB SSD"
  }
}
```

#### **5. Verify Agent Registration**
```
GET {{baseUrl}}/api/admin/my-agents
```
**Expected Response:**
```json
{
  "agents": [
    {
      "agentId": "agt-ABC12345",
      "hostname": "TEST-PC-001",
      "platform": "win32",
      "isActive": true,
      "lastSeen": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### **Phase 4: Lockdown Testing**

#### **6. Initiate Lockdown**
```
POST {{baseUrl}}/api/lockdown/agent/{{agentId}}/lockdown
Content-Type: application/json

{
  "adminContactInfo": {
    "name": "John Administrator",
    "phone": "+1-555-0123",
    "email": "admin@company.com",
    "message": "Your system has been locked down for security reasons. Please contact IT immediately."
  },
  "reason": "Security incident detected - unauthorized access attempt",
  "priority": 10
}
```
**Expected Response:**
```json
{
  "message": "Lockdown command sent successfully to agent",
  "lockdown": {
    "id": "...",
    "agentId": "agt-ABC12345",
    "isLockedDown": true,
    "initiatedAt": "2024-01-01T12:00:00.000Z",
    "reason": "Security incident detected - unauthorized access attempt",
    "adminContactInfo": {
      "name": "John Administrator",
      "phone": "+1-555-0123",
      "email": "admin@company.com",
      "message": "Your system has been locked down for security reasons. Please contact IT immediately."
    }
  },
  "command": {
    "id": "cmd-ABC12345",
    "type": "lockdown",
    "priority": 10,
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **7. Check Lockdown Status**
```
GET {{baseUrl}}/api/lockdown/agent/{{agentId}}/lockdown-status
```
**Expected Response:**
```json
{
  "isLockedDown": true,
  "agentId": "agt-ABC12345",
  "lockdownInfo": {
    "initiatedAt": "2024-01-01T12:00:00.000Z",
    "reason": "Security incident detected - unauthorized access attempt",
    "adminContactInfo": {
      "name": "John Administrator",
      "phone": "+1-555-0123",
      "email": "admin@company.com",
      "message": "Your system has been locked down for security reasons. Please contact IT immediately."
    },
    "lastHeartbeat": "2024-01-01T12:00:00.000Z",
    "securityChecks": {
      "registryTampered": false,
      "processKilled": false,
      "networkDisconnected": false,
      "lastCheckTime": "2024-01-01T12:00:00.000Z"
    }
  },
  "systemInfo": {
    "hostname": "TEST-PC-001",
    "platform": "win32",
    "version": "10.0.19044",
    "lastBootTime": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **8. Get All Locked Agents**
```
GET {{baseUrl}}/api/lockdown/my-locked-agents
```
**Expected Response:**
```json
{
  "lockdownStates": [
    {
      "id": "...",
      "agentId": "agt-ABC12345",
      "initiatedAt": "2024-01-01T12:00:00.000Z",
      "reason": "Security incident detected - unauthorized access attempt",
      "adminContactInfo": {
        "name": "John Administrator",
        "phone": "+1-555-0123",
        "email": "admin@company.com",
        "message": "Your system has been locked down for security reasons. Please contact IT immediately."
      },
      "lastHeartbeat": "2024-01-01T12:00:00.000Z",
      "securityChecks": {
        "registryTampered": false,
        "processKilled": false,
        "networkDisconnected": false,
        "lastCheckTime": "2024-01-01T12:00:00.000Z"
      },
      "systemInfo": {
        "hostname": "TEST-PC-001",
        "platform": "win32",
        "version": "10.0.19044",
        "lastBootTime": "2024-01-01T12:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 1,
    "total": 1
  }
}
```

#### **9. Simulate Agent Heartbeat**
```
POST {{baseUrl}}/api/lockdown/agent/{{agentId}}/lockdown/heartbeat
Content-Type: application/json

{
  "systemInfo": {
    "hostname": "TEST-PC-001",
    "platform": "win32",
    "version": "10.0.19044",
    "lastBootTime": "2024-01-01T12:00:00.000Z"
  },
  "securityChecks": {
    "registryTampered": false,
    "processKilled": false,
    "networkDisconnected": false,
    "lastCheckTime": "2024-01-01T12:00:00.000Z"
  }
}
```
**Expected Response:**
```json
{
  "message": "Heartbeat updated",
  "isLockedDown": true
}
```

### **Phase 5: Command System Testing**

#### **10. Get Pending Commands**
```
GET {{baseUrl}}/api/agent/{{agentId}}/commands
```
**Expected Response:**
```json
[
  {
    "id": "cmd-ABC12345",
    "type": "lockdown",
    "parameters": {
      "adminContactInfo": {
        "name": "John Administrator",
        "phone": "+1-555-0123",
        "email": "admin@company.com",
        "message": "Your system has been locked down for security reasons. Please contact IT immediately."
      },
      "reason": "Security incident detected - unauthorized access attempt",
      "priority": 10
    },
    "priority": 10,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "scheduledFor": null,
    "timeout": 60000
  }
]
```

#### **11. Complete Command (Simulate Agent Execution)**
```
POST {{baseUrl}}/api/agent/{{agentId}}/command/cmd-ABC12345/complete
Content-Type: application/json

{
  "status": "completed",
  "result": {
    "lockdownTime": "2024-01-01T12:00:00.000Z",
    "method": "system_lockdown",
    "success": true
  }
}
```

### **Phase 6: Release Lockdown**

#### **12. Release Lockdown**
```
POST {{baseUrl}}/api/lockdown/agent/{{agentId}}/unlockdown
Content-Type: application/json

{
  "reason": "Security incident resolved - lockdown released"
}
```
**Expected Response:**
```json
{
  "message": "Unlockdown command sent successfully to agent",
  "lockdown": {
    "id": "...",
    "agentId": "agt-ABC12345",
    "isLockedDown": false,
    "releasedAt": "2024-01-01T12:00:00.000Z"
  },
  "command": {
    "id": "cmd-DEF67890",
    "type": "unlockdown",
    "priority": 10,
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### **13. Verify Lockdown Released**
```
GET {{baseUrl}}/api/lockdown/agent/{{agentId}}/lockdown-status
```
**Expected Response:**
```json
{
  "isLockedDown": false,
  "agentId": "agt-ABC12345",
  "message": "No lockdown state found"
}
```

## 🧪 Advanced Testing Scenarios

### **Scenario 1: Duplicate Lockdown Prevention**
1. Initiate lockdown (should succeed)
2. Try to initiate lockdown again (should fail with 400 error)
3. Check error message about already being locked down

### **Scenario 2: Invalid Agent ID**
1. Try to lockdown with non-existent agent ID
2. Should get 404 "Agent not found" error

### **Scenario 3: Missing Contact Information**
1. Try to lockdown without admin contact info
2. Should get 400 error about missing phone number

### **Scenario 4: Unauthorized Access**
1. Remove the Authorization header
2. Try to access lockdown endpoints
3. Should get 401 "Access denied" error

### **Scenario 5: Security Breach Simulation**
1. Initiate lockdown
2. Send heartbeat with `registryTampered: true`
3. Check if security breach is logged

## 📊 Expected Test Results

### **✅ Success Cases:**
- All endpoints return correct HTTP status codes
- JSON responses match expected schema
- Variables are automatically set and used
- Lockdown state persists across requests
- Commands are properly created and tracked

### **❌ Error Cases:**
- Invalid credentials return 401
- Missing data returns 400 with clear error messages
- Non-existent resources return 404
- Server errors return 500

## 🔧 Troubleshooting

### **Common Issues:**

1. **Server Not Running**
   - Error: "ECONNREFUSED"
   - Solution: Start the server with `npm start` in the server directory

2. **Database Connection Issues**
   - Error: "MongoNetworkError"
   - Solution: Ensure MongoDB is running and connection string is correct

3. **Authentication Failures**
   - Error: "Access denied" or 401
   - Solution: Check admin credentials or create admin user first

4. **Agent Not Found**
   - Error: "Agent not found" or 404
   - Solution: Register agent first or check agent ID

5. **Missing Variables**
   - Error: "{{variable}} is not defined"
   - Solution: Run requests in sequence to set variables automatically

### **Debug Tips:**

1. **Check Console Logs**: Look at server console for detailed error messages
2. **Verify Database**: Check MongoDB for created documents
3. **Test Individual Endpoints**: Use curl or browser to test simple endpoints
4. **Check Network Tab**: Use browser dev tools to see actual HTTP requests

## 🎯 Testing Checklist

- [ ] Server health check passes
- [ ] Admin login works and token is saved
- [ ] Agent registration creates agent and saves ID
- [ ] Lockdown initiation creates command and state
- [ ] Lockdown status shows correct information
- [ ] Heartbeat updates work properly
- [ ] Command polling returns pending commands
- [ ] Command completion updates status
- [ ] Lockdown release works correctly
- [ ] Error handling works for invalid requests
- [ ] Security checks are logged properly

## 🚀 Next Steps

After successful Postman testing:

1. **Test with Real Agent**: Deploy the frontend and test with actual agent
2. **Test Persistence**: Restart server and verify lockdown state persists
3. **Test Security**: Attempt to bypass lockdown and verify protection
4. **Performance Testing**: Test with multiple agents and concurrent requests
5. **Integration Testing**: Test with full system including UI components

---

**Happy Testing! 🎉**

If you encounter any issues, check the server logs and database state for debugging information. 