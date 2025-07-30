# Super Admin Users Endpoint Documentation

**Endpoint**: `GET /api/admin/users`  
**Role**: Super Admin Only  
**Authentication**: JWT Token Required

---

## 🎯 **Overview**

This endpoint allows Super Admins to view all users in the system, including both verified admins and access requests. It provides comprehensive filtering, search, and pagination capabilities.

---

## 📋 **Request Details**

### **URL**
```
GET https://agentbackend-mde1.onrender.com/api/admin/users
```

### **Headers**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `all` | Filter by user type: `all`, `admins`, `access_requests` |
| `status` | string | No | `all` | Filter by status: `all`, `pending`, `approved`, `rejected`, `verified`, `unverified` |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `20` | Number of users per page (max: 100) |
| `search` | string | No | - | Search by email, company name, or username |

---

## 🔍 **Query Parameter Examples**

### **Get All Users**
```
GET /api/admin/users
```

### **Get Only Admins**
```
GET /api/admin/users?type=admins
```

### **Get Only Access Requests**
```
GET /api/admin/users?type=access_requests
```

### **Get Pending Users**
```
GET /api/admin/users?status=pending
```

### **Get Verified Admins**
```
GET /api/admin/users?type=admins&status=verified
```

### **Search for Specific User**
```
GET /api/admin/users?search=company@email.com
```

### **Paginated Results**
```
GET /api/admin/users?page=2&limit=10
```

### **Combined Filters**
```
GET /api/admin/users?type=admins&status=verified&search=tech&page=1&limit=15
```

---

## 📊 **Response Format**

### **Success Response (200)**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "email": "admin@company.com",
        "username": "adminuser",
        "role": "admin",
        "isActive": true,
        "verified": true,
        "rejected": false,
        "companyName": "Tech Solutions Ltd",
        "businessRegNumber": "REG123456",
        "nin": "12345678901",
        "phone": "+2341234567890",
        "lastLogin": "2024-12-19T10:30:00.000Z",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "userType": "admin",
        "displayName": "Tech Solutions Ltd",
        "status": "verified"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "email": "newcompany@example.com",
        "companyName": "New Company Inc",
        "businessRegNumber": "REG789012",
        "nin": "98765432109",
        "phone": "+2349876543210",
        "status": "pending",
        "createdAt": "2024-12-18T15:45:00.000Z",
        "userType": "access_request",
        "displayName": "New Company Inc",
        "status": "pending"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 95,
      "totalAdmins": 45,
      "totalAccessRequests": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "type": "all",
      "status": "all",
      "search": null
    }
  }
}
```

### **Error Response (401)**
```json
{
  "success": false,
  "error": "Access token required"
}
```

### **Error Response (403)**
```json
{
  "success": false,
  "error": "Super admin access required"
}
```

### **Error Response (500)**
```json
{
  "success": false,
  "error": "Failed to fetch users",
  "details": "Database connection error"
}
```

---

## 🏷️ **User Object Structure**

### **Admin User Object**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "username": "string",
  "role": "admin" | "super_admin",
  "isActive": "boolean",
  "verified": "boolean",
  "rejected": "boolean",
  "companyName": "string",
  "businessRegNumber": "string",
  "nin": "string",
  "phone": "string",
  "lastLogin": "Date",
  "createdAt": "Date",
  "userType": "admin",
  "displayName": "string",
  "status": "verified" | "pending" | "rejected"
}
```

### **Access Request User Object**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "companyName": "string",
  "businessRegNumber": "string",
  "nin": "string",
  "phone": "string",
  "status": "pending" | "approved" | "rejected",
  "rejectionReason": "string",
  "approvedBy": "ObjectId",
  "approvedAt": "Date",
  "emailVerified": "boolean",
  "createdAt": "Date",
  "userType": "access_request",
  "displayName": "string",
  "status": "pending" | "approved" | "rejected"
}
```

---

## 🔍 **Filtering Logic**

### **Type Filter**
- `all`: Returns both admins and access requests
- `admins`: Returns only admin users
- `access_requests`: Returns only access request users

### **Status Filter**
- `all`: Returns all users regardless of status
- `pending`: Returns unverified admins and pending access requests
- `approved`: Returns approved access requests
- `rejected`: Returns rejected admins and rejected access requests
- `verified`: Returns verified admins only
- `unverified`: Returns unverified admins only

### **Search Filter**
Searches across:
- Email address
- Company name
- Username (for admins only)

Search is case-insensitive and uses partial matching.

---

## 📄 **Pagination Details**

### **Pagination Object**
```json
{
  "currentPage": 1,
  "totalPages": 5,
  "totalUsers": 95,
  "totalAdmins": 45,
  "totalAccessRequests": 50,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### **Pagination Rules**
- Default page size: 20 users
- Maximum page size: 100 users
- Pages start from 1
- Results are sorted by creation date (newest first)

---

## 🚀 **Usage Examples**

### **cURL Examples**

#### **Get All Users**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Pending Access Requests**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/users?type=access_requests&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Search for Company**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/users?search=tech" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Verified Admins with Pagination**
```bash
curl -X GET "https://agentbackend-mde1.onrender.com/api/admin/users?type=admins&status=verified&page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **JavaScript Examples**

#### **Fetch All Users**
```javascript
const response = await fetch('https://agentbackend-mde1.onrender.com/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Users:', data.data.users);
```

#### **Search and Filter**
```javascript
const searchUsers = async (searchTerm, type = 'all', status = 'all') => {
  const params = new URLSearchParams({
    search: searchTerm,
    type: type,
    status: status,
    page: 1,
    limit: 20
  });

  const response = await fetch(`https://agentbackend-mde1.onrender.com/api/admin/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};
```

---

## 🎯 **Frontend Integration**

### **React Hook Example**
```javascript
const useUsers = (filters = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const { token } = useAuth();

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        ...params
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  return { users, loading, pagination, fetchUsers };
};
```

### **User List Component**
```jsx
const UserList = () => {
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  const { users, loading, pagination, fetchUsers } = useUsers(filters);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page) => {
    fetchUsers({ page });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-list">
      <UserFilters filters={filters} onChange={handleFilterChange} />
      <UserTable users={users} />
      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  );
};
```

---

## 🔒 **Security Considerations**

1. **Authentication Required**: All requests must include valid JWT token
2. **Super Admin Only**: Endpoint restricted to users with `role: 'super_admin'`
3. **Data Sanitization**: Sensitive data (passwords, tokens) excluded from response
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **Audit Logging**: All user list access should be logged

---

## 📊 **Performance Notes**

1. **Pagination**: Always use pagination for large datasets
2. **Indexing**: Ensure database indexes on frequently searched fields
3. **Caching**: Consider caching for frequently accessed data
4. **Query Optimization**: Complex filters may impact performance

---

## 🎯 **Common Use Cases**

1. **User Management Dashboard**: View all users in the system
2. **Access Request Review**: Filter and review pending access requests
3. **Admin Verification**: Check admin verification status
4. **System Analytics**: Get user statistics and demographics
5. **Search and Filter**: Find specific users by various criteria

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 