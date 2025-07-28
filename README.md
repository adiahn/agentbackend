# Velixify Backend Server

A comprehensive Node.js backend server for the Velixify system, featuring agent management, access request system, lockdown controls, USB management, and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB database
- Cloudinary account (for file uploads)

### Installation
```bash
npm install
```

### Environment Setup
Copy `env.example` to `.env` and configure your environment variables:
```bash
cp env.example .env
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📚 Documentation

All documentation has been organized in the `docs/` folder for better project structure:

### 📋 **Core Documentation**
- **[README.md](docs/README.md)** - Detailed setup and configuration guide
- **[ACCESS_REQUEST_IMPLEMENTATION_REPORT.md](docs/ACCESS_REQUEST_IMPLEMENTATION_REPORT.md)** - Complete implementation report for the access request system

### 🔧 **API Documentation**
- **[ACCESS_REQUEST_API_DOCUMENTATION.md](docs/ACCESS_REQUEST_API_DOCUMENTATION.md)** - Access request system API endpoints
- **[FRONTEND_API_DOCUMENTATION.md](docs/FRONTEND_API_DOCUMENTATION.md)** - Frontend integration guide

### 🚀 **Deployment Guides**
- **[VERCEL_DEPLOYMENT_GUIDE.md](docs/VERCEL_DEPLOYMENT_GUIDE.md)** - Step-by-step Vercel deployment guide
- **[POSTMAN_SETUP.md](docs/POSTMAN_SETUP.md)** - Postman collection setup and testing

### 🔒 **Security & Control Features**
- **[AGENT_IMPLEMENTATION_GUIDE.md](docs/AGENT_IMPLEMENTATION_GUIDE.md)** - Agent system implementation guide
- **[FRONTEND_LOCKDOWN_PIN_GUIDE.md](docs/FRONTEND_LOCKDOWN_PIN_GUIDE.md)** - Lockdown PIN system guide
- **[PERSISTENT_LOCKDOWN_IMPLEMENTATION.md](docs/PERSISTENT_LOCKDOWN_IMPLEMENTATION.md)** - Persistent lockdown feature
- **[POSTMAN_LOCKDOWN_TESTING.md](docs/POSTMAN_LOCKDOWN_TESTING.md)** - Lockdown system testing guide
- **[USB_CONTROL_DOCUMENTATION.md](docs/USB_CONTROL_DOCUMENTATION.md)** - USB control system documentation

### 📡 **System Features**
- **[REMOTE_COMMANDS.md](docs/REMOTE_COMMANDS.md)** - Remote command execution system

## 🏗️ Project Structure

```
server/
├── api/                    # Serverless entry point (Vercel)
├── config/                 # Configuration files
├── controllers/            # Route controllers
├── docs/                   # 📚 All documentation
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── scripts/                # Utility scripts
├── services/               # Business logic services
├── test/                   # 🧪 Test files and utilities
├── uploads/                # File upload directory
├── index.js                # Main server file
├── package.json            # Dependencies and scripts
└── vercel.json            # Vercel configuration
```

## 🌟 Key Features

### ✅ **Access Request System**
- Complete KYC workflow with document upload
- Cloudinary integration for secure file storage
- Email verification system
- Role-based access control (Super Admin vs Regular Admin)

### ✅ **Agent Management**
- Agent registration and activation
- Real-time status monitoring
- Command execution system
- Analytics and reporting

### ✅ **Security Features**
- JWT authentication
- Role-based authorization
- File upload security
- Input validation and sanitization

### ✅ **Control Systems**
- Lockdown system with PIN protection
- USB device control
- Remote command execution
- Persistent state management

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm test                 # Run API tests

# Production
npm start                # Start production server
npm run build            # Build for deployment

# Admin Management
npm run create-admin     # Create super admin account
npm run create-adnan     # Create specific admin account
npm run fix-admins       # Fix existing admin accounts

# Testing
npm run test             # Run main API tests
npm run test:commands    # Test command system
npm run test:lockdown    # Test lockdown system
npm run test:usb         # Test USB control system
npm run test:clear-usb   # Clear pending USB commands
npm run test:create-admin # Create test admin account
```

## 🚀 Deployment

### Render (Current)
- **URL**: https://agentbackend-mde1.onrender.com
- **Status**: ✅ Live and operational
- **Features**: Complete access request system with Cloudinary integration

### Vercel (Alternative)
- Configured for serverless deployment
- See `docs/VERCEL_DEPLOYMENT_GUIDE.md` for setup instructions

## 📊 Health Check

Check system status:
```bash
GET https://agentbackend-mde1.onrender.com/api/health
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add comprehensive documentation for new features
3. Test thoroughly before deployment
4. Update relevant documentation in the `docs/` folder

## 📞 Support

For technical support or questions:
- Check the documentation in the `docs/` folder
- Review the API documentation for endpoint details
- Test with the provided Postman collections

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 