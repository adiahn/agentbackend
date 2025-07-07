# V-Agent Server

Backend server for the V-Agent application that handles admin authentication, agent management, and activation code system.

## Features

- **Admin Authentication System**
  - Secure JWT-based authentication
  - Role-based access control (admin/super_admin)
  - Password hashing with bcrypt
  - Account management and profile updates

- **Activation Code System**
  - Generate unique 8-character activation codes
  - Link agents to specific admins
  - Code expiration and usage tracking
  - Secure agent registration process

- **Agent Management**
  - Agent status reporting and tracking
  - System information collection
  - Location tracking
  - Admin-specific agent views

- **Security Features**
  - Input validation with express-validator
  - JWT token authentication
  - Role-based authorization
  - CORS enabled for cross-origin requests

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the server directory with the following variables:
   ```
   PORT=4000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/v-agent
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **Database Setup:**
   - Install MongoDB locally, or
   - Use MongoDB Atlas (update MONGO_URI in .env)

4. **Create Super Admin:**
   ```bash
   npm run create-admin
   ```
   This creates the first super admin account:
   - Username: `superadmin`
   - Email: `admin@v-agent.com`
   - Password: `admin123456`

5. **Start the server:**
   ```bash
   # Production
   npm start
   
   # Development (with auto-restart)
   npm run dev
   ```

## API Endpoints

### Health Check
- **GET** `/` - Server health status

### Admin Authentication
- **POST** `/api/admin/register` - Register new admin (super admin only)
- **POST** `/api/admin/login` - Admin login
- **GET** `/api/admin/profile` - Get admin profile (authenticated)
- **PUT** `/api/admin/profile` - Update admin profile (authenticated)
- **PUT** `/api/admin/change-password` - Change password (authenticated)
- **GET** `/api/admin/all` - Get all admins (super admin only)

### Activation Codes
- **POST** `/api/activation/generate` - Generate activation codes (authenticated)
- **GET** `/api/activation/my-codes` - Get admin's activation codes (authenticated)
- **GET** `/api/activation/code/:codeId` - Get specific activation code (authenticated)
- **PUT** `/api/activation/deactivate/:codeId` - Deactivate activation code (authenticated)
- **POST** `/api/activation/use` - Use activation code (public - for agent registration)
- **GET** `/api/activation/all` - Get all activation codes (super admin only)

### Agent Management
- **POST** `/api/agent/report` - Report agent status (public)
- **GET** `/api/my-agents` - Get admin's agents (authenticated)
- **GET** `/api/agent/:agentId` - Get specific agent (authenticated)
- **PUT** `/api/deactivate/:agentId` - Deactivate agent (authenticated)
- **GET** `/api/agents` - Get all agents (super admin only)

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Workflow

1. **Admin Setup:**
   - Create super admin account
   - Login to get JWT token
   - Generate activation codes

2. **Agent Registration:**
   - Agent uses activation code to register
   - Agent gets linked to specific admin
   - Agent can start reporting status

3. **Management:**
   - Admin can view their agents
   - Admin can manage activation codes
   - Super admin can view all data

## Project Structure

```
server/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── adminController.js     # Admin business logic
│   ├── agentController.js     # Agent business logic
│   └── activationController.js # Activation code logic
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── validation.js      # Input validation
├── models/
│   ├── Admin.js           # Admin data model
│   ├── Agent.js           # Agent data model
│   └── ActivationCode.js  # Activation code model
├── routes/
│   ├── adminRoutes.js     # Admin API routes
│   ├── agentRoutes.js     # Agent API routes
│   └── activationRoutes.js # Activation code routes
├── scripts/
│   └── createSuperAdmin.js # Initial setup script
├── index.js               # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Development

The server uses a typical MVC (Model-View-Controller) architecture:
- **Models**: Define data schemas and database interactions
- **Controllers**: Handle business logic and request/response
- **Routes**: Define API endpoints and HTTP methods
- **Middleware**: Authentication and validation

## Security Notes

- Change the default super admin password after first login
- Use a strong JWT_SECRET in production
- Enable HTTPS in production
- Regularly rotate activation codes
- Monitor for suspicious activity 