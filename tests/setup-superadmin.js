const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://user:password@localhost:5432/ev91db"
    }
  }
});

async function checkAndCreateSuperAdmin() {
  try {
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Check if super admin exists
    console.log('🔍 Checking for super admin...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@ev91.com' }
    });

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
      console.log('Email verified:', existingAdmin.emailVerified);
      console.log('Is active:', existingAdmin.isActive);
      return;
    }

    console.log('👤 Creating super admin...');
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@ev91.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        emailVerified: true,
      }
    });

    console.log('✅ Super admin created:', superAdmin.email);

    // Check if SUPER_ADMIN role exists
    let superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      console.log('👑 Creating SUPER_ADMIN role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Super Administrator with full access'
        }
      });
    }

    // Assign role to super admin
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id
      }
    });

    console.log('✅ Super admin role assigned');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateSuperAdmin();
