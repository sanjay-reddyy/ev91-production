const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create permissions
    console.log('📋 Creating permissions...');
    const permissions = [
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
      { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
      { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
      { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
      { name: 'admin:full', resource: 'admin', action: 'full', description: 'Full admin access' },
    ];

    const createdPermissions = [];
    for (const permission of permissions) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      createdPermissions.push(created);
      console.log(`  ✅ ${permission.name}`);
    }

    // Create roles
    console.log('👑 Creating roles...');
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Super Administrator with full system access',
        isActive: true,
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrator with limited access',
        isActive: true,
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Regular user with basic access',
        isActive: true,
      },
    });

    console.log('  ✅ Super Admin role');
    console.log('  ✅ Admin role');
    console.log('  ✅ User role');

    // Assign all permissions to Super Admin role
    console.log('🔗 Assigning permissions to roles...');
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log('  ✅ Super Admin permissions assigned');

    // Create Super Admin user
    console.log('👤 Creating Super Admin user...');
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@ev91.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: 'admin@ev91.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        emailVerified: true,
      },
    });

    // Assign Super Admin role to user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdmin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('  ✅ Super Admin user created');

    // Create additional test users
    console.log('👥 Creating test users...');
    
    // Regular Admin
    const adminHashedPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin.user@ev91.com' },
      update: {
        password: adminHashedPassword,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: 'admin.user@ev91.com',
        password: adminHashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });

    // Regular User
    const userHashedPassword = await bcrypt.hash('User123!', 12);
    const regularUser = await prisma.user.upsert({
      where: { email: 'test.user@ev91.com' },
      update: {
        password: userHashedPassword,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: 'test.user@ev91.com',
        password: userHashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: regularUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    });

    console.log('  ✅ Admin User created');
    console.log('  ✅ Test User created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ SUPER ADMIN                                             │');
    console.log('│ Email: admin@ev91.com                                   │');
    console.log('│ Password: SuperAdmin123!                                │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ ADMIN USER                                              │');
    console.log('│ Email: admin.user@ev91.com                              │');
    console.log('│ Password: Admin123!                                     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ TEST USER                                               │');
    console.log('│ Email: test.user@ev91.com                               │');
    console.log('│ Password: User123!                                      │');
    console.log('└─────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
