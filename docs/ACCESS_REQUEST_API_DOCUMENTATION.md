# Access Request API Documentation

This document describes the new access request system that allows businesses to request access to the SystemMonitor platform.

## Overview

The access request system provides a secure way for businesses to register for platform access. The process includes:

1. **Request Submission** - Businesses submit their information and documents
2. **Email Verification** - Users verify their email address
3. **Admin Review** - Admins review and approve/reject requests
4. **Account Creation** - Approved requests are converted to admin accounts

## API Endpoints

### 1. Request Access

**POST** `/api/auth/request-access`

Submit a new access request with business information and documents.

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyName` | string | Yes | Company name (max 100 characters) |
| `businessRegNumber` | string | Yes | Business registration number (max 50 characters) |
| `document` | file | Yes | Business registration document (PDF/JPG/JPEG/PNG, max 10MB) |
| `nin` | string | Yes | National Identification Number (8-20 characters) |
| `phone` | string | Yes | Phone number (7-15 characters) |
| `email` | string | Yes | Email address (must be unique) |
| `password` | string | Yes | Password (min 6 characters) |
| `confirmPassword` | string | Yes | Password confirmation (must match password) |
| `terms` | boolean | Yes | Terms acceptance (must be true) |

#### Example Request

```bash
curl -X POST https://your-api.vercel.app/api/auth/request-access \
  -F "companyName=Acme Corporation" \
  -F "businessRegNumber=REG123456" \
  -F "document=@/path/to/document.pdf" \
  -F "nin=12345678901" \
  -F "phone=+1234567890" \
  -F "email=admin@acme.com" \
  -F "password=securepass123" \
  -F "confirmPassword=securepass123" \
  -F "terms=true"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Access request submitted successfully. You will be notified once approved.",
  "requestId": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

#### Error Response (400/422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email already exists in the system",
    "password": "Password must be at least 6 characters",
    "document": "Business registration document is required"
  }
}
```

### 2. Verify Email

**GET** `/api/auth/verify-email/:token`

Verify email address using the token sent in the confirmation email.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Email verification token |

#### Example Request

```bash
curl -X GET https://your-api.vercel.app/api/auth/verify-email/abc123def456
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

### 3. Check Request Status

**GET** `/api/auth/request-status/:email`

Check the status of an access request by email address.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Email address used in the request |

#### Example Request

```bash
curl -X GET https://your-api.vercel.app/api/auth/request-status/admin@acme.com
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "status": "pending",
    "companyName": "Acme Corporation",
    "email": "admin@acme.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "rejectionReason": null,
    "approvedAt": null
  }
}
```

#### Error Response (404)

```json
{
  "success": false,
  "message": "Access request not found"
}
```

## Admin Management Endpoints

### 1. Get All Access Requests

**GET** `/api/admin/access-requests`

Get all access requests with pagination and filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (pending/approved/rejected) |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of items per page |

#### Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Example Request

```bash
curl -X GET "https://your-api.vercel.app/api/admin/access-requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "companyName": "Acme Corporation",
        "businessRegNumber": "REG123456",
        "documentUrl": "https://res.cloudinary.com/...",
        "documentFilename": "document.pdf",
        "nin": "12345678901",
        "phone": "+1234567890",
        "email": "admin@acme.com",
        "status": "pending",
        "emailVerified": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRequests": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Get Access Request Statistics

**GET** `/api/admin/access-requests/stats`

Get statistics about access requests.

#### Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "pending": 15,
    "approved": 25,
    "rejected": 10,
    "total": 50,
    "recentRequests": 8,
    "approvalRate": "50.00"
  }
}
```

### 3. Get Single Access Request

**GET** `/api/admin/access-requests/:id`

Get detailed information about a specific access request.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Access request ID |

#### Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "companyName": "Acme Corporation",
    "businessRegNumber": "REG123456",
    "documentUrl": "https://res.cloudinary.com/...",
    "documentFilename": "document.pdf",
    "nin": "12345678901",
    "phone": "+1234567890",
    "email": "admin@acme.com",
    "status": "pending",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Approve Access Request

**PUT** `/api/admin/access-requests/:id/approve`

Approve an access request and create an admin account.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Access request ID |

#### Headers

```
Authorization: Bearer <admin-jwt-token>
```

#### Example Request

```bash
curl -X PUT https://your-api.vercel.app/api/admin/access-requests/64f8a1b2c3d4e5f6a7b8c9d0/approve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Access request approved successfully",
  "data": {
    "requestId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "adminId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "email": "admin@acme.com",
    "companyName": "Acme Corporation"
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "Email must be verified before approval"
}
```

### 5. Reject Access Request

**PUT** `/api/admin/access-requests/:id/reject`

Reject an access request with a reason.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Access request ID |

#### Request Body

```json
{
  "reason": "Incomplete business registration document"
}
```

#### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

#### Example Request

```bash
curl -X PUT https://your-api.vercel.app/api/admin/access-requests/64f8a1b2c3d4e5f6a7b8c9d0/reject \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"reason": "Incomplete business registration document"}'
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Access request rejected successfully",
  "data": {
    "requestId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "admin@acme.com",
    "companyName": "Acme Corporation",
    "rejectionReason": "Incomplete business registration document"
  }
}
```

## Validation Rules

### Access Request Validation

- **Company Name**: Required, non-empty string, max 100 characters
- **Business Registration Number**: Required, non-empty string, max 50 characters
- **Document**: Required, PDF/JPG/JPEG/PNG only, max 10MB
- **NIN**: Required, 8-20 characters
- **Phone**: Required, 7-15 characters
- **Email**: Required, valid email format, unique in system
- **Password**: Required, minimum 6 characters
- **Confirm Password**: Must match password exactly
- **Terms**: Must be accepted (true)

### File Upload Requirements

- **Supported Formats**: PDF, JPG, JPEG, PNG
- **Maximum Size**: 10MB
- **Storage**: Files are uploaded to Cloudinary for secure storage
- **Security**: Files are validated for type and size before upload

## Email Notifications

The system sends the following email notifications:

1. **Request Confirmation**: Sent when access request is submitted
2. **Email Verification**: Contains verification link
3. **Approval Notification**: Sent when request is approved
4. **Rejection Notification**: Sent when request is rejected (with reason)

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Email Verification**: Required before approval
- **File Validation**: Strict file type and size validation
- **Rate Limiting**: Implemented on request endpoints
- **Input Sanitization**: All inputs are validated and sanitized
- **Secure File Storage**: Files stored in Cloudinary with secure URLs

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

## Rate Limiting

- **Request Access**: 5 requests per hour per IP
- **Email Verification**: 10 attempts per hour per IP
- **Status Check**: 20 requests per hour per IP

## Testing

### Test Access Request

```bash
# Create a test access request
curl -X POST https://your-api.vercel.app/api/auth/request-access \
  -F "companyName=Test Company" \
  -F "businessRegNumber=TEST123" \
  -F "document=@test-document.pdf" \
  -F "nin=12345678901" \
  -F "phone=+1234567890" \
  -F "email=test@example.com" \
  -F "password=testpass123" \
  -F "confirmPassword=testpass123" \
  -F "terms=true"
```

### Test Admin Approval

```bash
# Login as admin first
curl -X POST https://your-api.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "adminpass"}'

# Use the returned token to approve request
curl -X PUT https://your-api.vercel.app/api/admin/access-requests/REQUEST_ID/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Implementation Notes

1. **Email Service**: Currently logs to console. Implement with your preferred email service (SendGrid, Nodemailer, etc.)
2. **File Cleanup**: Temporary files in uploads/ directory should be cleaned up after Cloudinary upload
3. **Environment Variables**: Ensure all required environment variables are set
4. **Database Indexes**: Consider adding indexes on email and status fields for better performance 