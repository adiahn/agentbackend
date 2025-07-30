# Frontend API Configuration Fix

## 🚨 **Issue Identified**

After deploying to Vercel, the frontend is getting these errors:
- "Failed to load analytics"
- "The route /analytics/agent-activity?period=7d&granularity=daily does not exist"

## 🔍 **Root Cause**

The frontend is calling the wrong API endpoints. Based on the error, it's trying to call:
```
/analytics/agent-activity
```

But the backend expects:
```
/api/analytics/agent-activity
```

## 🔧 **Frontend Fix Required**

### **1. Update API Base URL**

In your frontend, update the API configuration:

**Before:**
```javascript
// In your API config file (e.g., api.ts, config.ts, or similar)
const API_BASE_URL = 'http://localhost:5173'; // or similar
```

**After:**
```javascript
// Update to your Vercel URL
const API_BASE_URL = 'https://your-vercel-app.vercel.app/api';
```

### **2. Update API Endpoints**

Make sure all your API calls include the `/api` prefix:

**Before:**
```javascript
// ❌ Wrong
fetch('/analytics/agent-activity')
fetch('/admin/login')
fetch('/auth/request-access')
```

**After:**
```javascript
// ✅ Correct
fetch('/api/analytics/agent-activity')
fetch('/api/admin/login')
fetch('/api/auth/request-access')
```

### **3. Environment Configuration**

Create environment variables in your frontend:

```javascript
// .env.local or similar
VITE_API_BASE_URL=https://your-vercel-app.vercel.app/api
```

Then use it in your API config:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
```

## 📋 **Complete API Endpoint List**

Here are the correct endpoints your frontend should use:

### **Authentication**
```
POST /api/admin/login
POST /api/auth/request-access
GET /api/auth/verify-email/:token
GET /api/auth/request-status/:email
```

### **Analytics (Regular Admin)**
```
GET /api/analytics/overview
GET /api/analytics/agent-activity?period=7d&granularity=daily
GET /api/analytics/performance?period=24h&granularity=hourly
GET /api/analytics/geographic
GET /api/analytics/commands?period=7d
GET /api/analytics/top-agents?metric=uptime&limit=5
GET /api/analytics/activation-codes?period=30d
GET /api/analytics/alerts?severity=high&limit=10
```

### **Analytics (Super Admin)**
```
GET /api/analytics/super/overview
GET /api/analytics/super/agent-activity?period=7d&granularity=daily
GET /api/analytics/super/performance?period=24h&granularity=hourly
GET /api/analytics/super/geographic
GET /api/analytics/super/commands?period=7d
GET /api/analytics/super/top-agents?metric=uptime&limit=5
GET /api/analytics/super/activation-codes?period=30d
GET /api/analytics/super/alerts?severity=high&limit=10
```

### **Admin Management**
```
GET /api/admin/users
GET /api/admin/all
GET /api/admin/pending
POST /api/admin/verify/:adminId
POST /api/admin/reject/:adminId
```

### **Access Requests**
```
GET /api/admin/access-requests
GET /api/admin/access-requests/stats
GET /api/admin/access-requests/:id
PUT /api/admin/access-requests/:id/approve
PUT /api/admin/access-requests/:id/reject
```

## 🧪 **Testing Your Fix**

### **1. Test Health Endpoint**
```bash
curl https://your-vercel-app.vercel.app/api/health
```

### **2. Test Analytics Endpoint**
```bash
curl https://your-vercel-app.vercel.app/api/analytics/overview
```

### **3. Use the Test Script**
Update the test script with your Vercel URL:
```bash
# Edit test/test-analytics-endpoints.js
# Change BASE_URL to your actual Vercel URL
# Then run:
node test/test-analytics-endpoints.js
```

## 🎯 **Quick Fix Steps**

1. **Find your Vercel URL** (from Vercel dashboard)
2. **Update frontend API base URL** to include `/api`
3. **Test the health endpoint** to verify connection
4. **Update all API calls** to include `/api` prefix
5. **Redeploy frontend** with the fixes

## 🔍 **Debugging Tips**

### **Check Network Tab**
1. Open browser DevTools
2. Go to Network tab
3. Try to load analytics
4. Look for failed requests
5. Check the exact URL being called

### **Check Console Errors**
Look for:
- 404 errors (wrong URL)
- CORS errors (wrong domain)
- Authentication errors (missing token)

### **Test Backend Directly**
```bash
# Test if backend is working
curl https://your-vercel-app.vercel.app/api/health

# Test analytics endpoint
curl https://your-vercel-app.vercel.app/api/analytics/overview
```

## ✅ **Success Indicators**

After fixing:
- ✅ Analytics dashboard loads without errors
- ✅ No "route does not exist" errors
- ✅ Data appears in charts and tables
- ✅ Network tab shows successful API calls

---

**Last Updated**: December 2024  
**Status**: Ready for Implementation ✅ 