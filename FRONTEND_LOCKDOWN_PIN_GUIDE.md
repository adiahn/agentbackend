# 🔐 Enhanced Lockdown System with PIN Control - Frontend Integration

## 📋 **System Overview**

The enhanced lockdown system now includes **4-digit PIN control** that allows admins to set a specific PIN that will be required to unlock the system during lockdown. Only the admin-set PIN will work to unlock the computer.

## 🔧 **New Features**

- **Admin-set PIN**: 4-digit PIN required for unlocking
- **PIN Verification**: Real-time PIN validation
- **Secure Unlocking**: Only the correct PIN can unlock the system
- **PIN Management**: Admins can set/change PIN during lockdown

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

## 🎨 **Frontend Implementation**

### **1. Enhanced Lockdown Service**

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
  unlockPin?: string; // New field
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
    hasPin: boolean; // New field
  };
  command: {
    id: string;
    type: string;
    priority: number;
    status: string;
    createdAt: string;
  };
}

interface PinVerificationResponse {
  isValid: boolean;
  message: string;
}

class LockdownService {
  private baseURL: string;
  private token: string;

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
  async getLockdownStatus(agentId: string): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/api/lockdown/agent/${agentId}/status`,
      { headers: this.getHeaders() }
    );
    return response.data;
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

### **2. Enhanced Lockdown Control Component**

```typescript
// components/LockdownControl.tsx
import React, { useState, useEffect } from 'react';
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
  
  // PIN-related state
  const [showPinInput, setShowPinInput] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Load current lockdown status
  useEffect(() => {
    loadLockdownStatus();
  }, [agentId]);

  const loadLockdownStatus = async () => {
    try {
      const status = await lockdownService.getLockdownStatus(agentId);
      setIsLockedDown(status.isLockedDown);
      setLockdownInfo(status.lockdownInfo);
    } catch (err) {
      console.error('Error loading lockdown status:', err);
    }
  };

  const handleInitiateLockdown = async () => {
    if (!isAdmin) {
      setError('Only administrators can initiate lockdown');
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
        unlockPin: pin || undefined // Only include if PIN was provided
      };

      const response = await lockdownService.initiateLockdown(agentId, request);
      
      setIsLockedDown(true);
      setLockdownInfo(response.lockdown);
      
      const pinMessage = response.lockdown.hasPin ? ' with PIN protection' : '';
      alert(`Lockdown initiated successfully on ${agentName}${pinMessage}`);
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
      
      setIsLockedDown(false);
      setLockdownInfo(null);
      
      alert(`Lockdown released successfully on ${agentName}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to release lockdown');
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
      
      setIsLockedDown(false);
      setLockdownInfo(null);
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
      
      <div className="status-section">
        <h4>Current Status</h4>
        <div className={`status-indicator ${isLockedDown ? 'locked' : 'unlocked'}`}>
          {isLockedDown ? '🚨 LOCKED DOWN' : '✅ UNLOCKED'}
        </div>
        
        {lockdownInfo && (
          <div className="lockdown-details">
            <p><strong>Reason:</strong> {lockdownInfo.reason}</p>
            <p><strong>Initiated:</strong> {new Date(lockdownInfo.initiatedAt).toLocaleString()}</p>
            <p><strong>Contact:</strong> {lockdownInfo.adminContactInfo.name} - {lockdownInfo.adminContactInfo.phone}</p>
            {lockdownInfo.hasPin && (
              <p><strong>🔐 PIN Protection:</strong> Enabled</p>
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
              <button
                onClick={handleReleaseLockdown}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Releasing...' : '🔓 Admin Release'}
              </button>
            )}
            
            <button
              onClick={() => setShowPinInput(!showPinInput)}
              disabled={loading}
              className="btn btn-warning"
            >
              🔐 Unlock with PIN
            </button>
          </div>
        )}

        <button
          onClick={loadLockdownStatus}
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
            <li>Lockdown with PIN protection requires the exact PIN to unlock</li>
            <li>Only the admin-set PIN will work during lockdown</li>
            <li>PIN is cleared when lockdown is released</li>
            <li>Use only for critical security incidents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LockdownControl;
```

### **3. PIN Input Component**

```typescript
// components/PinInput.tsx
import React, { useState, useRef, useEffect } from 'react';

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
  onCancel: () => void;
  title?: string;
  loading?: boolean;
}

const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  onComplete,
  onCancel,
  title = "Enter PIN",
  loading = false
}) => {
  const [pin, setPin] = useState<string[]>(new Array(length).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[currentIndex]) {
      inputRefs.current[currentIndex]?.focus();
    }
  }, [currentIndex]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Move to next input if value entered
    if (value && index < length - 1) {
      setCurrentIndex(index + 1);
    }

    // Check if PIN is complete
    if (newPin.every(digit => digit !== '') && index === length - 1) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '') {
        // Move to previous input if current is empty
        if (index > 0) {
          setCurrentIndex(index - 1);
          const newPin = [...pin];
          newPin[index - 1] = '';
          setPin(newPin);
        }
      } else {
        // Clear current input
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    if (pastedData.length === length) {
      const newPin = pastedData.split('').slice(0, length);
      setPin(newPin);
      onComplete(newPin.join(''));
    }
  };

  return (
    <div className="pin-input-modal">
      <div className="pin-input-container">
        <h3>{title}</h3>
        
        <div className="pin-inputs">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => setCurrentIndex(index)}
              className={`pin-digit ${currentIndex === index ? 'focused' : ''}`}
              disabled={loading}
            />
          ))}
        </div>

        <div className="pin-actions">
          <button
            onClick={() => onComplete(pin.join(''))}
            disabled={loading || pin.some(digit => digit === '')}
            className="btn btn-primary"
          >
            {loading ? 'Verifying...' : 'Submit'}
          </button>
          
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>

        <div className="pin-instructions">
          <p>Enter the 4-digit PIN to unlock the system</p>
          <p>Only the admin-set PIN will work during lockdown</p>
        </div>
      </div>
    </div>
  );
};

export default PinInput;
```

### **4. Enhanced CSS Styles**

```css
/* styles/enhanced-lockdown.css */
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
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  margin: 10px 0;
}

.status-indicator.locked {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.status-indicator.unlocked {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.lockdown-details {
  background: #fff;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #007bff;
  margin: 10px 0;
}

.actions-section {
  margin: 20px 0;
}

.unlock-options {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #212529;
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pin-section {
  background: #fff;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.pin-input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pin-input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 2px;
  width: 200px;
  margin: 0 auto;
}

.pin-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.pin-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.pin-input-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pin-input-container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.pin-inputs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.pin-digit {
  width: 50px;
  height: 50px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 20px;
  text-align: center;
  font-weight: bold;
}

.pin-digit.focused {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.pin-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.pin-instructions {
  color: #666;
  font-size: 14px;
  margin-top: 15px;
}

.pin-instructions p {
  margin: 5px 0;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  border: 1px solid #f5c6cb;
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
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-warning ul {
  margin: 10px 0;
  padding-left: 20px;
}

.alert-warning li {
  margin: 5px 0;
}
```

## 🚀 **Integration Steps**

### **1. Update Your App**
```typescript
// App.tsx or main component
import LockdownControl from './components/LockdownControl';
import PinInput from './components/PinInput';

// In your component
<LockdownControl
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

- [ ] **Initiate lockdown with PIN** on a test agent
- [ ] **Verify PIN validation** works correctly
- [ ] **Test PIN unlocking** with correct PIN
- [ ] **Test PIN unlocking** with incorrect PIN
- [ ] **Verify admin release** still works
- [ ] **Check PIN clearing** when lockdown is released
- [ ] **Test PIN input component** functionality

## 🔒 **Security Notes**

1. **PIN Storage**: PINs are stored securely in the database
2. **PIN Validation**: Server-side validation ensures 4-digit format
3. **PIN Clearing**: PINs are automatically cleared when lockdown is released
4. **Access Control**: Only admins can set PINs, but anyone can attempt to unlock
5. **Audit Trail**: All PIN attempts are logged for security monitoring

The enhanced lockdown system with PIN control is now ready for frontend integration! 🎉 