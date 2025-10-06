import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function extractData() {
  console.log("🔍 Starting data extraction from auth service database...");

  try {
    // Extract Cities
    console.log("🏙️ Extracting cities...");
    const cities = await prisma.city.findMany();

    // Extract Departments
    console.log("🏢 Extracting departments...");
    const departments = await prisma.department.findMany();

    // Extract Roles
    console.log("👥 Extracting roles...");
    const roles = await prisma.role.findMany();

    // Extract Permissions
    console.log("🔐 Extracting permissions...");
    const permissions = await prisma.permission.findMany();

    // Extract Role Permissions
    console.log("🔗 Extracting role permissions...");
    const rolePermissions = await prisma.rolePermission.findMany();

    // Extract Users
    console.log("👤 Extracting users...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true, // Note: This will extract hashed passwords
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Extract Teams
    console.log("👥 Extracting teams...");
    const teams = await prisma.team.findMany();

    // Extract Employees
    console.log("👷 Extracting employees...");
    const employees = await prisma.employee.findMany();

    // Extract User Roles
    console.log("🔐 Extracting user roles...");
    const userRoles = await prisma.userRole.findMany();

    // Create data object with all extracted data
    const extractedData = {
      cities,
      departments,
      roles,
      permissions,
      rolePermissions,
      users,
      teams,
      employees,
      userRoles,
    };

    // Write data to JSON file for inspection
    fs.writeFileSync(
      "extracted-auth-data.json",
      JSON.stringify(extractedData, null, 2)
    );

    // Generate seed.ts file
    generateSeedFile(extractedData);

    console.log("✅ Data extraction complete!");
    console.log("📄 Extracted data saved to extracted-auth-data.json");
    console.log("🌱 Generated seed file saved to generated-seed.ts");
  } catch (error) {
    console.error("❌ Error during data extraction:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSeedFile(data: any) {
  let seedFileContent = `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting auth-service database seeding with extracted data...");

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

  // 1. Create Cities
  console.log("🏙️ Creating cities...");
  const cities = await Promise.all(${generateCitiesCode(data.cities)});
  console.log(\`✅ Created \${cities.length} cities\`);

  // 2. Create Departments
  console.log("🏢 Creating departments...");
  const departments = await Promise.all(${generateDepartmentsCode(
    data.departments
  )});
  console.log(\`✅ Created \${departments.length} departments\`);

  // 3. Create Roles
  console.log("👥 Creating roles...");
  const roles = await Promise.all(${generateRolesCode(data.roles)});
  console.log(\`✅ Created \${roles.length} roles\`);

  // 4. Create Permissions
  console.log("🔐 Creating permissions...");
  const permissions = await Promise.all(${generatePermissionsCode(
    data.permissions
  )});
  console.log(\`✅ Created \${permissions.length} permissions\`);

  // 5. Create Users (with existing hashed passwords)
  console.log("👤 Creating users...");
  const users = await Promise.all(${generateUsersCode(data.users)});
  console.log(\`✅ Created \${users.length} users\`);

  // 6. Create Teams
  console.log("👥 Creating teams...");
  const teams = await Promise.all(${generateTeamsCode(
    data.teams,
    "departments"
  )});
  console.log(\`✅ Created \${teams.length} teams\`);

  // 7. Create Employees
  console.log("👷 Creating employees...");
  const employees = await Promise.all(${generateEmployeesCode(
    data.employees,
    "users",
    "departments",
    "teams"
  )});
  console.log(\`✅ Created \${employees.length} employees\`);

  // 8. Assign roles to users
  console.log("🔐 Assigning roles to users...");
  await prisma.userRole.createMany({
    data: ${generateUserRolesCode(data.userRoles, "users", "roles")}
  });
  console.log("✅ Assigned roles to users");

  // 9. Assign permissions to roles
  console.log("🔗 Assigning permissions to roles...");
  await prisma.rolePermission.createMany({
    data: ${generateRolePermissionsCode(
      data.rolePermissions,
      "roles",
      "permissions"
    )}
  });
  console.log("✅ Assigned permissions to roles");

  console.log("\\n🚀 Auth Service database seeded successfully with extracted data!");
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

  fs.writeFileSync("generated-seed.ts", seedFileContent);
}

// Helper functions to generate code sections
function safeString(str: any): string {
  if (str === null || str === undefined) return "null";
  if (typeof str === "string") {
    // Escape quotes and replace newlines
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  return `"${str}"`;
}

function safeNumber(num: any): string {
  if (num === null || num === undefined) return "null";
  return num.toString();
}

function safeBoolean(bool: any): string {
  if (bool === null || bool === undefined) return "false";
  return bool.toString();
}

function safeDateString(dateStr: any): string {
  if (!dateStr) return "null";
  try {
    return `new Date("${new Date(dateStr).toISOString()}")`;
  } catch (e) {
    console.warn(`Invalid date encountered: ${dateStr}`);
    return "null";
  }
}

function generateCitiesCode(cities: any[]) {
  return JSON.stringify(
    cities.map((city) => {
      return `prisma.city.create({
      data: {
        id: ${safeString(city.id)},
        name: ${safeString(city.name)},
        displayName: ${safeString(city.displayName)},
        code: ${safeString(city.code)},
        state: ${safeString(city.state)},
        country: ${safeString(city.country)},
        timezone: ${safeString(city.timezone)},
        latitude: ${safeNumber(city.latitude)},
        longitude: ${safeNumber(city.longitude)},
        regionCode: ${safeString(city.regionCode)},
        isActive: ${safeBoolean(city.isActive)},
        isOperational: ${safeBoolean(city.isOperational)},
        estimatedPopulation: ${safeNumber(city.estimatedPopulation)},
        marketPotential: ${safeString(city.marketPotential)},
        launchDate: ${safeDateString(city.launchDate)},
        version: ${safeNumber(city.version)},
        lastModifiedBy: ${safeString(city.lastModifiedBy)},
        eventSequence: ${safeNumber(city.eventSequence)},
        createdAt: ${safeDateString(city.createdAt)},
        updatedAt: ${safeDateString(city.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generateDepartmentsCode(departments: any[]) {
  return JSON.stringify(
    departments.map((dept) => {
      return `prisma.department.create({
      data: {
        id: ${safeString(dept.id)},
        name: ${safeString(dept.name)},
        description: ${
          dept.description ? safeString(dept.description) : "null"
        },
        code: ${dept.code ? safeString(dept.code) : "null"},
        isActive: ${safeBoolean(dept.isActive)},
        ${dept.parentId ? `parentId: ${safeString(dept.parentId)},` : ""}
        createdAt: ${safeDateString(dept.createdAt)},
        updatedAt: ${safeDateString(dept.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generateRolesCode(roles: any[]) {
  return JSON.stringify(
    roles.map((role) => {
      return `prisma.role.create({
      data: {
        id: ${safeString(role.id)},
        name: ${safeString(role.name)},
        description: ${
          role.description ? safeString(role.description) : "null"
        },
        level: ${safeNumber(role.level)},
        isActive: ${safeBoolean(role.isActive)},
        createdAt: ${safeDateString(role.createdAt)},
        updatedAt: ${safeDateString(role.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generatePermissionsCode(permissions: any[]) {
  return JSON.stringify(
    permissions.map((perm) => {
      return `prisma.permission.create({
      data: {
        id: ${safeString(perm.id)},
        name: ${safeString(perm.name)},
        description: ${
          perm.description ? safeString(perm.description) : "null"
        },
        service: ${safeString(perm.service)},
        resource: ${safeString(perm.resource)},
        action: ${safeString(perm.action)},
        isActive: ${safeBoolean(perm.isActive)},
        createdAt: ${safeDateString(perm.createdAt)},
        updatedAt: ${safeDateString(perm.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generateUsersCode(users: any[]) {
  return JSON.stringify(
    users.map((user) => {
      return `prisma.user.create({
      data: {
        id: ${safeString(user.id)},
        email: ${safeString(user.email)},
        password: ${safeString(
          user.password
        )}, // Using existing hashed password
        firstName: ${safeString(user.firstName)},
        lastName: ${safeString(user.lastName)},
        phone: ${user.phone ? safeString(user.phone) : "null"},
        isActive: ${safeBoolean(user.isActive)},
        emailVerified: ${safeBoolean(user.emailVerified)},
        createdAt: ${safeDateString(user.createdAt)},
        updatedAt: ${safeDateString(user.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generateTeamsCode(teams: any[], departmentVar: string) {
  return JSON.stringify(
    teams.map((team) => {
      return `prisma.team.create({
      data: {
        id: ${safeString(team.id)},
        name: ${safeString(team.name)},
        description: ${
          team.description ? safeString(team.description) : "null"
        },
        departmentId: ${safeString(team.departmentId)},
        ${team.managerId ? `managerId: ${safeString(team.managerId)},` : ""}
        city: ${team.city ? safeString(team.city) : "null"},
        state: ${team.state ? safeString(team.state) : "null"},
        memberCount: ${safeNumber(team.memberCount || 0)},
        maxMembers: ${safeNumber(team.maxMembers || 0)},
        skills: ${team.skills ? safeString(team.skills) : "null"},
        status: ${team.status ? safeString(team.status) : "null"},
        isActive: ${safeBoolean(team.isActive)},
        createdAt: ${safeDateString(team.createdAt)},
        updatedAt: ${safeDateString(team.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function generateEmployeesCode(
  employees: any[],
  userVar: string,
  departmentVar: string,
  teamVar: string
) {
  return JSON.stringify(
    employees.map((emp) => {
      return `prisma.employee.create({
      data: {
        id: ${safeString(emp.id)},
        userId: ${safeString(emp.userId)},
        employeeId: ${safeString(emp.employeeId)},
        position: ${emp.position ? safeString(emp.position) : "null"},
        departmentId: ${safeString(emp.departmentId)},
        ${emp.teamId ? `teamId: ${safeString(emp.teamId)},` : ""}
        ${emp.managerId ? `managerId: ${safeString(emp.managerId)},` : ""}
        hireDate: ${safeDateString(emp.hireDate)},
        createdAt: ${safeDateString(emp.createdAt)},
        updatedAt: ${safeDateString(emp.updatedAt)}
      }
    })`;
    }),
    null,
    2
  )
    .replace(/"/g, "")
    .replace(/"null"/g, "null")
    .replace(/"true"/g, "true")
    .replace(/"false"/g, "false");
}

function safeDate(dateObj: any): string | null {
  if (!dateObj) return null;
  try {
    // Convert to ISO string safely, handling both Date objects and strings
    if (typeof dateObj === "string") {
      return new Date(dateObj).toISOString();
    } else if (dateObj instanceof Date) {
      return dateObj.toISOString();
    }
    return null;
  } catch (e) {
    console.warn(`Invalid date encountered: ${dateObj}`);
    return null;
  }
}

function generateUserRolesCode(
  userRoles: any[],
  userVar: string,
  roleVar: string
) {
  return JSON.stringify(
    userRoles.map((ur) => {
      return {
        userId: ur.userId,
        roleId: ur.roleId,
        createdBy: ur.createdBy || "system",
        // Handle date safely
        createdAt: ur.createdAt ? `new Date("${ur.createdAt}")` : "new Date()",
      };
    }),
    null,
    2
  ).replace(/"new Date\("(.+?)"\)"/g, 'new Date("$1")');
}

function generateRolePermissionsCode(
  rolePerms: any[],
  roleVar: string,
  permVar: string
) {
  return JSON.stringify(
    rolePerms.map((rp) => {
      return {
        roleId: rp.roleId,
        permissionId: rp.permissionId,
        // Handle date safely
        createdAt: rp.createdAt ? `new Date("${rp.createdAt}")` : "new Date()",
      };
    }),
    null,
    2
  ).replace(/"new Date\("(.+?)"\)"/g, 'new Date("$1")');
}

extractData().catch(console.error);
