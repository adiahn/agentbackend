# Frontend Role Differentiation Guide

**Super Admin vs Normal Admin UI/UX Implementation**

---

## 🔐 **Authentication Response Structure**

When a user logs in, the backend returns user data including role information:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@company.com",
      "username": "adminuser",
      "role": "admin", // or "super_admin"
      "isActive": true,
      "verified": true,
      "companyName": "Company Name", // only for regular admins
      "businessRegNumber": "REG123456", // only for regular admins
      "nin": "12345678901", // only for regular admins
      "phone": "+2341234567890", // only for regular admins
      "lastLogin": "2024-12-19T10:30:00.000Z",
      "createdAt": "2024-12-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🎯 **Role-Based Feature Access**

### **Super Admin Features** ✅
- **System Analytics**: View all system metrics across all companies
- **Admin Management**: Approve/reject admin accounts
- **Access Request Management**: Handle KYC approvals
- **System Overview**: View all agents, codes, lockdowns globally
- **Platform Health Monitoring**: System-wide alerts and performance

### **Normal Admin Features** ✅
- **Company Analytics**: View metrics for their own company only
- **Agent Management**: Manage their own agents
- **Activation Codes**: Generate and manage codes for their company
- **Commands**: Send commands to their agents
- **Lockdown Management**: Control their agents' lockdown status

### **Restricted Features** ❌
- **Super Admin**: Cannot generate activation codes or manage individual agents
- **Normal Admin**: Cannot access system-wide data or approve other admins

---

## 🧭 **Navigation Structure**

### **Super Admin Navigation**
```
Dashboard
├── System Overview
│   ├── Global Analytics
│   ├── System Performance
│   └── Platform Health
├── Admin Management
│   ├── All Admins
│   ├── Pending Admins
│   └── Admin Verification
├── Access Requests
│   ├── All Requests
│   ├── Pending Requests
│   └── Request Statistics
├── System Monitoring
│   ├── All Agents
│   ├── All Activation Codes
│   └── All Lockdowns
└── Settings
    ├── System Configuration
    └── Security Settings
```

### **Normal Admin Navigation**
```
Dashboard
├── Company Overview
│   ├── Company Analytics
│   ├── Agent Performance
│   └── Recent Activity
├── Agent Management
│   ├── My Agents
│   ├── Add Agent
│   └── Agent Details
├── Activation Codes
│   ├── Generate Codes
│   ├── My Codes
│   └── Code History
├── Commands
│   ├── Send Commands
│   ├── Command History
│   └── Pending Commands
├── Lockdown
│   ├── Lockdown Status
│   ├── Lockdown History
│   └── Emergency Lockdown
└── Settings
    ├── Company Profile
    ├── Security Settings
    └── Notifications
```

---

## 🎨 **UI/UX Differentiation**

### **1. Visual Indicators**

#### **Super Admin Badge**
```jsx
// Super Admin Badge Component
const SuperAdminBadge = () => (
  <div className="super-admin-badge">
    <span className="badge-icon">👑</span>
    <span className="badge-text">Super Admin</span>
  </div>
);

// CSS
.super-admin-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

#### **Role-Based Header**
```jsx
const Header = ({ user }) => (
  <header className="app-header">
    <div className="user-info">
      <span className="user-name">{user.username}</span>
      {user.role === 'super_admin' ? (
        <SuperAdminBadge />
      ) : (
        <span className="company-name">{user.companyName}</span>
      )}
    </div>
  </header>
);
```

### **2. Color Coding**

```css
/* Super Admin Theme */
.super-admin {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #4facfe;
  --warning-color: #43e97b;
  --danger-color: #fa709a;
}

/* Normal Admin Theme */
.normal-admin {
  --primary-color: #4facfe;
  --secondary-color: #00f2fe;
  --accent-color: #43e97b;
  --success-color: #fa709a;
  --warning-color: #f093fb;
  --danger-color: #667eea;
}
```

### **3. Icon Differentiation**

```jsx
// Different icons for different roles
const getRoleIcon = (role) => {
  switch (role) {
    case 'super_admin':
      return '👑'; // Crown for super admin
    case 'admin':
      return '🏢'; // Building for company admin
    default:
      return '👤'; // Default user icon
  }
};
```

---

## 🔒 **Route Protection**

### **React Router Protection**
```jsx
// Route Protection Component
const ProtectedRoute = ({ children, requiredRole, user }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage
<Route 
  path="/admin-management" 
  element={
    <ProtectedRoute requiredRole="super_admin" user={user}>
      <AdminManagement />
    </ProtectedRoute>
  } 
/>
```

### **Feature-Level Protection**
```jsx
// Feature Access Hook
const useFeatureAccess = (feature) => {
  const { user } = useAuth();
  
  const featureAccess = {
    'system-analytics': user?.role === 'super_admin',
    'admin-management': user?.role === 'super_admin',
    'access-requests': user?.role === 'super_admin',
    'agent-management': user?.role === 'admin',
    'activation-codes': user?.role === 'admin',
    'commands': user?.role === 'admin',
    'lockdown': user?.role === 'admin'
  };

  return featureAccess[feature] || false;
};

// Usage
const MyComponent = () => {
  const canAccessAnalytics = useFeatureAccess('system-analytics');
  
  if (!canAccessAnalytics) {
    return <UnauthorizedMessage />;
  }
  
  return <AnalyticsDashboard />;
};
```

---

## 📊 **Dashboard Differentiation**

### **Super Admin Dashboard**
```jsx
const SuperAdminDashboard = () => (
  <div className="dashboard super-admin-dashboard">
    <h1>System Overview</h1>
    
    {/* System-wide metrics */}
    <div className="metrics-grid">
      <MetricCard 
        title="Total Companies" 
        value={totalCompanies} 
        icon="🏢" 
      />
      <MetricCard 
        title="Total Agents" 
        value={totalAgents} 
        icon="🤖" 
      />
      <MetricCard 
        title="Pending Requests" 
        value={pendingRequests} 
        icon="⏳" 
      />
      <MetricCard 
        title="System Health" 
        value={systemHealth} 
        icon="💚" 
      />
    </div>
    
    {/* Quick actions */}
    <div className="quick-actions">
      <Button onClick={() => navigate('/admin-management')}>
        Manage Admins
      </Button>
      <Button onClick={() => navigate('/access-requests')}>
        Review Requests
      </Button>
      <Button onClick={() => navigate('/system-analytics')}>
        View Analytics
      </Button>
    </div>
  </div>
);
```

### **Normal Admin Dashboard**
```jsx
const NormalAdminDashboard = () => (
  <div className="dashboard normal-admin-dashboard">
    <h1>{user.companyName} Dashboard</h1>
    
    {/* Company-specific metrics */}
    <div className="metrics-grid">
      <MetricCard 
        title="My Agents" 
        value={myAgents} 
        icon="🤖" 
      />
      <MetricCard 
        title="Active Codes" 
        value={activeCodes} 
        icon="🔑" 
      />
      <MetricCard 
        title="Commands Sent" 
        value={commandsSent} 
        icon="📡" 
      />
      <MetricCard 
        title="System Status" 
        value={systemStatus} 
        icon="✅" 
      />
    </div>
    
    {/* Quick actions */}
    <div className="quick-actions">
      <Button onClick={() => navigate('/agent-management')}>
        Manage Agents
      </Button>
      <Button onClick={() => navigate('/activation-codes')}>
        Generate Codes
      </Button>
      <Button onClick={() => navigate('/commands')}>
        Send Commands
      </Button>
    </div>
  </div>
);
```

---

## 🚫 **Unauthorized Access Handling**

### **Unauthorized Page**
```jsx
const UnauthorizedPage = () => (
  <div className="unauthorized-page">
    <div className="unauthorized-content">
      <h1>🚫 Access Denied</h1>
      <p>You don't have permission to access this feature.</p>
      <p>Contact your system administrator if you believe this is an error.</p>
      <Button onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  </div>
);
```

### **Feature-Level Unauthorized**
```jsx
const UnauthorizedFeature = ({ requiredRole, currentRole }) => (
  <div className="unauthorized-feature">
    <div className="feature-lock">
      <span className="lock-icon">🔒</span>
      <h3>Feature Restricted</h3>
      <p>This feature requires {requiredRole} access.</p>
      <p>Your current role: {currentRole}</p>
    </div>
  </div>
);
```

---

## 📱 **Responsive Design Considerations**

### **Mobile Navigation**
```jsx
const MobileNavigation = ({ user }) => (
  <nav className="mobile-nav">
    {user.role === 'super_admin' ? (
      // Super Admin Mobile Menu
      <div className="mobile-menu">
        <MenuItem icon="📊" label="System Overview" path="/overview" />
        <MenuItem icon="👥" label="Admin Management" path="/admin-management" />
        <MenuItem icon="📋" label="Access Requests" path="/access-requests" />
        <MenuItem icon="🔍" label="System Monitoring" path="/monitoring" />
      </div>
    ) : (
      // Normal Admin Mobile Menu
      <div className="mobile-menu">
        <MenuItem icon="🏢" label="Company Overview" path="/overview" />
        <MenuItem icon="🤖" label="My Agents" path="/agents" />
        <MenuItem icon="🔑" label="Activation Codes" path="/codes" />
        <MenuItem icon="📡" label="Commands" path="/commands" />
      </div>
    )}
  </nav>
);
```

---

## 🎯 **Implementation Checklist**

### **Frontend Setup**
- [ ] **Store user role** in authentication context/state
- [ ] **Create role-based components** for different features
- [ ] **Implement route protection** with role checking
- [ ] **Design different navigation** structures
- [ ] **Add visual indicators** for role differentiation
- [ ] **Handle unauthorized access** gracefully
- [ ] **Test all role combinations** thoroughly

### **UI/UX Considerations**
- [ ] **Clear visual hierarchy** between roles
- [ ] **Consistent color coding** for each role
- [ ] **Intuitive navigation** for each role type
- [ ] **Responsive design** for all screen sizes
- [ ] **Accessibility compliance** for all users
- [ ] **Loading states** for role-based content
- [ ] **Error handling** for role-related issues

### **Security Considerations**
- [ ] **Client-side validation** (in addition to server-side)
- [ ] **Route protection** at component level
- [ ] **Feature-level access control**
- [ ] **Graceful degradation** for unauthorized features
- [ ] **Clear user feedback** for access restrictions

---

## 🔧 **Code Examples**

### **Context Provider**
```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.data.admin);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isSuperAdmin, 
      isAdmin, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Role-Based Component**
```jsx
const Dashboard = () => {
  const { user, isSuperAdmin } = useAuth();

  if (!user) return <LoadingSpinner />;

  return (
    <div className={`dashboard ${isSuperAdmin ? 'super-admin' : 'normal-admin'}`}>
      {isSuperAdmin ? <SuperAdminDashboard /> : <NormalAdminDashboard />}
    </div>
  );
};
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Ready for Implementation ✅ 