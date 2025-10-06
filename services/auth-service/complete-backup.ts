import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const outputDir = path.join(__dirname, "backup");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Export a single table to a JSON file
 */
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

/**
 * Generate a seed file from the backup data
 */
async function generateSeedFile(backupData: Record<string, any[]>) {
  // Build sections of the seed file content
  const importSection = `import { PrismaClient } from "@prisma/client";

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

`;

  // Prepare data declarations
  let dataSection = "";
  for (const tableName of Object.keys(backupData)) {
    dataSection += `  // Load ${tableName} data\n`;
    dataSection += `  const ${tableName}Data = ${JSON.stringify(
      backupData[tableName],
      null,
      2
    )};\n\n`;
  }

  // Build create sections
  let createSection = "";

  // Cities
  if (backupData.cities && backupData.cities.length > 0) {
    createSection += `
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
        lastSyncAt: city.lastSyncAt ? new Date(city.lastSyncAt) : null,
        createdAt: new Date(city.createdAt),
        updatedAt: new Date(city.updatedAt)
      }
    });
  }
  console.log("✅ Created " + citiesData.length + " cities");
`;
  }

  // Departments
  if (backupData.departments && backupData.departments.length > 0) {
    createSection += `
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
  console.log("✅ Created " + departmentsData.length + " departments");
`;
  }

  // Roles
  if (backupData.roles && backupData.roles.length > 0) {
    createSection += `
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
  console.log("✅ Created " + rolesData.length + " roles");
`;
  }

  // Permissions
  if (backupData.permissions && backupData.permissions.length > 0) {
    createSection += `
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
  console.log("✅ Created " + permissionsData.length + " permissions");
`;
  }

  // Users
  if (backupData.users && backupData.users.length > 0) {
    createSection += `
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
  console.log("✅ Created " + usersData.length + " users");
`;
  }

  // Teams
  if (backupData.teams && backupData.teams.length > 0) {
    createSection += `
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
  console.log("✅ Created " + teamsData.length + " teams");
`;
  }

  // Employees
  if (backupData.employees && backupData.employees.length > 0) {
    createSection += `
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
  console.log("✅ Created " + employeesData.length + " employees");
`;
  }

  // User Roles
  if (backupData.userRoles && backupData.userRoles.length > 0) {
    createSection += `
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
  console.log("✅ Created " + userRolesData.length + " user roles");
`;
  }

  // Role Permissions
  if (backupData.rolePermissions && backupData.rolePermissions.length > 0) {
    createSection += `
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
  console.log("✅ Created " + rolePermissionsData.length + " role permissions");
`;
  }

  // Sessions
  if (backupData.sessions && backupData.sessions.length > 0) {
    createSection += `
  // 10. Create Sessions
  console.log("🔑 Creating sessions...");
  for (const session of sessionsData) {
    await prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        token: session.token,
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }
    });
  }
  console.log("✅ Created " + sessionsData.length + " sessions");
`;
  }

  // Email Verification Tokens
  if (
    backupData.emailVerificationTokens &&
    backupData.emailVerificationTokens.length > 0
  ) {
    createSection += `
  // 11. Create Email Verification Tokens
  console.log("✉️ Creating email verification tokens...");
  for (const token of emailVerificationTokensData) {
    await prisma.emailVerificationToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        token: token.token,
        expiresAt: new Date(token.expiresAt),
        createdAt: new Date(token.createdAt),
        updatedAt: new Date(token.updatedAt)
      }
    });
  }
  console.log("✅ Created " + emailVerificationTokensData.length + " email verification tokens");
`;
  }

  // Password Reset Tokens
  if (
    backupData.passwordResetTokens &&
    backupData.passwordResetTokens.length > 0
  ) {
    createSection += `
  // 12. Create Password Reset Tokens
  console.log("🔄 Creating password reset tokens...");
  for (const token of passwordResetTokensData) {
    await prisma.passwordResetToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        token: token.token,
        expiresAt: new Date(token.expiresAt),
        createdAt: new Date(token.createdAt),
        updatedAt: new Date(token.updatedAt)
      }
    });
  }
  console.log("✅ Created " + passwordResetTokensData.length + " password reset tokens");
`;
  }

  // Conclusion section
  const conclusionSection = `
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
  });
`;

  // Combine all sections
  const seedFileContent =
    importSection + dataSection + createSection + conclusionSection;

  // Write the seed file
  fs.writeFileSync(path.join(outputDir, "complete-seed.ts"), seedFileContent);

  console.log(
    `🌱 Generated complete seed file at ${path.join(
      outputDir,
      "complete-seed.ts"
    )}`
  );
}

/**
 * Main function to backup all data from the database
 */
async function backupAllData() {
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
  const backupData: Record<string, any[]> = {
    cities: await exportTable("cities", () => prisma.city.findMany()),
    departments: await exportTable("departments", () =>
      prisma.department.findMany()
    ),
    roles: await exportTable("roles", () => prisma.role.findMany()),
    permissions: await exportTable("permissions", () =>
      prisma.permission.findMany()
    ),
    users: await exportTable("users", () => prisma.user.findMany()),
    teams: await exportTable("teams", () => prisma.team.findMany()),
    employees: await exportTable("employees", () => prisma.employee.findMany()),
    userRoles: await exportTable("userRoles", () => prisma.userRole.findMany()),
    rolePermissions: await exportTable("rolePermissions", () =>
      prisma.rolePermission.findMany()
    ),
    sessions: await exportTable("sessions", () => prisma.session.findMany()),
    emailVerificationTokens: await exportTable("emailVerificationTokens", () =>
      prisma.emailVerificationToken.findMany()
    ),
    passwordResetTokens: await exportTable("passwordResetTokens", () =>
      prisma.passwordResetToken.findMany()
    ),
  };

  // Save consolidated backup
  fs.writeFileSync(
    path.join(outputDir, "complete-backup.json"),
    JSON.stringify(backupData, null, 2)
  );

  console.log(`✅ All data exported to ${outputDir}`);
  console.log(
    `📦 Full backup saved to ${path.join(outputDir, "complete-backup.json")}`
  );

  // Generate seed script from backup
  try {
    await generateSeedFile(backupData);
  } catch (error) {
    console.error(`❌ Error generating seed file:`, error);
  }

  return backupData;
}

// Run the backup
backupAllData()
  .then(() => {
    console.log("🎉 Backup completed successfully!");
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error("❌ Error during backup:", error);
    prisma.$disconnect();
    process.exit(1);
  });
