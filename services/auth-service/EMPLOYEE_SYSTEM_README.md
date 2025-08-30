# Employee Management System Implementation

## Overview

This implementation enhances the existing auth-service with a comprehensive employee management system featuring:

- **Organizational Structure**: Departments, Teams, and Employee hierarchy
- **Role-Based Access Control (RBAC)**: Granular permissions for different services
- **Employee Authentication**: Enhanced login with employee context
- **Permission System**: Service-resource-action level permissions
- **Management Hierarchy**: Manager-subordinate relationships

## 🏗️ Architecture

### Database Schema

```
User (Enhanced)
├── Employee (1:1)
│   ├── Department (N:1)
│   ├── Team (N:1) [Optional]
│   └── Manager (N:1) [Self-referencing]
├── UserRole (N:M)
└── Session (1:N)

Role
├── RolePermission (N:M)
└── Permission

Permission
└── Service:Resource:Action structure
```

### Enhanced Features

1. **Multi-Schema Support**: Uses PostgreSQL schemas for service isolation
2. **Hierarchical Permissions**: Role levels (1-10) for easy authorization
3. **Service Integration**: Permission structure supports all EV91 services
4. **Audit Trail**: Created timestamps and user tracking
5. **Soft Delete**: Deactivation instead of hard deletion

## 🚀 Implementation Details

### 1. Enhanced Prisma Schema

**Key Models Added:**

- `Department`: Organizational departments with codes
- `Team`: Teams within departments with managers
- `Employee`: Enhanced user profiles with organizational context
- `Role`: Hierarchical roles with levels
- `Permission`: Service-resource-action permissions
- `RolePermission`: Role-permission mapping
- `UserRole`: User-role assignments

**Relationships:**

- Employee belongs to Department and optionally Team
- Employee can have Manager (self-referencing)
- Teams have Managers (Employee)
- Users have multiple Roles
- Roles have multiple Permissions

### 2. Service Layer

**EmployeeService:**

- Employee creation with user account
- Enhanced login with full context
- Permission checking
- Organizational hierarchy management

**DepartmentService:**

- Department CRUD operations
- Hierarchy visualization
- Employee/team counting

**TeamService:**

- Team management within departments
- Manager assignment
- Employee team assignments

**RolePermissionService:**

- Role management with levels
- Permission management
- Role-permission assignments
- User-role assignments

### 3. Authentication & Authorization

**Enhanced JWT Payload:**

```typescript
{
  userId: string,
  email: string,
  roles: [{ id, name, level }],
  permissions: [{ service, resource, action }],
  employee: {
    id, employeeId, departmentId, teamId, managerId
  }
}
```

**Middleware Functions:**

- `authenticateEmployee`: Enhanced auth with employee context
- `requirePermission`: Single permission check
- `requireAnyPermission`: Multiple permission OR logic
- `requireAllPermissions`: Multiple permission AND logic
- `requireMinimumRoleLevel`: Role level checking
- `requireDepartmentAccess`: Department-based access
- `requireTeamAccess`: Team-based access
- `requireManagerAccess`: Manager privilege checking

### 4. API Endpoints

**Employee Management:**

```
POST   /api/v1/employees/login          # Employee login
GET    /api/v1/employees/me             # Current employee profile
POST   /api/v1/employees                # Create employee (Admin)
GET    /api/v1/employees/search         # Search employees
GET    /api/v1/employees/:id            # Get employee by ID
PUT    /api/v1/employees/:id            # Update employee
DELETE /api/v1/employees/:id/deactivate # Deactivate employee
GET    /api/v1/employees/:id/permissions/check # Check permissions
```

**Department Management:**

```
POST   /api/v1/departments              # Create department
GET    /api/v1/departments              # List departments
GET    /api/v1/departments/hierarchy    # Department hierarchy
GET    /api/v1/departments/:id          # Get department
PUT    /api/v1/departments/:id          # Update department
DELETE /api/v1/departments/:id          # Delete department
```

## 🔐 Permission System

### Service Structure

Permissions follow the pattern: `service:resource:action`

**Services:**

- `auth`: User, employee, role management
- `vehicle`: Vehicle and maintenance management
- `rider`: Rider and KYC management
- `client-store`: Client and store management
- `spare-parts`: Parts and inventory management
- `reports`: Analytics and reporting

**Resources:**

- `users`, `employees`, `departments`, `teams`, `roles`, `permissions`
- `vehicles`, `maintenance`
- `riders`, `kyc`
- `clients`, `stores`
- `parts`, `inventory`
- `dashboard`, `analytics`, `export`

**Actions:**

- `create`, `read`, `update`, `delete`
- `approve` (for KYC, etc.)
- `export` (for reports)

### Default Roles

1. **Super Admin (Level 10)**: Full system access
2. **Admin (Level 8)**: Broad access except dangerous operations
3. **Manager (Level 6)**: Department/team management
4. **Supervisor (Level 4)**: Limited management functions
5. **Employee (Level 2)**: Basic operational access
6. **Intern (Level 1)**: Read-only access

## 📦 Migration Strategy

### Phase 1: Database Setup

1. **Run Migration Script**: `src/migrations/001_employee_system.sql`

   - Creates all new tables with proper relationships
   - Adds indexes for performance
   - Sets up default departments, teams, roles, permissions

2. **Generate Prisma Client**: `npx prisma generate`

   - Updates TypeScript types
   - Enables type-safe database operations

3. **Seed Initial Data**: `src/seeds/employeeSystemSeed.ts`
   - Creates demo admin and employee accounts
   - Sets up organizational hierarchy
   - Assigns initial role permissions

### Phase 2: Service Integration

1. **Update Existing Services**: Add permission checks to existing endpoints
2. **Frontend Integration**: Update admin portal for employee management
3. **API Gateway**: Add employee authentication support
4. **Mobile App**: Add employee login flow

### Phase 3: Production Deployment

1. **Data Migration**: Migrate existing users to employee structure
2. **Permission Audit**: Review and adjust permissions per business needs
3. **Training**: Train administrators on new employee management features
4. **Monitoring**: Set up logging and monitoring for auth events

## 🛠️ Setup Instructions

### Prerequisites

- PostgreSQL database running
- Node.js and npm installed
- Environment variables configured

### Quick Setup

1. **Navigate to auth-service:**

   ```bash
   cd services/auth-service
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run setup script:**

   ```bash
   # Windows
   setup-employee-system.bat

   # Linux/Mac
   chmod +x setup-employee-system.sh
   ./setup-employee-system.sh
   ```

4. **Start the service:**
   ```bash
   npm run dev
   ```

### Manual Setup

1. **Run migration:**

   ```bash
   psql $DATABASE_URL -f src/migrations/001_employee_system.sql
   ```

2. **Generate Prisma client:**

   ```bash
   npx prisma generate
   ```

3. **Seed database:**
   ```bash
   npx ts-node src/seeds/employeeSystemSeed.ts
   ```

## 🧪 Testing

### Demo Credentials

| Role        | Email                   | Password       | Access Level           |
| ----------- | ----------------------- | -------------- | ---------------------- |
| Super Admin | admin@ev91.com          | SuperAdmin@123 | Full system access     |
| Manager     | john.manager@ev91.com   | Employee@123   | Department management  |
| Developer   | jane.developer@ev91.com | Employee@123   | Development access     |
| Supervisor  | bob.supervisor@ev91.com | Employee@123   | Operations supervision |

### API Testing

1. **Employee Login:**

   ```bash
   curl -X POST http://localhost:4001/api/v1/employees/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@ev91.com","password":"SuperAdmin@123"}'
   ```

2. **Get Employee Profile:**

   ```bash
   curl -X GET http://localhost:4001/api/v1/employees/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **List Departments:**
   ```bash
   curl -X GET http://localhost:4001/api/v1/departments \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 📋 Usage Examples

### Creating an Employee

```typescript
const newEmployee = {
  employeeId: "EMP005",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice.smith@ev91.com",
  departmentId: "dept_001", // IT Department
  teamId: "team_001", // Backend Development
  position: "Junior Developer",
  hireDate: new Date(),
  roleIds: ["role_employee"],
  temporaryPassword: "TempPass@123",
};

// POST /api/v1/employees
```

### Checking Permissions

```typescript
// Middleware usage
app.get(
  "/sensitive-data",
  authenticateEmployee,
  requirePermission("auth", "employees", "read"),
  (req, res) => {
    // Handler code
  }
);

// Multiple permissions
app.post(
  "/admin-action",
  authenticateEmployee,
  requireAllPermissions([
    { service: "auth", resource: "employees", action: "create" },
    { service: "auth", resource: "roles", action: "update" },
  ]),
  (req, res) => {
    // Handler code
  }
);
```

### Employee Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "employee": {
      "id": "emp_001",
      "employeeId": "EMP001",
      "name": "Super Admin",
      "email": "admin@ev91.com",
      "position": "System Administrator",
      "department": {
        "id": "dept_001",
        "name": "Information Technology",
        "code": "IT"
      },
      "roles": [
        {
          "id": "role_super_admin",
          "name": "Super Admin",
          "level": 10
        }
      ],
      "permissions": [
        {
          "service": "auth",
          "resource": "employees",
          "action": "create"
        }
        // ... more permissions
      ]
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ev91_auth"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Email (for welcome emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:3000"
SUPPORT_EMAIL="support@ev91.com"
```

### Permission Customization

To add new permissions:

1. **Insert into Permission table:**

   ```sql
   INSERT INTO "auth"."Permission" ("name", "service", "resource", "action")
   VALUES ('Custom Permission', 'your-service', 'your-resource', 'your-action');
   ```

2. **Assign to roles:**
   ```sql
   INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
   SELECT 'role_admin', id FROM "auth"."Permission"
   WHERE "service" = 'your-service' AND "resource" = 'your-resource';
   ```

## 🔄 Integration with Other Services

### API Gateway Integration

Update API Gateway to forward employee authentication:

```typescript
// In API Gateway middleware
app.use((req, res, next) => {
  // Forward Authorization header to all services
  req.headers["x-employee-id"] = req.user?.employee?.id;
  req.headers["x-employee-department"] = req.user?.employee?.department?.id;
  req.headers["x-user-permissions"] = JSON.stringify(req.user?.permissions);
  next();
});
```

### Service Permission Checks

In other services, validate permissions:

```typescript
// In vehicle-service
app.get("/vehicles", (req, res) => {
  const permissions = JSON.parse(req.headers["x-user-permissions"]);
  const hasAccess = permissions.some(
    (p) =>
      p.service === "vehicle" &&
      p.resource === "vehicles" &&
      p.action === "read"
  );

  if (!hasAccess) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  // Handle request
});
```

## 📊 Benefits

1. **Centralized Authentication**: Single source of truth for employee access
2. **Granular Permissions**: Fine-grained control over resource access
3. **Organizational Structure**: Clear hierarchy and reporting structure
4. **Scalable Architecture**: Easy to add new services and permissions
5. **Audit Trail**: Complete tracking of access and changes
6. **Security**: Role-based access with proper authentication
7. **Developer Experience**: Type-safe operations with Prisma
8. **Maintenance**: Easy to manage users, roles, and permissions

## 🚧 Future Enhancements

1. **Multi-tenant Support**: Support for multiple organizations
2. **Advanced Workflows**: Approval workflows for sensitive operations
3. **Time-based Permissions**: Temporary access and time-based restrictions
4. **Integration SSO**: Single sign-on with external identity providers
5. **Mobile Push**: Push notifications for important auth events
6. **Advanced Analytics**: Detailed access patterns and security analytics
7. **Policy Engine**: Complex policy-based access control
8. **Backup/Recovery**: Automated backup and disaster recovery procedures

This comprehensive employee management system provides a solid foundation for secure, scalable, and maintainable access control across the entire EV91 platform.
