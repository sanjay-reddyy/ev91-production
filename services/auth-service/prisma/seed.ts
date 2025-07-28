import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../src/utils/password';

const prisma = new PrismaClient();

async function seedRBAC() {
  console.log('🌱 Seeding RBAC data...');

  try {
    // Create Departments
    console.log('Creating departments...');
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          name: 'IT & Technology',
          description: 'Information Technology and Software Development',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Operations',
          description: 'Fleet Operations and Logistics',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Customer Service',
          description: 'Customer Support and Relations',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Finance & Accounting',
          description: 'Financial Management and Accounting',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Human Resources',
          description: 'Human Resource Management',
        },
      }),
    ]);

    // Create Teams
    console.log('Creating teams...');
    const teams = await Promise.all([
      // IT Teams
      prisma.team.create({
        data: {
          name: 'Backend Development',
          description: 'API and Backend Services Development',
          departmentId: departments[0].id,
        },
      }),
      prisma.team.create({
        data: {
          name: 'Frontend Development',
          description: 'Web and Mobile App Development',
          departmentId: departments[0].id,
        },
      }),
      prisma.team.create({
        data: {
          name: 'DevOps',
          description: 'Infrastructure and Deployment',
          departmentId: departments[0].id,
        },
      }),
      // Operations Teams
      prisma.team.create({
        data: {
          name: 'Fleet Management',
          description: 'Vehicle Fleet Operations',
          departmentId: departments[1].id,
        },
      }),
      prisma.team.create({
        data: {
          name: 'Warehouse Operations',
          description: 'Warehouse and Inventory Management',
          departmentId: departments[1].id,
        },
      }),
      // Customer Service Teams
      prisma.team.create({
        data: {
          name: 'Support Level 1',
          description: 'First Level Customer Support',
          departmentId: departments[2].id,
        },
      }),
      prisma.team.create({
        data: {
          name: 'Support Level 2',
          description: 'Advanced Technical Support',
          departmentId: departments[2].id,
        },
      }),
    ]);

    // Create Permissions
    console.log('Creating permissions...');
    const resources = [
      'users', 'departments', 'teams', 'roles', 'permissions',
      'vehicles', 'orders', 'payments', 'warehouses', 'spareparts',
      'riders', 'clients', 'tracking', 'analytics', 'reports'
    ];
    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    const permissions: any[] = [];
    for (const resource of resources) {
      for (const action of actions) {
        const permission = await prisma.permission.create({
          data: {
            name: `${resource}:${action}`,
            resource,
            action,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
          },
        }); 
        permissions.push(permission);
      }
    }

    // Create Roles
    console.log('Creating roles...');
    const roles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'super_admin',
          description: 'Super Administrator with full system access',
        },
      }),
      prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with management access',
        },
      }),
      prisma.role.create({
        data: {
          name: 'manager',
          description: 'Department/Team Manager',
        },
      }),
      prisma.role.create({
        data: {
          name: 'operator',
          description: 'Operations Staff',
        },
      }),
      prisma.role.create({
        data: {
          name: 'support',
          description: 'Customer Support Staff',
        },
      }),
      prisma.role.create({
        data: {
          name: 'viewer',
          description: 'Read-only access to basic data',
        },
      }),
    ]);

    // Assign Permissions to Roles
    console.log('Assigning permissions to roles...');

    // Super Admin - All permissions
    const superAdminPermissions = permissions.map(p => ({
      roleId: roles[0].id, // super_admin
      permissionId: p.id,
    }));
    await prisma.rolePermission.createMany({
      data: superAdminPermissions,
    });

    // Admin - Most permissions except super admin specific
    const adminPermissionNames = [
      'users:read', 'users:update', 'users:create',
      'departments:read', 'departments:create', 'departments:update',
      'teams:read', 'teams:create', 'teams:update',
      'roles:read', 'roles:create', 'roles:update',
      'vehicles:manage', 'orders:manage', 'payments:read',
      'warehouses:manage', 'spareparts:manage',
      'riders:manage', 'clients:manage', 'tracking:read',
      'analytics:read', 'reports:read'
    ];
    const adminPermissions = permissions
      .filter(p => adminPermissionNames.includes(p.name))
      .map(p => ({
        roleId: roles[1].id, // admin
        permissionId: p.id,
      }));
    await prisma.rolePermission.createMany({
      data: adminPermissions,
    });

    // Manager - Department/team specific permissions
    const managerPermissionNames = [
      'users:read', 'teams:read', 'teams:update',
      'vehicles:read', 'vehicles:update', 'orders:read', 'orders:update',
      'warehouses:read', 'spareparts:read',
      'riders:read', 'clients:read', 'tracking:read',
      'analytics:read', 'reports:read'
    ];
    const managerPermissions = permissions
      .filter(p => managerPermissionNames.includes(p.name))
      .map(p => ({
        roleId: roles[2].id, // manager
        permissionId: p.id,
      }));
    await prisma.rolePermission.createMany({
      data: managerPermissions,
    });

    // Operator - Operational permissions
    const operatorPermissionNames = [
      'vehicles:read', 'vehicles:update', 'orders:read', 'orders:update',
      'warehouses:read', 'warehouses:update', 'spareparts:read', 'spareparts:update',
      'riders:read', 'tracking:read'
    ];
    const operatorPermissions = permissions
      .filter(p => operatorPermissionNames.includes(p.name))
      .map(p => ({
        roleId: roles[3].id, // operator
        permissionId: p.id,
      }));
    await prisma.rolePermission.createMany({
      data: operatorPermissions,
    });

    // Support - Customer service permissions
    const supportPermissionNames = [
      'riders:read', 'riders:update', 'orders:read', 'orders:update',
      'vehicles:read', 'clients:read', 'tracking:read'
    ];
    const supportPermissions = permissions
      .filter(p => supportPermissionNames.includes(p.name))
      .map(p => ({
        roleId: roles[4].id, // support
        permissionId: p.id,
      }));
    await prisma.rolePermission.createMany({
      data: supportPermissions,
    });

    // Viewer - Read-only permissions
    const viewerPermissionNames = [
      'users:read', 'departments:read', 'teams:read',
      'vehicles:read', 'orders:read', 'warehouses:read',
      'spareparts:read', 'riders:read', 'clients:read',
      'tracking:read', 'analytics:read', 'reports:read'
    ];
    const viewerPermissions = permissions
      .filter(p => viewerPermissionNames.includes(p.name))
      .map(p => ({
        roleId: roles[5].id, // viewer
        permissionId: p.id,
      }));
    await prisma.rolePermission.createMany({
      data: viewerPermissions,
    });

    // Create initial Super Admin user
    console.log('Creating initial super admin user...');
    const hashedPassword = await PasswordService.hashPassword('SuperAdmin123!');
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@ev91.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+911234567890',
        departmentId: departments[0].id, // IT Department
        teamId: teams[0].id, // Backend Team
      },
    });

    // Assign super admin role
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: roles[0].id, // super_admin
      },
    });

    console.log('✅ RBAC seeding completed successfully!');
    console.log('\n📊 Created:');
    console.log(`   - ${departments.length} Departments`);
    console.log(`   - ${teams.length} Teams`);
    console.log(`   - ${permissions.length} Permissions`);
    console.log(`   - ${roles.length} Roles`);
    console.log(`   - 1 Super Admin User`);
    
    console.log('\n🔑 Super Admin Credentials:');
    console.log('   Email: admin@ev91.com');
    console.log('   Password: SuperAdmin123!');
    console.log('\n🚀 You can now start the auth service!');

  } catch (error) {
    console.error('❌ Error seeding RBAC data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRBAC()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
