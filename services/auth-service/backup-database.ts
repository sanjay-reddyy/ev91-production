import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const outputDir = path.join(__dirname, 'backup');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportTable(tableName: string, getter: () => Promise<any[]>) {
  try {
    console.log(`📤 Exporting ${tableName}...`);
    const data = await getter();
    fs.writeFileSync(
      path.join(outputDir, `${tableName}.json`),
      JSON.stringify(data, null, 2)
    );
    console.log(`✅ Exported ${data.length} ${tableName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error);
    return [];
  }
}

async function generateSeedFileFromBackup(backupData: any) {
  // Template for the seed file
  let seedFileContent = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting auth-service database seeding with complete backup data...");

  // Clean existing data (in correct order to handle foreign keys)
  console.log("🧹 Cleaning existing data...");
  await prisma.session.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.department.deleteMany();
  await prisma.city.deleteMany();

  // Load backup data
`;

  // Add each table's data to the seed file
  for (const table of Object.keys(backupData)) {
    seedFileContent += `  const ${table}Data = ${JSON.stringify(backupData[table], null, 2)};\n\n`;
  }

  // 1. Create Cities
  console.log("🏙️ Creating cities...");
  for (const city of citiesData) {
    await prisma.city.create({
      data: {
        id: city.id,
        name: city.name,
        displayName: city.displayName,
        code: city.code,
        state: city.state,
        country: city.country,
        timezone: city.timezone,
        latitude: city.latitude,
        longitude: city.longitude,
        pinCodeRange: city.pinCodeRange,
        regionCode: city.regionCode,
        isActive: city.isActive,
        isOperational: city.isOperational,
        launchDate: city.launchDate ? new Date(city.launchDate) : null,
        estimatedPopulation: city.estimatedPopulation,
        marketPotential: city.marketPotential,
        version: city.version,
        lastModifiedBy: city.lastModifiedBy,
        eventSequence: city.eventSequence,
        lastSyncAt: new Date(city.lastSyncAt),
        createdAt: new Date(city.createdAt),
        updatedAt: new Date(city.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${citiesData.length} cities\`);

  // 2. Create Departments
  console.log("🏢 Creating departments...");
  for (const department of departmentsData) {
    await prisma.department.create({
      data: {
        id: department.id,
        name: department.name,
        description: department.description,
        code: department.code,
        isActive: department.isActive,
        parentId: department.parentId,
        createdAt: new Date(department.createdAt),
        updatedAt: new Date(department.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${departmentsData.length} departments\`);

  // 3. Create Roles
  console.log("👥 Creating roles...");
  for (const role of rolesData) {
    await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.isActive,
        createdAt: new Date(role.createdAt),
        updatedAt: new Date(role.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${rolesData.length} roles\`);

  // 4. Create Permissions
  console.log("🔐 Creating permissions...");
  for (const permission of permissionsData) {
    await prisma.permission.create({
      data: {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        service: permission.service,
        resource: permission.resource,
        action: permission.action,
        isActive: permission.isActive,
        createdAt: new Date(permission.createdAt),
        updatedAt: new Date(permission.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${permissionsData.length} permissions\`);

  // 5. Create Users
  console.log("👤 Creating users...");
  for (const user of usersData) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${usersData.length} users\`);

  // 6. Create Teams
  console.log("👥 Creating teams...");
  for (const team of teamsData) {
    await prisma.team.create({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        departmentId: team.departmentId,
        managerId: team.managerId,
        isActive: team.isActive,
        city: team.city,
        state: team.state,
        memberCount: team.memberCount,
        maxMembers: team.maxMembers,
        skills: team.skills,
        status: team.status,
        createdAt: new Date(team.createdAt),
        updatedAt: new Date(team.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${teamsData.length} teams\`);

  // 7. Create Employees
  console.log("👷 Creating employees...");
  for (const employee of employeesData) {
    await prisma.employee.create({
      data: {
        id: employee.id,
        userId: employee.userId,
        employeeId: employee.employeeId,
        position: employee.position,
        departmentId: employee.departmentId,
        teamId: employee.teamId,
        managerId: employee.managerId,
        hireDate: new Date(employee.hireDate),
        createdAt: new Date(employee.createdAt),
        updatedAt: new Date(employee.updatedAt)
      }
    });
  }
  console.log(\`✅ Created \${employeesData.length} employees\`);

  // 8. Create User Roles
  console.log("🔐 Creating user roles...");
  for (const userRole of userRolesData) {
    await prisma.userRole.create({
      data: {
        id: userRole.id,
        userId: userRole.userId,
        roleId: userRole.roleId,
        expiresAt: userRole.expiresAt ? new Date(userRole.expiresAt) : null,
        createdAt: new Date(userRole.createdAt),
        createdBy: userRole.createdBy
      }
    });
  }
  console.log(\`✅ Created \${userRolesData.length} user roles\`);

  // 9. Create Role Permissions
  console.log("🔗 Creating role permissions...");
  for (const rolePermission of rolePermissionsData) {
    await prisma.rolePermission.create({
      data: {
        id: rolePermission.id,
        roleId: rolePermission.roleId,
        permissionId: rolePermission.permissionId
      }
    });
  }
  console.log(\`✅ Created \${rolePermissionsData.length} role permissions\`);

  console.log("\\n🚀 Auth Service database seeded successfully with complete backup data!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });`;

  // Write the seed file
  fs.writeFileSync(
    path.join(outputDir, 'complete-seed.ts'),
    seedFileContent
  );

  console.log(`🌱 Generated complete seed file at ${path.join(outputDir, 'complete-seed.ts')}`);
}

async function backupAll() {
  console.log("🔍 Starting complete database backup...");

  // Create backup directory
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (error) {
    console.error(`❌ Error creating backup directory:`, error);
    return;
  }

  // Export all tables
  const backupData = {
    cities: await exportTable('cities', () => prisma.city.findMany()),
    departments: await exportTable('departments', () => prisma.department.findMany()),
    roles: await exportTable('roles', () => prisma.role.findMany()),
    permissions: await exportTable('permissions', () => prisma.permission.findMany()),
    users: await exportTable('users', () => prisma.user.findMany()),
    teams: await exportTable('teams', () => prisma.team.findMany()),
    employees: await exportTable('employees', () => prisma.employee.findMany()),
    userRoles: await exportTable('userRoles', () => prisma.userRole.findMany()),
    rolePermissions: await exportTable('rolePermissions', () => prisma.rolePermission.findMany()),
    sessions: await exportTable('sessions', () => prisma.session.findMany()),
    emailVerificationTokens: await exportTable('emailVerificationTokens', () => prisma.emailVerificationToken.findMany()),
    passwordResetTokens: await exportTable('passwordResetTokens', () => prisma.passwordResetToken.findMany()),
  };

  // Save consolidated backup
  fs.writeFileSync(
    path.join(outputDir, 'complete-backup.json'),
    JSON.stringify(backupData, null, 2)
  );

  console.log(`✅ All data exported to ${outputDir}`);
  console.log(`📦 Full backup saved to ${path.join(outputDir, 'complete-backup.json')}`);

  // Generate seed script from backup
  try {
    await generateSeedFileFromBackup(backupData);
  } catch (error) {
    console.error(`❌ Error generating seed file:`, error);
  }

  return backupData;
}

// Run the backup
backupAll()
  .then(() => {
    console.log("🎉 Backup completed successfully!");
    prisma.$disconnect();
  })
  .catch(error => {
    console.error("❌ Error during backup:", error);
    prisma.$disconnect();
    process.exit(1);
  });
