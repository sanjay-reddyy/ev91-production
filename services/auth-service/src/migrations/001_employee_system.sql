-- Enhanced Auth Service Migration Script
-- This script creates the complete employee management system with RBAC

-- First, drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "auth"."RolePermission" CASCADE;
DROP TABLE IF EXISTS "auth"."UserRole" CASCADE;
DROP TABLE IF EXISTS "auth"."Permission" CASCADE;
DROP TABLE IF EXISTS "auth"."Role" CASCADE;
DROP TABLE IF EXISTS "auth"."Employee" CASCADE;
DROP TABLE IF EXISTS "auth"."Team" CASCADE;
DROP TABLE IF EXISTS "auth"."Department" CASCADE;

-- Add new columns to existing User table
ALTER TABLE "auth"."User"
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Add new columns to existing Session table
ALTER TABLE "auth"."Session"
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT UNIQUE;

-- Create Department table
CREATE TABLE "auth"."Department" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "code" TEXT UNIQUE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create Team table
CREATE TABLE "auth"."Team" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "managerId" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "auth"."Department"("id") ON DELETE CASCADE,
    CONSTRAINT "Team_name_departmentId_key" UNIQUE ("name", "departmentId")
);

-- Create Employee table
CREATE TABLE "auth"."Employee" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    "employeeId" TEXT UNIQUE NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT,
    "managerId" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "auth"."Department"("id"),
    CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "auth"."Team"("id"),
    CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "auth"."Employee"("id")
);

-- Add foreign key for Team manager
ALTER TABLE "auth"."Team"
ADD CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "auth"."Employee"("id");

-- Create Role table
CREATE TABLE "auth"."Role" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "level" INTEGER DEFAULT 1,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create Permission table
CREATE TABLE "auth"."Permission" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "service" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_service_resource_action_key" UNIQUE ("service", "resource", "action")
);

-- Create RolePermission junction table
CREATE TABLE "auth"."RolePermission" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."Role"("id") ON DELETE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth"."Permission"("id") ON DELETE CASCADE,
    CONSTRAINT "RolePermission_roleId_permissionId_key" UNIQUE ("roleId", "permissionId")
);

-- Create UserRole junction table
CREATE TABLE "auth"."UserRole" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."Role"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRole_userId_roleId_key" UNIQUE ("userId", "roleId")
);

-- Add foreign key for Session table
ALTER TABLE "auth"."Session"
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE;

-- Add foreign key for TeamMember table
ALTER TABLE "auth"."TeamMember"
ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE,
ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "auth"."Team"("id") ON DELETE CASCADE,
ADD CONSTRAINT "TeamMember_userId_teamId_key" UNIQUE ("userId", "teamId");

-- Create indexes for better performance
CREATE INDEX "Employee_departmentId_idx" ON "auth"."Employee"("departmentId");
CREATE INDEX "Employee_teamId_idx" ON "auth"."Employee"("teamId");
CREATE INDEX "Employee_managerId_idx" ON "auth"."Employee"("managerId");
CREATE INDEX "Employee_employeeId_idx" ON "auth"."Employee"("employeeId");
CREATE INDEX "Team_departmentId_idx" ON "auth"."Team"("departmentId");
CREATE INDEX "Team_managerId_idx" ON "auth"."Team"("managerId");
CREATE INDEX "Permission_service_idx" ON "auth"."Permission"("service");
CREATE INDEX "UserRole_userId_idx" ON "auth"."UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "auth"."UserRole"("roleId");
CREATE INDEX "RolePermission_roleId_idx" ON "auth"."RolePermission"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "auth"."RolePermission"("permissionId");

-- Insert default departments
INSERT INTO "auth"."Department" ("id", "name", "description", "code") VALUES
('dept_001', 'Information Technology', 'IT Department responsible for technology infrastructure', 'IT'),
('dept_002', 'Human Resources', 'HR Department managing employee relations and policies', 'HR'),
('dept_003', 'Operations', 'Operations Department managing day-to-day business operations', 'OPS'),
('dept_004', 'Finance', 'Finance Department managing financial operations and reporting', 'FIN'),
('dept_005', 'Customer Service', 'Customer Service Department handling customer support', 'CS');

-- Insert default teams
INSERT INTO "auth"."Team" ("id", "name", "description", "departmentId") VALUES
('team_001', 'Backend Development', 'Backend development team', 'dept_001'),
('team_002', 'Frontend Development', 'Frontend development team', 'dept_001'),
('team_003', 'DevOps', 'DevOps and infrastructure team', 'dept_001'),
('team_004', 'Recruitment', 'Talent acquisition team', 'dept_002'),
('team_005', 'Employee Relations', 'Employee relations and policy team', 'dept_002'),
('team_006', 'Field Operations', 'Field operations and logistics', 'dept_003'),
('team_007', 'Quality Assurance', 'Quality assurance and testing', 'dept_003'),
('team_008', 'Accounting', 'Accounting and bookkeeping', 'dept_004'),
('team_009', 'Financial Planning', 'Financial planning and analysis', 'dept_004'),
('team_010', 'Customer Support', 'Customer support and help desk', 'dept_005');

-- Insert default roles with levels
INSERT INTO "auth"."Role" ("id", "name", "description", "level") VALUES
('role_super_admin', 'Super Admin', 'Super administrator with full system access', 10),
('role_admin', 'Admin', 'Administrator with broad system access', 8),
('role_manager', 'Manager', 'Department or team manager', 6),
('role_supervisor', 'Supervisor', 'Team supervisor with limited management access', 4),
('role_employee', 'Employee', 'Regular employee with basic access', 2),
('role_intern', 'Intern', 'Intern with restricted access', 1);

-- Insert default permissions for each service
INSERT INTO "auth"."Permission" ("name", "description", "service", "resource", "action") VALUES
-- Auth service permissions
('Auth Users Create', 'Create new users', 'auth', 'users', 'create'),
('Auth Users Read', 'View user information', 'auth', 'users', 'read'),
('Auth Users Update', 'Update user information', 'auth', 'users', 'update'),
('Auth Users Delete', 'Delete users', 'auth', 'users', 'delete'),

('Auth Employees Create', 'Create new employees', 'auth', 'employees', 'create'),
('Auth Employees Read', 'View employee information', 'auth', 'employees', 'read'),
('Auth Employees Update', 'Update employee information', 'auth', 'employees', 'update'),
('Auth Employees Delete', 'Delete/deactivate employees', 'auth', 'employees', 'delete'),

('Auth Departments Create', 'Create new departments', 'auth', 'departments', 'create'),
('Auth Departments Read', 'View department information', 'auth', 'departments', 'read'),
('Auth Departments Update', 'Update department information', 'auth', 'departments', 'update'),
('Auth Departments Delete', 'Delete departments', 'auth', 'departments', 'delete'),

('Auth Teams Create', 'Create new teams', 'auth', 'teams', 'create'),
('Auth Teams Read', 'View team information', 'auth', 'teams', 'read'),
('Auth Teams Update', 'Update team information', 'auth', 'teams', 'update'),
('Auth Teams Delete', 'Delete teams', 'auth', 'teams', 'delete'),

('Auth Roles Create', 'Create new roles', 'auth', 'roles', 'create'),
('Auth Roles Read', 'View role information', 'auth', 'roles', 'read'),
('Auth Roles Update', 'Update role information', 'auth', 'roles', 'update'),
('Auth Roles Delete', 'Delete roles', 'auth', 'roles', 'delete'),

('Auth Permissions Create', 'Create new permissions', 'auth', 'permissions', 'create'),
('Auth Permissions Read', 'View permission information', 'auth', 'permissions', 'read'),
('Auth Permissions Update', 'Update permission information', 'auth', 'permissions', 'update'),
('Auth Permissions Delete', 'Delete permissions', 'auth', 'permissions', 'delete'),

-- Vehicle service permissions
('Vehicle Vehicles Create', 'Create new vehicles', 'vehicle', 'vehicles', 'create'),
('Vehicle Vehicles Read', 'View vehicle information', 'vehicle', 'vehicles', 'read'),
('Vehicle Vehicles Update', 'Update vehicle information', 'vehicle', 'vehicles', 'update'),
('Vehicle Vehicles Delete', 'Delete vehicles', 'vehicle', 'vehicles', 'delete'),

('Vehicle Maintenance Create', 'Create maintenance records', 'vehicle', 'maintenance', 'create'),
('Vehicle Maintenance Read', 'View maintenance records', 'vehicle', 'maintenance', 'read'),
('Vehicle Maintenance Update', 'Update maintenance records', 'vehicle', 'maintenance', 'update'),
('Vehicle Maintenance Delete', 'Delete maintenance records', 'vehicle', 'maintenance', 'delete'),

-- Rider service permissions
('Rider Riders Create', 'Create new riders', 'rider', 'riders', 'create'),
('Rider Riders Read', 'View rider information', 'rider', 'riders', 'read'),
('Rider Riders Update', 'Update rider information', 'rider', 'riders', 'update'),
('Rider Riders Delete', 'Delete riders', 'rider', 'riders', 'delete'),

('Rider KYC Read', 'View KYC information', 'rider', 'kyc', 'read'),
('Rider KYC Update', 'Update KYC status', 'rider', 'kyc', 'update'),
('Rider KYC Approve', 'Approve KYC documents', 'rider', 'kyc', 'approve'),

-- Client Store service permissions
('ClientStore Clients Create', 'Create new clients', 'client-store', 'clients', 'create'),
('ClientStore Clients Read', 'View client information', 'client-store', 'clients', 'read'),
('ClientStore Clients Update', 'Update client information', 'client-store', 'clients', 'update'),
('ClientStore Clients Delete', 'Delete clients', 'client-store', 'clients', 'delete'),

('ClientStore Stores Create', 'Create new stores', 'client-store', 'stores', 'create'),
('ClientStore Stores Read', 'View store information', 'client-store', 'stores', 'read'),
('ClientStore Stores Update', 'Update store information', 'client-store', 'stores', 'update'),
('ClientStore Stores Delete', 'Delete stores', 'client-store', 'stores', 'delete'),

-- Spare Parts service permissions
('SpareParts Parts Create', 'Create new spare parts', 'spare-parts', 'parts', 'create'),
('SpareParts Parts Read', 'View spare parts information', 'spare-parts', 'parts', 'read'),
('SpareParts Parts Update', 'Update spare parts information', 'spare-parts', 'parts', 'update'),
('SpareParts Parts Delete', 'Delete spare parts', 'spare-parts', 'parts', 'delete'),

('SpareParts Inventory Read', 'View inventory information', 'spare-parts', 'inventory', 'read'),
('SpareParts Inventory Update', 'Update inventory levels', 'spare-parts', 'inventory', 'update'),

-- Reports and analytics permissions
('Reports Dashboard Read', 'View dashboard reports', 'reports', 'dashboard', 'read'),
('Reports Analytics Read', 'View analytics reports', 'reports', 'analytics', 'read'),
('Reports Export Create', 'Export reports', 'reports', 'export', 'create');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_super_admin', "id" FROM "auth"."Permission";

-- Admin gets most permissions except super admin functions
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_admin', "id" FROM "auth"."Permission"
WHERE "name" NOT LIKE '%Delete%' OR "service" != 'auth';

-- Manager gets read/update permissions for their domain
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_manager', "id" FROM "auth"."Permission"
WHERE "action" IN ('read', 'update', 'create')
AND "service" IN ('vehicle', 'rider', 'client-store', 'spare-parts', 'reports');

-- Supervisor gets read permissions and limited create/update
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_supervisor', "id" FROM "auth"."Permission"
WHERE "action" IN ('read', 'update')
AND "service" IN ('vehicle', 'rider', 'client-store', 'spare-parts');

-- Employee gets basic read permissions
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_employee', "id" FROM "auth"."Permission"
WHERE "action" = 'read'
AND "service" IN ('vehicle', 'rider', 'client-store', 'spare-parts');

-- Intern gets very limited read permissions
INSERT INTO "auth"."RolePermission" ("roleId", "permissionId")
SELECT 'role_intern', "id" FROM "auth"."Permission"
WHERE "action" = 'read'
AND "resource" IN ('vehicles', 'riders', 'clients', 'stores')
LIMIT 10;

-- Update the updatedAt timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_department_updated_at BEFORE UPDATE ON "auth"."Department" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON "auth"."Team" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_updated_at BEFORE UPDATE ON "auth"."Employee" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON "auth"."Role" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_updated_at BEFORE UPDATE ON "auth"."Permission" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "auth"."User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
