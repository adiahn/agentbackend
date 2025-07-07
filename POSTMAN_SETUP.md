# V-Agent Server - Postman Setup Guide

This guide will help you set up and test all the V-Agent server API endpoints using Postman.

## 📋 Prerequisites

1. **Postman installed** on your computer
2. **V-Agent server running** on `http://localhost:4000`
3. **MongoDB** running (local or Atlas)

## 🚀 Quick Setup

### Step 1: Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `postman-collection.json` file from the server folder
4. The collection will be imported with all endpoints pre-configured

### Step 2: Configure Environment Variables

The collection uses these variables automatically:
- `baseUrl`: `http://localhost:4000`
- `jwtToken`: Will be set automatically after login
- `adminId`: Will be set automatically after login
- `activationCodeId`: Will be set automatically when generating codes
- `agentId`: Will be set automatically when registering agents

## 🔧 Step-by-Step Testing

### Phase 1: Server Setup & Health Check

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Test Health Check:**
   - Run the "Health Check" request
   - Should return server status and version info

### Phase 2: Admin Authentication

1. **Create Super Admin (Optional):**
   - Run "Create Super Admin" request
   - Only works if no super admin exists
   - Default credentials: `admin@v-agent.com` / `admin123456`

2. **Admin Login:**
   - Run "Admin Login" request
   - This automatically saves the JWT token
   - Check the console for confirmation

3. **Test Authentication:**
   - Run "Get Admin Profile" request
   - Should return admin details if token is valid

### Phase 3: Activation Code Management

1. **Generate Activation Codes:**
   - Run "Generate Activation Codes" request
   - This saves the first code ID automatically
   - You can generate 1-10 codes at once

2. **View Your Codes:**
   - Run "Get My Activation Codes" request
   - Use query parameters for filtering:
     - `status=active` (unused, not expired)
     - `status=used` (already used)
     - `status=expired` (expired codes)

3. **Get Specific Code Details:**
   - Run "Get Specific Activation Code" request
   - Uses the saved `activationCodeId`

### Phase 4: Agent Registration & Management

1. **Register Agent with Code:**
   - Run "Use Activation Code (Agent Registration)" request
   - **Important:** Replace `"code": "ABC12345"` with an actual code from step 3
   - This automatically saves the `agentId`

2. **Report Agent Status:**
   - Run "Report Agent Status" request
   - Uses the saved `agentId`
   - Can be called repeatedly to update status

3. **View Your Agents:**
   - Run "Get My Agents" request
   - Shows all agents belonging to the authenticated admin

4. **Get Specific Agent:**
   - Run "Get Specific Agent" request
   - Uses the saved `agentId`

## 📝 Request Examples

### Admin Login
```json
POST {{baseUrl}}/api/admin/login
Content-Type: application/json

{
  "email": "admin@v-agent.com",
  "password": "admin123456"
}
```

### Generate Activation Codes
```json
POST {{baseUrl}}/api/activation/generate
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "count": 3,
  "expiresInDays": 30
}
```

### Use Activation Code
```json
POST {{baseUrl}}/api/activation/use
Content-Type: application/json

{
  "code": "ABC12345",
  "agentId": "agent_001",
  "systemInfo": {
    "os": "Windows 10",
    "version": "10.0.19044",
    "architecture": "x64",
    "hostname": "DESKTOP-ABC123",
    "cpu": "Intel Core i7-8700K",
    "memory": "16GB",
    "disk": "1TB SSD"
  },
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "country": "USA",
    "timezone": "America/New_York"
  }
}
```

### Report Agent Status
```json
POST {{baseUrl}}/api/agent/report
Content-Type: application/json

{
  "agentId": "agent_001",
  "systemInfo": {
    "os": "Windows 10",
    "version": "10.0.19044",
    "architecture": "x64",
    "hostname": "DESKTOP-ABC123",
    "cpu": "Intel Core i7-8700K",
    "memory": "16GB",
    "disk": "1TB SSD",
    "uptime": 86400,
    "load": 0.5
  },
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "country": "USA",
    "timezone": "America/New_York",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🔐 Authentication Headers

For protected endpoints, the collection automatically includes:
```
Authorization: Bearer {{jwtToken}}
```

## 📊 Expected Responses

### Successful Login
```json
{
  "message": "Login successful",
  "admin": {
    "_id": "...",
    "username": "superadmin",
    "email": "admin@v-agent.com",
    "role": "super_admin",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Generated Activation Codes
```json
{
  "message": "3 activation code(s) generated successfully",
  "codes": [
    {
      "id": "...",
      "code": "ABC12345",
      "expiresAt": "2024-02-14T10:30:00.000Z",
      "isUsed": false
    }
  ]
}
```

### Agent Registration
```json
{
  "message": "Agent registered successfully",
  "agent": {
    "agentId": "agent_001",
    "adminId": "...",
    "lastSeen": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🚨 Common Issues & Solutions

### 1. "Cannot find module 'express'" Error
- Make sure you're running the server from the `server` folder
- Run `npm install` in the server directory

### 2. "MongoDB connection error"
- Ensure MongoDB is running
- Check your `.env` file for correct `MONGO_URI`
- The server will continue with in-memory storage as fallback

### 3. "Invalid token" Error
- Run the "Admin Login" request again
- Check if the token is properly saved in collection variables

### 4. "Activation code not found" Error
- Make sure you're using a valid activation code
- Check if the code has expired or been used
- Generate new codes if needed

### 5. "Agent not found" Error
- Register the agent first using an activation code
- Make sure the `agentId` matches exactly

## 🔄 Testing Workflow

1. **Start server** → Health check
2. **Login as admin** → Get JWT token
3. **Generate codes** → Get activation codes
4. **Register agent** → Use activation code
5. **Report status** → Send agent data
6. **View agents** → Check admin dashboard

## 📱 Testing Different Scenarios

### Test Multiple Agents
1. Generate multiple activation codes
2. Register different agents with different codes
3. Report status for each agent
4. View all agents in admin dashboard

### Test Code Expiration
1. Generate codes with short expiration (1 day)
2. Wait for expiration
3. Try to use expired codes (should fail)
4. Generate new codes

### Test Admin Permissions
1. Create regular admin account
2. Login as regular admin
3. Try to access super admin endpoints (should fail)
4. Verify admin can only see their own agents

## 🎯 Tips for Testing

1. **Use the Console:** Check Postman console for automatic variable updates
2. **Save Responses:** Use Postman's "Save Response" feature for debugging
3. **Environment Variables:** The collection automatically manages variables
4. **Error Handling:** All endpoints return detailed error messages
5. **Validation:** Test with invalid data to verify validation works

## 📞 Support

If you encounter issues:
1. Check the server console for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check the `.env` file configuration
5. Review the server logs for detailed error information 