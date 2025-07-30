# Super Admin Complete API Reference

**Role**: Super Admin Only  
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
**Request Body**: None  
**Response**: System-wide metrics, total agents, admins, requests, etc.

### 2. **Agent Activity Trends**
```
GET /api/analytics/super/agent-activity?period=7d&granularity=daily
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `7d`)
- `granularity` (optional): `hourly`, `daily` (default: `daily`)
**Request Body**: None

### 3. **System Performance Metrics**
```
GET /api/analytics/super/performance?period=24h&granularity=hourly
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `24h`)
- `granularity` (optional): `hourly`, `daily` (default: `hourly`)
**Request Body**: None

### 4. **Geographic Distribution**
```
GET /api/analytics/super/geographic
```
**Description**: Get agent distribution by geographic location  
**Request Body**: None

### 5. **Command Analytics**
```
GET /api/analytics/super/commands?period=7d
```
**Query Parameters**:
- `period` (optional): `24h`, `7d`, `30d` (default: `7d`)
**Request Body**: None

### 6. **Top Agents Performance**
```
GET /api/analytics/super/top-agents?metric=uptime&limit=10
```
**Query Parameters**:
- `metric` (optional): `uptime`, `cpu`, `memory`, `disk`, `commands` (default: `uptime`)
- `limit` (optional): `1-50` (default: `10`)
**Request Body**: None

### 7. **Activation Code Analytics**
```
GET /api/analytics/super/activation-codes?period=30d
```
**Query Parameters**:
- `period` (optional): `7d`, `30d`, `90d` (default: `30d`)
**Request Body**: None

### 8. **Alerts & Notifications**
```
GET /api/analytics/super/alerts?severity=high&limit=20
```
**Query Parameters**:
- `severity` (optional): `low`, `medium`, `high`, `critical` (default: `all`)
- `limit` (optional): `1-100` (default: `20`)
**Request Body**: None

---

## 👥 **Admin Management** (`/api/admin`)

### 9. **Get All Admins**
```
GET /api/admin/all
```
**Description**: List all admin accounts in the system  
**Request Body**: None  
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
**Request Body**: None

### 10. **Get Pending Admins**
```
GET /api/admin/pending
```
**Description**: List all pending admin verification requests  
**Request Body**: None

### 11. **Verify Admin**
```
POST /api/admin/verify/:adminId
```
**Description**: Approve a pending admin account  
**Parameters**: `adminId` - MongoDB ObjectId of the admin  
**Request Body**: None

### 12. **Reject Admin**
```
POST /api/admin/reject/:adminId
```
**Description**: Reject a pending admin account  
**Parameters**: `adminId` - MongoDB ObjectId of the admin  
**Request Body**: None

### 13. **Register New Admin**
```
POST /api/admin/register
```
**Description**: Create a new admin account (Super Admin only)  
**Request Body**:
```json
{
  "username": "newadmin",
  "email": "newadmin@company.com",
  "password": "securepassword123",
  "role": "admin"
}
```
**Validation Rules**:
- `username`: Required, 3-30 characters, unique
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters
- `role`: Optional, defaults to "admin" (only "admin" allowed, not "super_admin")

---

## 🔐 **Access Request Management** (`/api/admin`)

### 14. **Get All Access Requests**
```
GET /api/admin/access-requests
```
**Description**: List all access requests (pending, approved, rejected)  
**Query Parameters**:
- `status` (optional): `pending`, `approved`, `rejected`
- `page` (optional): Page number for pagination
- `limit` (optional): Number of requests per page (default: 10)
**Request Body**: None

### 15. **Get Access Request Statistics**
```
GET /api/admin/access-requests/stats
```
**Description**: Get access request statistics  
**Request Body**: None

### 16. **Get Specific Access Request**
```
GET /api/admin/access-requests/:id
```
**Description**: Get details of a specific access request  
**Parameters**: `id` - MongoDB ObjectId of the access request  
**Request Body**: None

### 17. **Approve Access Request**
```
PUT /api/admin/access-requests/:id/approve
```
**Description**: Approve an access request and create admin account  
**Parameters**: `id` - MongoDB ObjectId of the access request  
**Request Body**: None

### 18. **Reject Access Request**
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
**Validation Rules**:
- `reason`: Required, non-empty string

---

## 🔑 **Activation Code Management** (`/api/activation`)

### 19. **Get All Activation Codes**
```
GET /api/activation/all
```
**Description**: View all activation codes across all admins  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of codes per page (default: 10)
**Request Body**: None

---

## 🤖 **Agent Management** (`/api/agent`)

### 20. **Get All Agents**
```
GET /api/agent/agents
```
**Description**: View all agents across all companies  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of agents per page (default: 10)
- `status` (optional): `active`, `inactive`, `all`
**Request Body**: None

---

## 🔒 **Lockdown Management** (`/api/lockdown`)

### 21. **Get All Lockdowns**
```
GET /api/lockdown/all
```
**Description**: View all lockdown events across the system  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of lockdowns per page (default: 10)
- `status` (optional): `active`, `inactive`, `all`
**Request Body**: None

---

## 📡 **Command Management** (`/api/command`)

*Note: Command endpoints are available to Super Admin but typically used by regular admins for their own agents*

### 22. **Get All Commands**
```
GET /api/command/all
```
**Description**: View all commands across all agents  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of commands per page (default: 10)
- `status` (optional): `pending`, `executed`, `failed`, `all`
**Request Body**: None

---

## 🚀 **Complete Request Examples**

### **1. Login (Get Token)**
```bash
curl -X POST "https://agentbackend-mde1.onrender.com/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@systemmonitor.com",
    "password": "admin123456"
  }'
```

### **2. Get All Users with Filtering**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/users?type=admins&status=verified&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Approve Access Request**
```bash
curl -X PUT "https://agentbackend-mde1.onrender.com/api/admin/access-requests/64f8a1b2c3d4e5f6a7b8c9d0/approve" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **4. Reject Access Request**
```bash
curl -X PUT "https://agentbackend-mde1.onrender.com/api/admin/access-requests/64f8a1b2c3d4e5f6a7b8c9d0/reject" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Incomplete business registration document"
  }'
```

### **5. Register New Admin**
```bash
curl -X POST "https://agentbackend-mde1.onrender.com/api/admin/register" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "email": "newadmin@company.com",
    "password": "securepassword123",
    "role": "admin"
  }'
```

### **6. Get System Analytics**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/analytics/super/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **7. Get Top Performing Agents**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/analytics/super/top-agents?metric=uptime&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 **Response Format Standards**

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

### **Pagination Response Template**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 🔍 **Query Parameter Reference**

### **Common Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number for pagination | 1 |
| `limit` | number | Number of items per page | 10-20 (varies by endpoint) |
| `status` | string | Filter by status | `all` |
| `search` | string | Search term | - |

### **Analytics Query Parameters**
| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| `period` | string | `24h`, `7d`, `30d` | `7d` |
| `granularity` | string | `hourly`, `daily` | `daily` |
| `metric` | string | `uptime`, `cpu`, `memory`, `disk`, `commands` | `uptime` |
| `severity` | string | `low`, `medium`, `high`, `critical` | `all` |

---

## 🎯 **Endpoint Categories Summary**

| Category | Endpoint Count | Primary Function | Methods |
|----------|---------------|------------------|---------|
| **Analytics** | 8 | System monitoring and metrics | GET |
| **Admin Management** | 5 | Admin account verification + user management | GET, POST |
| **Access Requests** | 5 | KYC approval workflow | GET, PUT |
| **System Overview** | 4 | Cross-company data access | GET |
| **User Management** | 1 | Combined user view with filtering | GET |

**Total Super Admin Endpoints**: 23

---

## 🔒 **Security Notes**

1. **Authentication Required**: All endpoints require valid JWT token
2. **Super Admin Only**: These endpoints are restricted to users with `role: 'super_admin'`
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Audit Logging**: All Super Admin actions should be logged for security
5. **Input Validation**: All request bodies are validated server-side

---

## 📊 **Performance Considerations**

1. **Pagination**: Always use pagination for large datasets
2. **Filtering**: Use query parameters to reduce data transfer
3. **Caching**: Consider caching for frequently accessed analytics data
4. **Database Indexing**: Ensure proper indexes on frequently queried fields

---

## 🎯 **Common Use Cases**

1. **System Monitoring**: Use analytics endpoints to monitor platform health
2. **User Management**: Use user endpoints to manage all system users
3. **Access Control**: Use access request endpoints to approve/reject new companies
4. **Admin Oversight**: Use admin management endpoints to verify admin accounts
5. **System Overview**: Use overview endpoints to get cross-company insights

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 