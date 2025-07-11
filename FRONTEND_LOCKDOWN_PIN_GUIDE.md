# 🔐 Enhanced Lockdown System with PIN Control - Frontend Integration

## 📋 **System Overview**

The enhanced lockdown system now includes **4-digit PIN control** that allows admins to set a specific PIN that will be required to unlock the system during lockdown. Only the admin-set PIN will work to unlock the computer.

## 🔧 **New Features**

- **Admin-set PIN**: 4-digit PIN required for unlocking
- **PIN Verification**: Real-time PIN validation
- **Secure Unlocking**: Only the correct PIN can unlock the system
- **PIN Management**: Admins can set/change PIN during lockdown
- **Real-time Status Monitoring**: Automatic UI updates when lockdown state changes
- **Smart Button Management**: Lockdown button automatically disabled when system is locked

## 🌐 **Updated API Endpoints**

### **Base URL**: `http://localhost:4000/api`

---

## 🔐 **1. Initiate Lockdown with PIN**

### **Endpoint**
```http
POST /api/lockdown/agent/:agentId/lockdown
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### **Request Body**
```json
{
  "adminContactInfo": {
    "name": "John Administrator",
    "phone": "+1-555-0123",
    "email": "admin@company.com",
    "message": "Your system has been locked down for security reasons. Please contact IT immediately."
  },
  "reason": "Security incident detected - unauthorized access attempt",
  "priority": 10,
  "unlockPin": "1234"
}
```

### **Response**
```json
{
  "message": "Lockdown command sent successfully to agent",
  "lockdown": {
    "id": "lockdown_id_here",
    "agentId": "agent_001",
    "isLockedDown": true,
    "initiatedAt": "2024-01-01T12:00:00.000Z",
    "reason": "Security incident detected - unauthorized access attempt",
    "adminContactInfo": {
      "name": "John Administrator",
      "phone": "+1-555-0123",
      "email": "admin@company.com",
      "message": "Your system has been locked down for security reasons. Please contact IT immediately."
    },
    "hasPin": true
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

---

## 🔍 **2. Verify PIN (Public Endpoint)**

### **Endpoint**
```http
POST /api/lockdown/agent/:agentId/verify-pin
Content-Type: application/json
```

### **Request Body**
```json
{
  "pin": "1234"
}
```

### **Response**
```json
{
  "isValid": true,
  "message": "PIN is valid"
}
```

---

## 🔓 **3. Unlock with PIN (Public Endpoint)**

### **Endpoint**
```http
POST /api/lockdown/agent/:agentId/unlock-pin
Content-Type: application/json
```

### **Request Body**
```json
{
  "pin": "1234"
}
```

### **Response**
```json
{
  "message": "System unlocked successfully",
  "command": {
    "id": "cmd-DEF67890",
    "type": "unlock",
    "status": "pending",
    "createdAt": "2024-01-01T12:30:00.000Z"
  }
}
```

---

## 📡 **4. Get Lockdown Status (Real-time Monitoring)**

### **Endpoint**
```http
GET /api/lockdown/agent/:agentId/status
Authorization: Bearer <jwt-token>
```

### **Response**
```json
{
  "isLockedDown": true,
  "agentId": "agent_001",
  "lockdownInfo": {
    "initiatedAt": "2024-01-01T12:00:00.000Z",
    "reason": "Security incident detected",
    "adminContactInfo": {
      "name": "John Administrator",
      "phone": "+1-555-0123",
      "email": "admin@company.com",
      "message": "Contact IT immediately"
    },
    "lastHeartbeat": "2024-01-01T12:30:00.000Z",
    "securityChecks": {
      "registryTampered": false,
      "processKilled": false,
      "networkDisconnected": false,
      "lastCheckTime": "2024-01-01T12:30:00.000Z"
    },
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "isPersistent": true
  },
  "systemInfo": {
    "hostname": "DESKTOP-ABC123",
    "platform": "win32",
    "version": "10.0.19044",
    "lastBootTime": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 🎨 **Frontend Implementation**

### **1. Enhanced Lockdown Service with Real-time Monitoring**

```typescript
// services/LockdownService.ts
import axios from 'axios';

interface AdminContactInfo {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface LockdownRequest {
  adminContactInfo: AdminContactInfo;
  reason: string;
  priority?: number;
  unlockPin?: string;
}

interface LockdownResponse {
  message: string;
  lockdown: {
    id: string;
    agentId: string;
    isLockedDown: boolean;
    initiatedAt: string;
    reason: string;
    adminContactInfo: AdminContactInfo;
    hasPin: boolean;
  };
  command: {
    id: string;
    type: string;
    priority: number;
    status: string;
    createdAt: string;
  };
}

interface LockdownStatus {
  isLockedDown: boolean;
  agentId: string;
  lockdownInfo?: {
    initiatedAt: string;
    reason: string;
    adminContactInfo: AdminContactInfo;
    lastHeartbeat: string;
    securityChecks: any;
    expiresAt?: string;
    isPersistent: boolean;
  };
  systemInfo?: any;
}

interface PinVerificationResponse {
  isValid: boolean;
  message: string;
}

class LockdownService {
  private baseURL: string;
  private token: string;
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: LockdownStatus) => void)[] = [];

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Initiate lockdown with PIN
  async initiateLockdown(agentId: string, request: LockdownRequest): Promise<LockdownResponse> {
    const response = await axios.post(
      `${this.baseURL}/api/lockdown/agent/${agentId}/lockdown`,
      request,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Verify PIN (public endpoint)
  async verifyPin(agentId: string, pin: string): Promise<PinVerificationResponse> {
    const response = await axios.post(
      `${this.baseURL}/api/lockdown/agent/${agentId}/verify-pin`,
      { pin },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  // Unlock with PIN (public endpoint)
  async unlockWithPin(agentId: string, pin: string): Promise<any> {
    const response = await axios.post(
      `${this.baseURL}/api/lockdown/agent/${agentId}/unlock-pin`,
      { pin },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  // Release lockdown (admin endpoint)
  async releaseLockdown(agentId: string, reason: string): Promise<any> {
    const response = await axios.post(
      `${this.baseURL}/api/lockdown/agent/${agentId}/release`,
      { reason },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Get lockdown status
  async getLockdownStatus(agentId: string): Promise<LockdownStatus> {
    const response = await axios.get(
      `${this.baseURL}/api/lockdown/agent/${agentId}/status`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Start real-time status monitoring
  startStatusMonitoring(agentId: string, intervalMs: number = 5000) {
    // Clear any existing polling
    this.stopStatusMonitoring();

    // Start polling
    this.statusPollingInterval = setInterval(async () => {
      try {
        const status = await this.getLockdownStatus(agentId);
        this.notifyStatusCallbacks(status);
      } catch (error) {
        console.error('Failed to get lockdown status:', error);
      }
    }, intervalMs);

    // Get initial status immediately
    this.getLockdownStatus(agentId).then(status => {
      this.notifyStatusCallbacks(status);
    }).catch(error => {
      console.error('Failed to get initial lockdown status:', error);
    });
  }

  // Stop real-time status monitoring
  stopStatusMonitoring() {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

  // Subscribe to status updates
  onStatusUpdate(callback: (status: LockdownStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all status callbacks
  private notifyStatusCallbacks(status: LockdownStatus) {
    this.statusCallbacks.forEach(callback => callback(status));
  }

  // Get all lockdowns (super admin only)
  async getAllLockdowns(params: { status?: string; page?: number; limit?: number } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await axios.get(
      `${this.baseURL}/api/lockdown/all?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default LockdownService;
```

### **2. Enhanced Lockdown Control Component with Real-time Monitoring**

```typescript
// components/LockdownControl.tsx
import React, { useState, useEffect, useCallback } from 'react';
import LockdownService from '../services/LockdownService';

interface LockdownControlProps {
  agentId: string;
  agentName: string;
  isAdmin: boolean;
  baseURL: string;
  token: string;
}

const LockdownControl: React.FC<LockdownControlProps> = ({
  agentId,
  agentName,
  isAdmin,
  baseURL,
  token
}) => {
  const [lockdownService] = useState(() => new LockdownService(baseURL, token));
  const [isLockedDown, setIsLockedDown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockdownInfo, setLockdownInfo] = useState<any>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);
  
  // PIN-related state
  const [showPinInput, setShowPinInput] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Status update callback
  const handleStatusUpdate = useCallback((status: any) => {
    console.log('Lockdown status updated:', status);
    setIsLockedDown(status.isLockedDown);
    setLockdownInfo(status.lockdownInfo);
    setLastStatusUpdate(new Date());
    setError(null); // Clear any previous errors
  }, []);

  // Start monitoring on component mount
  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = lockdownService.onStatusUpdate(handleStatusUpdate);
    
    // Start real-time monitoring
    lockdownService.startStatusMonitoring(agentId, 3000); // Check every 3 seconds

    // Cleanup on unmount
    return () => {
      unsubscribe();
      lockdownService.stopStatusMonitoring();
    };
  }, [agentId, lockdownService, handleStatusUpdate]);

  const handleInitiateLockdown = async () => {
    if (!isAdmin) {
      setError('Only administrators can initiate lockdown');
      return;
    }

    if (isLockedDown) {
      setError('System is already in lockdown mode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get PIN from user
      const pin = prompt('Enter 4-digit PIN for unlocking (optional):');
      
      const adminContactInfo = {
        name: "System Administrator",
        phone: "+1-555-0123",
        email: "admin@company.com",
        message: "Your system has been locked down for security reasons. Please contact IT immediately."
      };

      const request = {
        adminContactInfo,
        reason: "Administrative lockdown initiated",
        priority: 10,
        unlockPin: pin || undefined
      };

      await lockdownService.initiateLockdown(agentId, request);
      
      // Status will be updated automatically via polling
      alert(`Lockdown initiated successfully on ${agentName}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate lockdown');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseLockdown = async () => {
    if (!isAdmin) {
      setError('Only administrators can release lockdown');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await lockdownService.releaseLockdown(agentId, "Administrative release");
      
      // Status will be updated automatically via polling
      alert(`Lockdown released successfully on ${agentName}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to release lockdown');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyOverride = async () => {
    if (!isAdmin) {
      setError('Only administrators can perform emergency override');
      return;
    }

    const confirmed = confirm('Are you sure you want to perform emergency override? This will unlock the system immediately.');
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await lockdownService.emergencyOverride(agentId, "Emergency override executed by admin");
      alert(`Emergency override executed successfully on ${agentName}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to execute emergency override');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!unlockPin || unlockPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      const response = await lockdownService.verifyPin(agentId, unlockPin);
      
      if (response.isValid) {
        alert('PIN is valid! You can now unlock the system.');
        setShowPinInput(false);
        setUnlockPin('');
      } else {
        setPinError('Invalid PIN. Please try again.');
      }
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Failed to verify PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleUnlockWithPin = async () => {
    if (!unlockPin || unlockPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      await lockdownService.unlockWithPin(agentId, unlockPin);
      
      // Status will be updated automatically via polling
      setShowPinInput(false);
      setUnlockPin('');
      alert(`System unlocked successfully on ${agentName}`);
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Failed to unlock system');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="lockdown-control">
      <h3>🔐 Enhanced Lockdown Control - {agentName}</h3>
      
      {/* Real-time Status Indicator */}
      <div className="status-section">
        <h4>Current Status</h4>
        <div className={`status-indicator ${isLockedDown ? 'locked' : 'unlocked'}`}>
          {isLockedDown ? '🚨 LOCKED DOWN' : '✅ UNLOCKED'}
        </div>
        
        {lastStatusUpdate && (
          <div className="status-timestamp">
            Last updated: {lastStatusUpdate.toLocaleTimeString()}
          </div>
        )}
        
        {lockdownInfo && (
          <div className="lockdown-details">
            <p><strong>Reason:</strong> {lockdownInfo.reason}</p>
            <p><strong>Initiated:</strong> {new Date(lockdownInfo.initiatedAt).toLocaleString()}</p>
            <p><strong>Contact:</strong> {lockdownInfo.adminContactInfo.name} - {lockdownInfo.adminContactInfo.phone}</p>
            {lockdownInfo.expiresAt && (
              <p><strong>Expires:</strong> {new Date(lockdownInfo.expiresAt).toLocaleString()}</p>
            )}
            {lockdownInfo.isPersistent && (
              <p><strong>🔒 Persistent Lockdown:</strong> Will survive system restarts</p>
            )}
          </div>
        )}
      </div>

      <div className="actions-section">
        <h4>Actions</h4>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!isLockedDown ? (
          <button
            onClick={handleInitiateLockdown}
            disabled={loading || !isAdmin}
            className="btn btn-danger"
          >
            {loading ? 'Initiating...' : '🚨 Initiate Lockdown'}
          </button>
        ) : (
          <div className="unlock-options">
            {isAdmin && (
              <>
                <button
                  onClick={handleReleaseLockdown}
                  disabled={loading}
                  className="btn btn-success"
                >
                  {loading ? 'Releasing...' : '🔓 Admin Release'}
                </button>
                
                <button
                  onClick={handleEmergencyOverride}
                  disabled={loading}
                  className="btn btn-warning"
                >
                  {loading ? 'Overriding...' : '🚨 Emergency Override'}
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowPinInput(!showPinInput)}
              disabled={loading}
              className="btn btn-info"
            >
              🔐 Unlock with PIN
            </button>
          </div>
        )}

        <button
          onClick={() => lockdownService.getLockdownStatus(agentId).then(handleStatusUpdate)}
          disabled={loading}
          className="btn btn-secondary"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* PIN Input Section */}
      {showPinInput && (
        <div className="pin-section">
          <h4>🔐 PIN Unlock</h4>
          
          {pinError && (
            <div className="error-message">
              {pinError}
            </div>
          )}

          <div className="pin-input-group">
            <input
              type="password"
              value={unlockPin}
              onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className="pin-input"
            />
            
            <div className="pin-buttons">
              <button
                onClick={handleVerifyPin}
                disabled={pinLoading || unlockPin.length !== 4}
                className="btn btn-info"
              >
                {pinLoading ? 'Verifying...' : 'Verify PIN'}
              </button>
              
              <button
                onClick={handleUnlockWithPin}
                disabled={pinLoading || unlockPin.length !== 4}
                className="btn btn-success"
              >
                {pinLoading ? 'Unlocking...' : 'Unlock System'}
              </button>
              
              <button
                onClick={() => {
                  setShowPinInput(false);
                  setUnlockPin('');
                  setPinError(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="warning-section">
        <div className="alert alert-warning">
          <strong>⚠️ Enhanced Security:</strong> 
          <ul>
            <li>Real-time status monitoring updates UI automatically</li>
            <li>Lockdown button is disabled when system is locked</li>
            <li>PIN protection requires exact PIN to unlock</li>
            <li>Emergency override bypasses PIN verification</li>
            <li>Use only for critical security incidents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LockdownControl;
```

### **3. Lockdown Status Hook (Custom Hook)**

```typescript
// hooks/useLockdownStatus.ts
import { useState, useEffect, useCallback } from 'react';
import LockdownService from '../services/LockdownService';

interface UseLockdownStatusProps {
  agentId: string;
  baseURL: string;
  token: string;
  pollingInterval?: number;
}

export const useLockdownStatus = ({ 
  agentId, 
  baseURL, 
  token, 
  pollingInterval = 3000 
}: UseLockdownStatusProps) => {
  const [lockdownService] = useState(() => new LockdownService(baseURL, token));
  const [isLockedDown, setIsLockedDown] = useState(false);
  const [lockdownInfo, setLockdownInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleStatusUpdate = useCallback((status: any) => {
    setIsLockedDown(status.isLockedDown);
    setLockdownInfo(status.lockdownInfo);
    setLastUpdate(new Date());
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = lockdownService.onStatusUpdate(handleStatusUpdate);
    
    // Start real-time monitoring
    lockdownService.startStatusMonitoring(agentId, pollingInterval);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      lockdownService.stopStatusMonitoring();
    };
  }, [agentId, lockdownService, handleStatusUpdate, pollingInterval]);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await lockdownService.getLockdownStatus(agentId);
      handleStatusUpdate(status);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh status');
      setLoading(false);
    }
  }, [agentId, lockdownService, handleStatusUpdate]);

  return {
    isLockedDown,
    lockdownInfo,
    loading,
    error,
    lastUpdate,
    refreshStatus
  };
};
```

### **4. Simplified Component Using the Hook**

```typescript
// components/SimpleLockdownControl.tsx
import React, { useState } from 'react';
import { useLockdownStatus } from '../hooks/useLockdownStatus';
import LockdownService from '../services/LockdownService';

interface SimpleLockdownControlProps {
  agentId: string;
  agentName: string;
  isAdmin: boolean;
  baseURL: string;
  token: string;
}

const SimpleLockdownControl: React.FC<SimpleLockdownControlProps> = ({
  agentId,
  agentName,
  isAdmin,
  baseURL,
  token
}) => {
  const { isLockedDown, lockdownInfo, loading, error, refreshStatus } = useLockdownStatus({
    agentId,
    baseURL,
    token,
    pollingInterval: 3000
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const lockdownService = new LockdownService(baseURL, token);

  const handleInitiateLockdown = async () => {
    if (!isAdmin || isLockedDown) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const adminContactInfo = {
        name: "System Administrator",
        phone: "+1-555-0123",
        email: "admin@company.com",
        message: "Your system has been locked down for security reasons."
      };

      await lockdownService.initiateLockdown(agentId, {
        adminContactInfo,
        reason: "Administrative lockdown initiated",
        priority: 10
      });

      alert(`Lockdown initiated successfully on ${agentName}`);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to initiate lockdown');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseLockdown = async () => {
    if (!isAdmin || !isLockedDown) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await lockdownService.releaseLockdown(agentId, "Administrative release");
      alert(`Lockdown released successfully on ${agentName}`);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to release lockdown');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div>Loading lockdown status...</div>;
  }

  return (
    <div className="simple-lockdown-control">
      <h3>🔐 Lockdown Control - {agentName}</h3>
      
      <div className={`status ${isLockedDown ? 'locked' : 'unlocked'}`}>
        {isLockedDown ? '🚨 LOCKED DOWN' : '✅ UNLOCKED'}
      </div>

      {error && <div className="error">{error}</div>}
      {actionError && <div className="error">{actionError}</div>}

      {lockdownInfo && (
        <div className="lockdown-details">
          <p><strong>Reason:</strong> {lockdownInfo.reason}</p>
          <p><strong>Initiated:</strong> {new Date(lockdownInfo.initiatedAt).toLocaleString()}</p>
        </div>
      )}

      <div className="actions">
        {!isLockedDown ? (
          <button
            onClick={handleInitiateLockdown}
            disabled={actionLoading || !isAdmin}
            className="btn btn-danger"
          >
            {actionLoading ? 'Initiating...' : '🚨 Initiate Lockdown'}
          </button>
        ) : (
          <button
            onClick={handleReleaseLockdown}
            disabled={actionLoading || !isAdmin}
            className="btn btn-success"
          >
            {actionLoading ? 'Releasing...' : '🔓 Release Lockdown'}
          </button>
        )}

        <button
          onClick={refreshStatus}
          disabled={actionLoading}
          className="btn btn-secondary"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default SimpleLockdownControl;
```

### **5. CSS Styles for Enhanced UI**

```css
/* styles/LockdownControl.css */
.lockdown-control {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #f9f9f9;
}

.status-section {
  margin-bottom: 20px;
}

.status-indicator {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  font-size: 16px;
  margin: 10px 0;
}

.status-indicator.locked {
  background: #ff4444;
  color: white;
}

.status-indicator.unlocked {
  background: #44ff44;
  color: white;
}

.status-timestamp {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.lockdown-details {
  background: #fff;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
  border-left: 4px solid #ff4444;
}

.actions-section {
  margin-top: 20px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  border: 1px solid #ffcdd2;
}

.unlock-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.pin-section {
  background: #fff;
  padding: 20px;
  border-radius: 5px;
  margin: 20px 0;
  border: 2px solid #2196f3;
}

.pin-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pin-input {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 5px;
  width: 200px;
}

.pin-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-info {
  background: #2196f3;
  color: white;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.warning-section {
  margin-top: 20px;
}

.alert {
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.simple-lockdown-control {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.status {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  margin: 10px 0;
}

.status.locked {
  background: #ff4444;
  color: white;
}

.status.unlocked {
  background: #44ff44;
  color: white;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}
```

## 🚀 **Integration Steps**

### **1. Update Your App**
```typescript
// App.tsx or main component
import LockdownControl from './components/LockdownControl';
import SimpleLockdownControl from './components/SimpleLockdownControl';

// In your component
<LockdownControl
  agentId="agent_001"
  agentName="Office PC 1"
  isAdmin={userRole === 'admin' || userRole === 'super_admin'}
  baseURL="http://localhost:4000"
  token={userToken}
/>

// Or use the simplified version
<SimpleLockdownControl
  agentId="agent_001"
  agentName="Office PC 1"
  isAdmin={userRole === 'admin' || userRole === 'super_admin'}
  baseURL="http://localhost:4000"
  token={userToken}
/>
```

### **2. Environment Configuration**
```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  timeout: 10000
};
```

## 🧪 **Testing Checklist**

- [ ] **Real-time status updates** work correctly
- [ ] **Lockdown button is disabled** when system is locked
- [ ] **Button re-enables** when lockdown is released
- [ ] **Status polling** updates UI automatically
- [ ] **Error handling** works for network issues
- [ ] **PIN functionality** works as expected
- [ ] **Emergency override** bypasses PIN
- [ ] **Admin release** works properly
- [ ] **Component cleanup** stops polling on unmount

## 🔒 **Security Notes**

1. **Real-time Monitoring**: Status is checked every 3 seconds
2. **Automatic UI Updates**: No manual refresh needed
3. **Smart Button Management**: Prevents duplicate lockdown attempts
4. **Error Handling**: Graceful handling of network issues
5. **Cleanup**: Proper cleanup of polling intervals
6. **Audit Trail**: All actions are logged for security monitoring

The enhanced lockdown system with real-time monitoring is now ready for frontend integration! 🎉 