# Vercel Deployment Troubleshooting Guide

## 🚨 **Common Vercel Deployment Errors**

### **1. Function Size Too Large**
**Error**: `Function size is too large`
**Solution**: 
- Use `.vercelignore` to exclude unnecessary files
- Remove large dependencies
- Optimize imports

### **2. Entry Point Issues**
**Error**: `Cannot find module` or `Entry point not found`
**Solution**: 
- Ensure `vercel.json` points to correct entry point
- Check `package.json` main field
- Verify file paths are correct

### **3. Environment Variables**
**Error**: `Environment variable not found`
**Solution**: 
- Set all required environment variables in Vercel dashboard
- Check `.env` file is not being deployed

### **4. Build Failures**
**Error**: `Build failed`
**Solution**: 
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Review build logs for specific errors

---

## 🔧 **Current Configuration**

### **vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

### **package.json**
```json
{
  "main": "api/index.js",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🚀 **Deployment Steps**

### **1. Install Vercel CLI**
```bash
npm install -g vercel
```

### **2. Login to Vercel**
```bash
vercel login
```

### **3. Deploy**
```bash
vercel --prod
```

### **4. Set Environment Variables**
In Vercel dashboard, set these environment variables:
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NODE_ENV=production`

---

## 🔍 **Troubleshooting Steps**

### **Step 1: Check Function Size**
```bash
# Check what files are being included
vercel --debug
```

### **Step 2: Verify Entry Point**
```bash
# Test locally
node api/index.js
```

### **Step 3: Check Dependencies**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Step 4: Test Build Locally**
```bash
# Test the build process
npm run build
```

---

## 📋 **Required Environment Variables**

Make sure these are set in your Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRE` | JWT expiration time | `24h` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |
| `NODE_ENV` | Environment | `production` |

---

## 🎯 **Optimization Tips**

### **1. Reduce Function Size**
- Use `.vercelignore` to exclude unnecessary files
- Remove unused dependencies
- Optimize imports

### **2. Improve Performance**
- Use connection pooling for MongoDB
- Implement caching where possible
- Optimize database queries

### **3. Error Handling**
- Add proper error handling
- Use try-catch blocks
- Log errors appropriately

---

## 🔧 **Alternative Solutions**

### **If Vercel Still Fails**

1. **Use Render.com** (Alternative platform)
2. **Use Railway.app** (Another alternative)
3. **Use Heroku** (Traditional hosting)

### **Render.com Deployment**
```bash
# Create render.yaml
services:
  - type: web
    name: systemmonitor-backend
    env: node
    buildCommand: npm install
    startCommand: node api/index.js
```

---

## 📞 **Getting Help**

### **1. Check Vercel Logs**
```bash
vercel logs
```

### **2. Debug Mode**
```bash
vercel --debug
```

### **3. Vercel Support**
- Check Vercel documentation
- Contact Vercel support
- Check GitHub issues

---

## ✅ **Success Checklist**

- [ ] Environment variables set in Vercel
- [ ] Entry point correctly configured
- [ ] All dependencies in package.json
- [ ] .vercelignore excludes unnecessary files
- [ ] Build passes locally
- [ ] Function size under limits
- [ ] Database connection works
- [ ] API endpoints respond correctly

---

**Last Updated**: December 2024  
**Status**: Ready for Deployment ✅ 