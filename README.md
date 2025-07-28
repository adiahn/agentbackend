# SystemMonitor Backend API

A comprehensive backend API for system monitoring, agent management, and device control.

## Features

- **Agent Management**: Register and manage system monitoring agents
- **Admin Authentication**: Secure admin login and authorization
- **Activation Code System**: Generate and validate activation codes
- **Lockdown System**: Remote device lockdown capabilities
- **USB Control**: Manage USB device access
- **Command Management**: Send and track remote commands
- **Analytics Dashboard**: Comprehensive system analytics
- **Super Admin Analytics**: Advanced analytics for super admins

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Create a super admin (optional)**
   ```bash
   npm run create-admin
   ```

### Vercel Deployment

This project is configured for easy deployment on Vercel.

#### Prerequisites

1. **MongoDB Atlas Database**
   - Create a MongoDB Atlas account
   - Set up a new cluster
   - Get your connection string

2. **Cloudinary Account** (for file uploads)
   - Create a Cloudinary account
   - Get your cloud name, API key, and secret

3. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

#### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Node.js configuration

3. **Configure Environment Variables**
   In your Vercel project dashboard:
   - Go to Settings → Environment Variables
   - Add the following variables:
     ```
     MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/systemmonitor
     JWT_SECRET=your-super-secret-jwt-key-here
     JWT_EXPIRE=24h
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     NODE_ENV=production
     ```

4. **Redeploy**
   - After adding environment variables, redeploy your project
   - Vercel will automatically rebuild with the new configuration

#### API Endpoints

Once deployed, your API will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Health Check**: `https://your-project-name.vercel.app/api/health`
- **API Documentation**: `https://your-project-name.vercel.app/`

## API Documentation

### Core Endpoints

- `GET /` - API information and documentation
- `GET /api/health` - Health check and system status
- `POST /api/admin/login` - Admin authentication
- `POST /api/agent/register` - Agent registration
- `POST /api/activation/generate` - Generate activation codes
- `POST /api/lockdown/trigger` - Trigger device lockdown
- `GET /api/analytics/dashboard` - Analytics dashboard data

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRE` | JWT token expiration time | No (default: 24h) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No (default: 4000) |

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run API tests
- `npm run test:commands` - Test command system
- `npm run create-admin` - Create super admin user

### Project Structure

```
server/
├── api/                 # Vercel serverless entry point
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Express middleware
├── models/            # MongoDB models
├── routes/            # API routes
├── services/          # Business logic services
├── scripts/           # Utility scripts
├── vercel.json        # Vercel configuration
└── index.js           # Local development entry point
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your `MONGO_URI` environment variable
   - Ensure your MongoDB Atlas cluster is accessible
   - Verify network access settings

2. **JWT Authentication Errors**
   - Ensure `JWT_SECRET` is set and consistent
   - Check token expiration settings

3. **Vercel Deployment Issues**
   - Verify all environment variables are set in Vercel dashboard
   - Check Vercel function logs for errors
   - Ensure `vercel.json` is properly configured

### Support

For issues and questions:
- Check the health endpoint: `/api/health`
- Review Vercel deployment logs
- Ensure all environment variables are properly configured

## License

ISC License 