# Auth Service with RBAC Implementation

## Overview
Complete authentication service with Role-Based Access Control (RBAC), Teams, and Department management for the EV91 platform.

## Features

### 🔐 Authentication
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- Session management and token refresh

### 👥 User Management
- User registration and profile management
- Password strength validation
- Account activation/deactivation

### 🏢 Organizational Structure
- **Departments**: Hierarchical department structure
- **Teams**: Team organization within departments
- **Team Leads**: Team leadership assignment

### 🛡️ Role-Based Access Control (RBAC)
- **Roles**: Predefined and custom roles
- **Permissions**: Granular permission system
- **Resource-Action**: Permission structure (e.g., `vehicles:create`, `orders:read`)

### 🔒 Security Features
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp src/.env.example .env

# Update database connection and JWT secrets
DATABASE_URL="postgresql://username:password@localhost:5432/ev91_auth"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial RBAC data (after fixing Prisma generation)
npx ts-node prisma/seed.ts
```

### 4. Start Service
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get current user profile

### User Management
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `POST /api/v1/users/:id/roles` - Assign roles to user

### Department Management
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/:id` - Get department by ID
- `PUT /api/v1/departments/:id` - Update department
- `DELETE /api/v1/departments/:id` - Delete department

### Team Management
- `GET /api/v1/teams` - List teams
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/:id` - Get team by ID
- `PUT /api/v1/teams/:id` - Update team
- `DELETE /api/v1/teams/:id` - Delete team

### Role Management
- `GET /api/v1/roles` - List roles
- `POST /api/v1/roles` - Create role
- `GET /api/v1/roles/:id` - Get role by ID
- `PUT /api/v1/roles/:id` - Update role
- `POST /api/v1/roles/:id/permissions` - Assign permissions to role

## Database Schema

### Core Tables
- `users` - User accounts with department/team assignment
- `departments` - Hierarchical department structure
- `teams` - Teams within departments
- `roles` - System roles
- `permissions` - Granular permissions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission assignments

## Default RBAC Setup

### Departments
- IT & Technology
- Operations
- Customer Service
- Finance & Accounting
- Human Resources

### Roles & Permissions
1. **Super Admin** - Full system access
2. **Admin** - Management access (no user deletion)
3. **Manager** - Department/team management
4. **Operator** - Operations staff permissions
5. **Support** - Customer service permissions
6. **Viewer** - Read-only access

### Initial Admin Account
```
Email: admin@ev91.com
Password: SuperAdmin123!
```

## Usage Examples

### Authentication Middleware
```typescript
import { RBACMiddleware } from './middleware/rbac';

// Require authentication
app.use('/api/protected', RBACMiddleware.authenticate);

// Require specific permission
app.get('/api/vehicles', 
  RBACMiddleware.authenticate,
  RBACMiddleware.authorize({ resource: 'vehicles', action: 'read' }),
  vehicleController.getVehicles
);

// Require role
app.delete('/api/users/:id',
  RBACMiddleware.authenticate,
  RBACMiddleware.requireAdmin(),
  userController.deleteUser
);

// Require department access
app.get('/api/department-data',
  RBACMiddleware.authenticate,
  RBACMiddleware.requireDepartment('Operations'),
  dataController.getDepartmentData
);
```

### Permission Checking
```typescript
// Check multiple permissions
const permissions = [
  { resource: 'vehicles', action: 'create' },
  { resource: 'warehouses', action: 'read' }
];
app.post('/api/vehicle-assignment',
  RBACMiddleware.authenticate,
  RBACMiddleware.authorize(permissions),
  vehicleController.assignVehicle
);
```

## Next Steps

1. **Complete the implementation** by running the database setup commands
2. **Test the authentication flow** with the provided endpoints
3. **Integrate with other services** using the RBAC middleware
4. **Extend with additional roles** and permissions as needed

## Security Considerations

- JWT secrets should be rotated regularly
- Password policies enforced
- Rate limiting configured appropriately
- CORS origins restricted to known domains
- All sensitive operations logged

This RBAC system provides a solid foundation for the EV91 platform's authentication and authorization needs!