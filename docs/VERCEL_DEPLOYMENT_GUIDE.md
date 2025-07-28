# Vercel Deployment Guide

This guide will walk you through deploying your SystemMonitor Backend API to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas Database** - Set up a cloud database
4. **Cloudinary Account** - For file uploads (optional but recommended)

## Step 1: Prepare Your Code

Your project is already configured for Vercel deployment with:
- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless entry point
- Updated `package.json` with build scripts

## Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Choose "Shared" (free tier)
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Set Up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel deployment)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## Step 3: Set Up Cloudinary (Optional)

1. **Create Cloudinary Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account

2. **Get Credentials**
   - Go to your Dashboard
   - Note your Cloud Name, API Key, and API Secret

## Step 4: Deploy to Vercel

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Node.js configuration

3. **Configure Environment Variables**
   In your Vercel project dashboard:
   - Go to Settings → Environment Variables
   - Add each variable:

   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/systemmonitor?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRE=24h
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   NODE_ENV=production
   ```

4. **Redeploy**
   - After adding environment variables, go to Deployments
   - Click "Redeploy" on your latest deployment

## Step 5: Test Your Deployment

1. **Check Health Endpoint**
   ```
   https://your-project-name.vercel.app/api/health
   ```

2. **Test API Documentation**
   ```
   https://your-project-name.vercel.app/
   ```

3. **Create Super Admin**
   - Use the health endpoint to verify database connection
   - If needed, you can create a super admin by running the script locally with the production database

## Step 6: Update Frontend Configuration

Update your frontend application to use the new Vercel URL:

```javascript
// Replace your local API URL with the Vercel URL
const API_BASE_URL = 'https://your-project-name.vercel.app/api';
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/systemmonitor` |
| `JWT_SECRET` | Secret for JWT tokens | `my-super-secret-key-123456789` |
| `JWT_EXPIRE` | Token expiration time | `24h` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefghijklmnop` |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your `MONGO_URI` format
   - Ensure username/password are correct
   - Verify network access allows connections from anywhere

2. **JWT Authentication Errors**
   - Ensure `JWT_SECRET` is set
   - Check that the secret is consistent across deployments

3. **Vercel Function Timeout**
   - The default timeout is 10 seconds
   - For longer operations, consider using background jobs

4. **Environment Variables Not Working**
   - Ensure variables are added to the correct environment (Production)
   - Redeploy after adding variables
   - Check variable names for typos

### Debugging

1. **Check Vercel Logs**
   - Go to your deployment in Vercel dashboard
   - Click on "Functions" tab
   - Check for error messages

2. **Test Locally with Production Variables**
   ```bash
   # Set environment variables locally
   export MONGO_URI="your-production-mongo-uri"
   export JWT_SECRET="your-production-secret"
   npm start
   ```

3. **Use Health Endpoint**
   - The `/api/health` endpoint provides detailed system status
   - Check database connection status
   - Verify all features are working

## Security Considerations

1. **JWT Secret**
   - Use a strong, random secret
   - Never commit secrets to version control
   - Rotate secrets periodically

2. **MongoDB Security**
   - Use strong passwords
   - Consider IP whitelisting for production
   - Enable MongoDB Atlas security features

3. **CORS Configuration**
   - Update CORS settings to allow only your frontend domain
   - Consider adding rate limiting

## Monitoring and Maintenance

1. **Vercel Analytics**
   - Monitor function performance
   - Check for cold starts
   - Track API usage

2. **Database Monitoring**
   - Monitor MongoDB Atlas metrics
   - Set up alerts for connection issues
   - Track query performance

3. **Logs**
   - Check Vercel function logs regularly
   - Monitor application errors
   - Set up error tracking if needed

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure SSL certificates** (automatic with Vercel)
3. **Set up monitoring and alerts**
4. **Implement rate limiting**
5. **Add API documentation** (Swagger/OpenAPI)

Your API is now ready for production use! 🚀 