# 🚀 V-Agent System - Frontend Integration Guide

## 📋 **System Overview**

**V-Agent** is a comprehensive remote computer management and security system that allows administrators to:

- **Manage Agents**: Register, monitor, and control remote computers
- **Send Commands**: Execute system commands remotely (shutdown, restart, lock, etc.)
- **Security Lockdown**: Emergency lockdown capabilities for security incidents
- **Activation System**: Secure agent registration with unique activation codes
- **Real-time Monitoring**: Track agent status and system information

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Agents        │
│   (Your App)    │◄──►│   (This Server) │◄──►│   (Remote PCs)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Key Components:**

1. **Admin Dashboard** (Frontend) - Web interface for administrators
2. **Backend API** (This Server) - RESTful API with JWT authentication
3. **Agent Software** (Remote PCs) - Lightweight client that polls for commands

## 🔐 **Authentication System**

### **JWT Token Authentication**
- **Token Format**: `Bearer <jwt-token>`
- **Expiration**: 24 hours
- **Storage**: Store in localStorage or secure cookie
- **Auto-refresh**: Implement token refresh logic

### **User Roles**
- **admin**: Regular administrator (can manage own agents)
- **super_admin**: System administrator (can manage all agents and admins)

## 📊 **Data Models**

### **Admin Model**
```typescript
interface Admin {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
}
```

### **Agent Model**
```typescript
interface Agent {
  _id: string;
  agentId: string;
  pcName: string;
  adminId: string;
  activationCodeId: string;
  isActive: boolean;
  lastSeen: Date;
  systemInfo: {
    os?: string;
    version?: string;
    architecture?: string;
    hostname?: string;
    cpu?: string;
    memory?: string;
    disk?: string;
    uptime?: number;
    load?: number;
  };
  location: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    timezone?: string;
  };
  createdAt: Date;
}
```

### **Activation Code Model**
```typescript
interface ActivationCode {
  _id: string;
  code: string; // 8-character unique code
  adminId: string;
  agentId?: string; // null if unused
  isUsed: boolean;
  isActive: boolean;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}
```

### **Command Model**
```typescript
interface Command {
  _id: string;
  commandId: string;
  agentId: string;
  adminId: string;
  type: 'shutdown' | 'restart' | 'sleep' | 'hibernate' | 'lock' | 'unlock' | 'lockdown' | 'unlockdown';
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  priority: number; // 1-10
  createdAt: Date;
  scheduledFor?: Date;
  executedAt?: Date;
  completedAt?: Date;
  result?: Record<string, any>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  timeout: number;
}
```

### **Lockdown State Model**
```typescript
interface LockdownState {
  _id: string;
  agentId: string;
  adminId: string;
  isLockedDown: boolean;
  lockdownInitiatedAt?: Date;
  lockdownInitiatedBy?: string;
  adminContactInfo: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  };
  lockdownReason: string;
  lastHeartbeat: Date;
  systemInfo: {
    hostname?: string;
    platform?: string;
    version?: string;
    lastBootTime?: Date;
  };
  securityChecks: {
    registryTampered: boolean;
    processKilled: boolean;
    networkDisconnected: boolean;
    lastCheckTime: Date;
  };
  metadata: {
    commandId?: string;
    sessionId?: string;
    clientIp?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🌐 **API Endpoints**

### **Base URL**: `http://localhost:4000/api`

---

## 🔐 **Authentication Endpoints**

### **1. Admin Login**
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "admin": {
    "_id": "...",
    "username": "admin",
    "email": "admin@company.com",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **2. Get Admin Profile**
```http
GET /api/admin/profile
Authorization: Bearer <jwt-token>
```

### **3. Update Admin Profile**
```http
PUT /api/admin/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@company.com"
}
```

### **4. Change Password**
```http
PUT /api/admin/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 🔑 **Activation Code Management**

### **1. Generate Activation Codes**
```http
POST /api/activation/generate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "count": 5,
  "expiresInDays": 30
}
```

**Response:**
```json
{
  "message": "Activation codes generated successfully",
  "codes": [
    {
      "_id": "...",
      "code": "ABC12345",
      "isUsed": false,
      "isActive": true,
      "expiresAt": "2024-02-15T10:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### **2. Get My Activation Codes**
```http
GET /api/activation/my-codes?status=active&page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status`: `active` | `used` | `expired`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### **3. Get Specific Activation Code**
```http
GET /api/activation/code/:codeId
Authorization: Bearer <jwt-token>
```

### **4. Deactivate Activation Code**
```http
PUT /api/activation/deactivate/:codeId
Authorization: Bearer <jwt-token>
```

---

## 🤖 **Agent Management**

### **1. Get My Agents**
```http
GET /api/agent/my-agents
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "agents": [
    {
      "_id": "...",
      "agentId": "agent_001",
      "pcName": "DESKTOP-ABC123",
      "isActive": true,
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "systemInfo": {
        "os": "Windows 10",
        "version": "10.0.19044",
        "hostname": "DESKTOP-ABC123"
      },
      "location": {
        "city": "New York",
        "country": "USA"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### **2. Get Specific Agent**
```http
GET /api/agent/:agentId
Authorization: Bearer <jwt-token>
```

### **3. Deactivate Agent**
```http
PUT /api/agent/deactivate/:agentId
Authorization: Bearer <jwt-token>
```

---

## ⚡ **Remote Commands**

### **1. Send Command to Agent**
```http
POST /api/command/agent/:agentId/command
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "shutdown",
  "parameters": {
    "delay": 0
  },
  "priority": 1,
  "scheduledFor": "2024-01-15T13:00:00.000Z",
  "timeout": 300000
}
```

**Command Types & Parameters:**
- `shutdown`: `{ delay: number }` (delay in seconds)
- `restart`: `{ delay: number }` (delay in seconds)
- `sleep`: `{ duration: number }` (seconds)
- `hibernate`: `{ force: boolean }`
- `lock`: `{ timeout: number }` (seconds)
- `unlock`: `{ timeout: number }` (seconds)

**Response:**
```json
{
  "message": "shutdown command sent successfully to agent",
  "command": {
    "id": "cmd-ABC12345",
    "type": "shutdown",
    "parameters": { "delay": 0 },
    "priority": 1,
    "status": "pending",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "scheduledFor": "2024-01-15T13:00:00.000Z"
  }
}
```

### **2. Get My Commands**
```http
GET /api/command/my-commands?status=pending&page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status`: `pending` | `executing` | `completed` | `failed` | `cancelled`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

---

## 🚨 **Lockdown System**

### **1. Initiate Lockdown**
```http
POST /api/lockdown/agent/:agentId/lockdown
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "adminContactInfo": {
    "name": "John Administrator",
    "phone": "+1-555-0123",
    "email": "admin@company.com",
    "message": "Your system has been locked down for security reasons. Please contact IT immediately."
  },
  "reason": "Security incident detected - unauthorized access attempt"
}
```

**Response:**
```json
{
  "message": "Lockdown initiated successfully",
  "lockdown": {
    "agentId": "agent_001",
    "isLockedDown": true,
    "lockdownInitiatedAt": "2024-01-15T12:00:00.000Z",
    "reason": "Security incident detected",
    "adminContactInfo": {
      "name": "John Administrator",
      "phone": "+1-555-0123",
      "email": "admin@company.com",
      "message": "Your system has been locked down..."
    }
  }
}
```

### **2. Release Lockdown**
```http
POST /api/lockdown/agent/:agentId/unlockdown
Authorization: Bearer <jwt-token>
```

### **3. Get Lockdown Status**
```http
GET /api/lockdown/agent/:agentId/lockdown-status
Authorization: Bearer <jwt-token>
```

### **4. Get My Locked Agents**
```http
GET /api/lockdown/my-locked-agents
Authorization: Bearer <jwt-token>
```

---

## 🔧 **Frontend Implementation Guide**

### **1. Authentication Setup**

```typescript
// API client with authentication
class VAgentAPI {
  private baseURL = 'http://localhost:4000/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('vagent_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('vagent_token');
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('vagent_token');
      this.token = null;
      throw new Error('Authentication required');
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async getMyAgents() {
    return this.request('/agent/my-agents');
  }

  async sendCommand(agentId: string, command: any) {
    return this.request(`/command/agent/${agentId}/command`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }
}
```

### **2. Real-time Updates**

```typescript
// Polling for real-time updates
class AgentMonitor {
  private api: VAgentAPI;
  private agents: Agent[] = [];
  private pollingInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(api: VAgentAPI) {
    this.api = api;
  }

  startPolling() {
    this.intervalId = setInterval(async () => {
      try {
        const response = await this.api.getMyAgents();
        this.updateAgents(response.agents);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.pollingInterval);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateAgents(newAgents: Agent[]) {
    // Compare and update UI
    this.agents = newAgents;
    this.notifyUIUpdate();
  }

  private notifyUIUpdate() {
    // Emit event or call callback to update UI
    window.dispatchEvent(new CustomEvent('agents-updated', {
      detail: { agents: this.agents }
    }));
  }
}
```

### **3. Command Management**

```typescript
// Command management with status tracking
class CommandManager {
  private api: VAgentAPI;
  private commands: Command[] = [];

  constructor(api: VAgentAPI) {
    this.api = api;
  }

  async sendCommand(agentId: string, type: string, parameters: any = {}) {
    try {
      const response = await this.api.sendCommand(agentId, {
        type,
        parameters,
        priority: 1,
        timeout: 300000
      });

      // Add to local tracking
      this.commands.push(response.command);
      this.notifyCommandSent(response.command);

      return response;
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  }

  async getCommandHistory(status?: string, page: number = 1) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());

    return this.api.request(`/command/my-commands?${params}`);
  }

  private notifyCommandSent(command: Command) {
    window.dispatchEvent(new CustomEvent('command-sent', {
      detail: { command }
    }));
  }
}
```

### **4. Lockdown Management**

```typescript
// Lockdown system management
class LockdownManager {
  private api: VAgentAPI;

  constructor(api: VAgentAPI) {
    this.api = api;
  }

  async initiateLockdown(agentId: string, contactInfo: any, reason: string) {
    try {
      const response = await this.api.request(`/lockdown/agent/${agentId}/lockdown`, {
        method: 'POST',
        body: JSON.stringify({
          adminContactInfo: contactInfo,
          reason
        }),
      });

      this.notifyLockdownInitiated(response.lockdown);
      return response;
    } catch (error) {
      console.error('Failed to initiate lockdown:', error);
      throw error;
    }
  }

  async releaseLockdown(agentId: string) {
    try {
      const response = await this.api.request(`/lockdown/agent/${agentId}/unlockdown`, {
        method: 'POST',
      });

      this.notifyLockdownReleased(agentId);
      return response;
    } catch (error) {
      console.error('Failed to release lockdown:', error);
      throw error;
    }
  }

  async getLockdownStatus(agentId: string) {
    return this.api.request(`/lockdown/agent/${agentId}/lockdown-status`);
  }

  private notifyLockdownInitiated(lockdown: LockdownState) {
    window.dispatchEvent(new CustomEvent('lockdown-initiated', {
      detail: { lockdown }
    }));
  }

  private notifyLockdownReleased(agentId: string) {
    window.dispatchEvent(new CustomEvent('lockdown-released', {
      detail: { agentId }
    }));
  }
}
```

---

## 🎨 **UI/UX Recommendations**

### **Dashboard Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo, Admin Name, Logout                           │
├─────────────────────────────────────────────────────────────┤
│ Sidebar: Navigation Menu                                   │
├─────────────────────────────────────────────────────────────┤
│ Main Content Area                                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Agent Overview  │ │ Recent Commands │ │ System Status   │ │
│ │ (Cards)         │ │ (Table)         │ │ (Charts)        │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Agent Management Table                                  │ │
│ │ (Search, Filter, Actions)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Key Features to Implement**

1. **Real-time Agent Status**
   - Color-coded status indicators (online/offline)
   - Last seen timestamps
   - System information display

2. **Command Interface**
   - Quick action buttons (shutdown, restart, lock)
   - Command history with status tracking
   - Scheduled command functionality

3. **Lockdown System**
   - Emergency lockdown button (prominent, red)
   - Contact information form
   - Lockdown status monitoring

4. **Activation Code Management**
   - Generate codes with expiration settings
   - Code usage tracking
   - QR code generation for easy agent registration

5. **Responsive Design**
   - Mobile-friendly interface
   - Touch-friendly controls
   - Progressive Web App capabilities

---

## 🔒 **Security Considerations**

### **Frontend Security**
1. **Token Storage**: Use secure storage (httpOnly cookies preferred)
2. **Input Validation**: Validate all user inputs before sending to API
3. **XSS Prevention**: Sanitize all dynamic content
4. **CSRF Protection**: Implement CSRF tokens for state-changing operations

### **API Security**
1. **HTTPS**: Always use HTTPS in production
2. **Rate Limiting**: Implement rate limiting on sensitive endpoints
3. **Input Sanitization**: All inputs are validated on the backend
4. **JWT Security**: Tokens expire after 24 hours

---

## 🚀 **Deployment Checklist**

### **Environment Setup**
- [ ] Set up production database (MongoDB Atlas recommended)
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure CORS for your frontend domain

### **Frontend Deployment**
- [ ] Build production bundle
- [ ] Configure API base URL for production
- [ ] Set up CDN for static assets
- [ ] Configure error monitoring (Sentry, etc.)

### **Monitoring**
- [ ] Set up application monitoring
- [ ] Configure error logging
- [ ] Set up uptime monitoring
- [ ] Configure backup strategies

---

## 📞 **Support & Integration**

### **Testing**
- Use the provided Postman collections for API testing
- Test all authentication flows
- Verify command execution workflows
- Test lockdown functionality

### **Integration Points**
- **Agent Registration**: Agents use activation codes to register
- **Command Polling**: Agents poll every 30 seconds for commands
- **Status Reporting**: Agents report status periodically
- **Lockdown Response**: Agents respond to lockdown commands

### **Error Handling**
- Implement proper error handling for all API calls
- Show user-friendly error messages
- Implement retry logic for failed requests
- Handle network connectivity issues

---

## 📚 **Additional Resources**

- **Postman Collections**: `postman-collection.json` and `postman-lockdown-collection.json`
- **API Documentation**: Detailed endpoint documentation in the collections
- **Testing Guides**: `POSTMAN_SETUP.md` and `POSTMAN_LOCKDOWN_TESTING.md`
- **Command System**: `REMOTE_COMMANDS.md` for command execution details

---

**🎯 Ready to build an amazing V-Agent frontend!** 

This system provides a solid foundation for remote computer management with enterprise-grade security features. The API is well-documented, tested, and ready for production use. 