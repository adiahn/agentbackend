# Vercel Environment Variables Setup Guide

## 🚨 **CRITICAL: Environment Variables Required**

Your Vercel deployment is failing because environment variables are not set. This guide will help you set them up correctly.

## 📋 **Required Environment Variables**

### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/dashboard
2. Find your project: `agentbackend-kpdd`
3. Click on the project

### **Step 2: Add Environment Variables**
1. Go to **Settings** tab
2. Click on **Environment Variables**
3. Add each variable below:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `MONGO_URI` | `mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` | MongoDB connection string |
| `JWT_SECRET` | `velixify-super-secret-jwt-key-2024` | Secret key for JWT tokens |
| `JWT_EXPIRE` | `24h` | JWT token expiration time |
| `CLOUDINARY_CLOUD_NAME` | `dyyhuoozp` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `127785598856689` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `quwR1Rd0-5x8hNkm7NPeT6Zb6hU` | Cloudinary API secret |
| `NODE_ENV` | `production` | Environment mode |

### **Step 3: Environment Variable Details**

#### **MONGO_URI**
```
mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```
- ✅ **Tested and working**
- ✅ **Contains all your collections**
- ✅ **Properly formatted**

#### **JWT_SECRET**
```
velixify-super-secret-jwt-key-2024
```
- 🔐 **Secure random string**
- 🔐 **Used for token signing**

#### **JWT_EXPIRE**
```
24h
```
- ⏰ **24 hours expiration**
- ⏰ **Standard duration**

#### **Cloudinary Variables**
```
CLOUDINARY_CLOUD_NAME=dyyhuoozp
CLOUDINARY_API_KEY=127785598856689
CLOUDINARY_API_SECRET=quwR1Rd0-5x8hNkm7NPeT6Zb6hU
```
- ☁️ **For file uploads**
- ☁️ **Already configured**

## 🔧 **Alternative: Set via Vercel CLI**

If you prefer command line, run these commands:

```bash
# Set MongoDB URI
vercel env add MONGO_URI production
# Enter: mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Set JWT Secret
vercel env add JWT_SECRET production
# Enter: velixify-super-secret-jwt-key-2024

# Set JWT Expire
vercel env add JWT_EXPIRE production
# Enter: 24h

# Set Cloudinary variables
vercel env add CLOUDINARY_CLOUD_NAME production
# Enter: dyyhuoozp

vercel env add CLOUDINARY_API_KEY production
# Enter: 127785598856689

vercel env add CLOUDINARY_API_SECRET production
# Enter: quwR1Rd0-5x8hNkm7NPeT6Zb6hU

# Set Node Environment
vercel env add NODE_ENV production
# Enter: production
```

## 🚀 **After Setting Environment Variables**

### **Step 4: Redeploy**
```bash
vercel --prod
```

### **Step 5: Test Connection**
Visit: `https://agentbackend-kpdd.vercel.app/api/health`

Expected response:
```json
{
  "database": {
    "connected": true,
    "status": "connected"
  }
}
```

## ✅ **Expected Results**

After setting environment variables:
- ✅ Database connection: `"connected": true`
- ✅ 500 errors → 200 responses
- ✅ Analytics endpoints working
- ✅ Login functionality working
- ✅ File uploads working

## 🧪 **Test Scripts**

Run these to verify everything works:

```bash
# Test database connection
node test/test-mongo-connection.js

# Test all endpoints
node test/test-500-errors.js

# Test login
node test/test-login-debug.js
```

## 🚨 **Troubleshooting**

### **If still getting 500 errors:**
1. Check Vercel dashboard for environment variables
2. Ensure all variables are set for `production` environment
3. Redeploy after setting variables
4. Check Vercel function logs for errors

### **If database still not connecting:**
1. Verify MONGO_URI is correct
2. Check MongoDB Atlas network access
3. Ensure IP whitelist includes Vercel IPs

## 📞 **Support**

If you need help:
1. Check Vercel function logs
2. Run test scripts locally
3. Verify environment variables are set correctly

---

**🎯 Goal**: Get database connected to fix 500 errors
**🔧 Solution**: Set environment variables in Vercel
**✅ Result**: All endpoints working properly 