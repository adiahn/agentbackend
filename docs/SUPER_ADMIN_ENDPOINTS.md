# Super Admin Endpoints Documentation

**Role**: Super Admin  
**Authentication**: JWT Token Required  
**Base URL**: `https://agentbackend-mde1.onrender.com/api`

---

## 🔐 **Authentication**

All Super Admin endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📊 **Analytics Endpoints** (`/api/analytics/super`)

### 1. **Dashboard Overview Stats**
```
GET /api/analytics/super/overview
```
**Description**: Get comprehensive system overview statistics  
**Response**: System-wide metrics, total agents, admins, requests, etc.

### 2. **Agent Activity Trends**
```
GET /api/analytics/super/agent-activity?period=7d&granularity=daily
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `7d`)
- `granularity` (optional): `hourly`, `daily` (default: `daily`)

### 3. **System Performance Metrics**
```
GET /api/analytics/super/performance?period=24h&granularity=hourly
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `24h`)
- `granularity` (optional): `hourly`, `daily` (default: `hourly`)

### 4. **Geographic Distribution**
```
GET /api/analytics/super/geographic
```
**Description**: Get agent distribution by geographic location

### 5. **Command Analytics**
```
GET /api/analytics/super/commands?period=7d
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `7d`)

### 6. **Top Agents Performance**
```
GET /api/analytics/super/top-agents?metric=uptime&limit=10
```
**Query Parameters**:
- `metric` (optional): `uptime`, `cpu`, `memory`, `disk`, `commands` (default: `uptime`)
- `limit` (optional): `1-50` (default: `10`)

### 7. **Activation Code Analytics**
```
GET /api/analytics/super/activation-codes?period=30d
```
**Query Parameters**:
- `period` (optional): `7d`, `30d`, `90d` (default: `30d`)

### 8. **Alerts & Notifications**
```
GET /api/analytics/super/alerts?severity=high&limit=20
```
**Query Parameters**:
- `severity` (optional): `low`, `medium`, `high`, `critical` (default: `all`)
- `limit` (optional): `1-100` (default: `20`)

---

## 👥 **Admin Management** (`/api/admin`)

### 9. **Get All Admins**
```
GET /api/admin/all
```
**Description**: List all admin accounts in the system  
**Response**: Array of admin objects with details

### 9.5. **Get All Users**
```
GET /api/admin/users
```
**Description**: Get all users (admins + access requests) with filtering and search  
**Query Parameters**:
- `type` (optional): `all`, `admins`, `access_requests`
- `status` (optional): `all`, `pending`, `approved`, `rejected`, `verified`, `unverified`
- `page` (optional): Page number for pagination
- `limit` (optional): Number of users per page (max: 100)
- `search` (optional): Search by email, company name, or username
**Response**: Combined user list with pagination and filtering options

### 10. **Get Pending Admins**
```
GET /api/admin/pending
```
**Description**: List all pending admin verification requests  
**Response**: Array of pending admin objects

### 11. **Verify Admin**
```
POST /api/admin/verify/:adminId
```
**Description**: Approve a pending admin account  
**Parameters**: `adminId` - MongoDB ObjectId of the admin

### 12. **Reject Admin**
```
POST /api/admin/reject/:adminId
```
**Description**: Reject a pending admin account  
**Parameters**: `adminId` - MongoDB ObjectId of the admin

---

## 🔐 **Access Request Management** (`/api/admin`)

### 13. **Get All Access Requests**
```
GET /api/admin/access-requests
```
**Description**: List all access requests (pending, approved, rejected)  
**Response**: Array of access request objects

### 14. **Get Access Request Statistics**
```
GET /api/admin/access-requests/stats
```
**Description**: Get access request statistics  
**Response**: Counts of total, pending, approved, rejected requests

### 15. **Get Specific Access Request**
```
GET /api/admin/access-requests/:id
```
**Description**: Get details of a specific access request  
**Parameters**: `id` - MongoDB ObjectId of the access request

### 16. **Approve Access Request**
```
PUT /api/admin/access-requests/:id/approve
```
**Description**: Approve an access request and create admin account  
**Parameters**: `id` - MongoDB ObjectId of the access request

### 17. **Reject Access Request**
```
PUT /api/admin/access-requests/:id/reject
```
**Description**: Reject an access request with reason  
**Parameters**: `id` - MongoDB ObjectId of the access request  
**Request Body**:
```json
{
  "reason": "Incomplete business registration document"
}
```

---

## 🔑 **Activation Code Management** (`/api/activation`)

### 18. **Get All Activation Codes**
```
GET /api/activation/all
```
**Description**: View all activation codes across all admins  
**Response**: Array of activation code objects

---

## 🤖 **Agent Management** (`/api/agent`)

### 19. **Get All Agents**
```
GET /api/agent/agents
```
**Description**: View all agents across all companies  
**Response**: Array of agent objects with admin details

---

## 🔒 **Lockdown Management** (`/api/lockdown`)

### 20. **Get All Lockdowns**
```
GET /api/lockdown/all
```
**Description**: View all lockdown events across the system  
**Response**: Array of lockdown event objects

---

## 📡 **Command Management** (`/api/command`)

*Note: Command endpoints are available to Super Admin but typically used by regular admins for their own agents*

---

## 🚀 **Usage Examples**

### **Example 1: Get System Overview**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/analytics/super/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Example 2: Approve Access Request**
```bash
curl -X PUT "https://agentbackend-mde1.onrender.com/api/admin/access-requests/64f8a1b2c3d4e5f6a7b8c9d0/approve" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **Example 3: Get Access Request Statistics**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/access-requests/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Example 4: Get Top Performing Agents**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/analytics/super/top-agents?metric=uptime&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 **Response Formats**

### **Success Response Template**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### **Error Response Template**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 🔐 **Security Notes**

1. **Authentication Required**: All endpoints require valid JWT token
2. **Super Admin Only**: These endpoints are restricted to users with `role: 'super_admin'`
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Audit Logging**: All Super Admin actions should be logged for security

---

## 📊 **Key Responsibilities**

### **Super Admin Can:**
- ✅ **Monitor System**: View all analytics and system metrics
- ✅ **Manage KYC**: Approve/reject access requests
- ✅ **Admin Management**: Verify/reject admin accounts
- ✅ **System Overview**: View all agents, codes, lockdowns across companies
- ✅ **Platform Health**: Monitor system performance and alerts

### **Super Admin Cannot:**
- ❌ **Generate Codes**: Cannot create activation codes (regular admin function)
- ❌ **Manage Agents**: Cannot directly manage individual agents
- ❌ **Operational Tasks**: Cannot perform day-to-day operational tasks

---

## 🎯 **Quick Reference**

| Category | Endpoint Count | Primary Function |
|----------|---------------|------------------|
| **Analytics** | 8 | System monitoring and metrics |
| **Admin Management** | 5 | Admin account verification + user management |
| **Access Requests** | 5 | KYC approval workflow |
| **System Overview** | 3 | Cross-company data access |

**Total Super Admin Endpoints**: 21

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 