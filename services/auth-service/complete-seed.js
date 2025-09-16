const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting auth-service database seeding...");

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
  const cities = await prisma.city.createMany({
    data: [
      {
        name: "Bangalore",
        displayName: "Bengaluru",
        code: "BLR",
        state: "Karnataka",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 12.9716,
        longitude: 77.5946,
        regionCode: "South",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 12000000,
        marketPotential: "High",
        launchDate: new Date("2023-01-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 1,
      },
      {
        name: "Mumbai",
        displayName: "Mumbai",
        code: "MUM",
        state: "Maharashtra",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 19.076,
        longitude: 72.8777,
        regionCode: "West",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 20000000,
        marketPotential: "High",
        launchDate: new Date("2023-02-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 2,
      },
      {
        name: "Delhi",
        displayName: "New Delhi",
        code: "DEL",
        state: "Delhi",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 28.7041,
        longitude: 77.1025,
        regionCode: "North",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 30000000,
        marketPotential: "High",
        launchDate: new Date("2023-03-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 3,
      },
      {
        name: "Chennai",
        displayName: "Chennai",
        code: "CHE",
        state: "Tamil Nadu",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 13.0827,
        longitude: 80.2707,
        regionCode: "South",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 10000000,
        marketPotential: "High",
        launchDate: new Date("2023-04-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 4,
      },
      {
        name: "Hyderabad",
        displayName: "Hyderabad",
        code: "HYD",
        state: "Telangana",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 17.385,
        longitude: 78.4867,
        regionCode: "South",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 8000000,
        marketPotential: "High",
        launchDate: new Date("2023-05-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 5,
      },
      {
        name: "Pune",
        displayName: "Pune",
        code: "PUN",
        state: "Maharashtra",
        country: "India",
        timezone: "Asia/Kolkata",
        latitude: 18.5204,
        longitude: 73.8567,
        regionCode: "West",
        isActive: true,
        isOperational: true,
        estimatedPopulation: 6000000,
        marketPotential: "High",
        launchDate: new Date("2023-06-01"),
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 6,
      },
    ],
  });
  console.log(`✅ Created ${cities.count} cities`);

  // 2. Create Departments
  console.log("🏢 Creating departments...");
  const techDept = await prisma.department.create({
    data: {
      name: "Technology",
      description: "Technology and Development Department",
      code: "TECH",
      isActive: true,
    },
  });

  const operationsDept = await prisma.department.create({
    data: {
      name: "Operations",
      description: "Operations and Service Management Department",
      code: "OPS",
      isActive: true,
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: "Human Resources",
      description: "Human Resources Department",
      code: "HR",
      isActive: true,
    },
  });

  const financesDept = await prisma.department.create({
    data: {
      name: "Finance",
      description: "Finance and Accounting Department",
      code: "FIN",
      isActive: true,
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      name: "Sales",
      description: "Sales and Business Development Department",
      code: "SALES",
      isActive: true,
    },
  });

  console.log("✅ Created departments");

  // 3. Create Roles
  console.log("👥 Creating roles...");
  const superAdminRole = await prisma.role.create({
    data: {
      name: "Super Admin",
      description: "Full system access - highest level administrator",
      level: 10,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Administrative access to most system features",
      level: 8,
      isActive: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "Manager",
      description: "Management level access to departmental features",
      level: 6,
      isActive: true,
    },
  });

  const operatorRole = await prisma.role.create({
    data: {
      name: "Operator",
      description: "Operational access to daily tasks",
      level: 4,
      isActive: true,
    },
  });

  const telecallerRole = await prisma.role.create({
    data: {
      name: "Telecaller",
      description: "Customer service and call center operations",
      level: 3,
      isActive: true,
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      name: "Viewer",
      description: "Read-only access to system data",
      level: 2,
      isActive: true,
    },
  });

  console.log("✅ Created roles");

  // 4. Create Permissions
  console.log("🔐 Creating permissions...");
  const permissions = [
    // Auth Service Permissions
    { service: "auth", resource: "user", action: "create" },
    { service: "auth", resource: "user", action: "read" },
    { service: "auth", resource: "user", action: "update" },
    { service: "auth", resource: "user", action: "delete" },
    { service: "auth", resource: "role", action: "create" },
    { service: "auth", resource: "role", action: "read" },
    { service: "auth", resource: "role", action: "update" },
    { service: "auth", resource: "role", action: "delete" },
    { service: "auth", resource: "permission", action: "create" },
    { service: "auth", resource: "permission", action: "read" },
    { service: "auth", resource: "permission", action: "update" },
    { service: "auth", resource: "permission", action: "delete" },
    { service: "auth", resource: "department", action: "create" },
    { service: "auth", resource: "department", action: "read" },
    { service: "auth", resource: "department", action: "update" },
    { service: "auth", resource: "department", action: "delete" },
    { service: "auth", resource: "team", action: "create" },
    { service: "auth", resource: "team", action: "read" },
    { service: "auth", resource: "team", action: "update" },
    { service: "auth", resource: "team", action: "delete" },
    { service: "auth", resource: "employee", action: "create" },
    { service: "auth", resource: "employee", action: "read" },
    { service: "auth", resource: "employee", action: "update" },
    { service: "auth", resource: "employee", action: "delete" },

    // Vehicle Service Permissions
    { service: "vehicle", resource: "vehicle", action: "create" },
    { service: "vehicle", resource: "vehicle", action: "read" },
    { service: "vehicle", resource: "vehicle", action: "update" },
    { service: "vehicle", resource: "vehicle", action: "delete" },
    { service: "vehicle", resource: "hub", action: "create" },
    { service: "vehicle", resource: "hub", action: "read" },
    { service: "vehicle", resource: "hub", action: "update" },
    { service: "vehicle", resource: "hub", action: "delete" },
    { service: "vehicle", resource: "model", action: "create" },
    { service: "vehicle", resource: "model", action: "read" },
    { service: "vehicle", resource: "model", action: "update" },
    { service: "vehicle", resource: "model", action: "delete" },
    { service: "vehicle", resource: "oem", action: "create" },
    { service: "vehicle", resource: "oem", action: "read" },
    { service: "vehicle", resource: "oem", action: "update" },
    { service: "vehicle", resource: "oem", action: "delete" },

    // Rider Service Permissions
    { service: "rider", resource: "rider", action: "create" },
    { service: "rider", resource: "rider", action: "read" },
    { service: "rider", resource: "rider", action: "update" },
    { service: "rider", resource: "rider", action: "delete" },
    { service: "rider", resource: "assignment", action: "create" },
    { service: "rider", resource: "assignment", action: "read" },
    { service: "rider", resource: "assignment", action: "update" },
    { service: "rider", resource: "assignment", action: "delete" },

    // Client Store Service Permissions
    { service: "client-store", resource: "client", action: "create" },
    { service: "client-store", resource: "client", action: "read" },
    { service: "client-store", resource: "client", action: "update" },
    { service: "client-store", resource: "client", action: "delete" },
    { service: "client-store", resource: "store", action: "create" },
    { service: "client-store", resource: "store", action: "read" },
    { service: "client-store", resource: "store", action: "update" },
    { service: "client-store", resource: "store", action: "delete" },

    // Spare Parts Service Permissions
    { service: "spare-parts", resource: "part", action: "create" },
    { service: "spare-parts", resource: "part", action: "read" },
    { service: "spare-parts", resource: "part", action: "update" },
    { service: "spare-parts", resource: "part", action: "delete" },
    { service: "spare-parts", resource: "category", action: "create" },
    { service: "spare-parts", resource: "category", action: "read" },
    { service: "spare-parts", resource: "category", action: "update" },
    { service: "spare-parts", resource: "category", action: "delete" },
    { service: "spare-parts", resource: "supplier", action: "create" },
    { service: "spare-parts", resource: "supplier", action: "read" },
    { service: "spare-parts", resource: "supplier", action: "update" },
    { service: "spare-parts", resource: "supplier", action: "delete" },
    { service: "spare-parts", resource: "inventory", action: "create" },
    { service: "spare-parts", resource: "inventory", action: "read" },
    { service: "spare-parts", resource: "inventory", action: "update" },
    { service: "spare-parts", resource: "inventory", action: "delete" },
    { service: "spare-parts", resource: "request", action: "create" },
    { service: "spare-parts", resource: "request", action: "read" },
    { service: "spare-parts", resource: "request", action: "update" },
    { service: "spare-parts", resource: "request", action: "delete" },

    // System Permissions
    { service: "system", resource: "dashboard", action: "read" },
    { service: "system", resource: "analytics", action: "read" },
    { service: "system", resource: "reports", action: "create" },
    { service: "system", resource: "reports", action: "read" },
    { service: "system", resource: "settings", action: "read" },
    { service: "system", resource: "settings", action: "update" },
    { service: "system", resource: "audit", action: "read" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map(async (perm) => {
      return prisma.permission.create({
        data: {
          name: `${perm.service}:${perm.resource}:${perm.action}`,
          description: `${
            perm.action.charAt(0).toUpperCase() + perm.action.slice(1)
          } ${perm.resource} in ${perm.service} service`,
          service: perm.service,
          resource: perm.resource,
          action: perm.action,
          isActive: true,
        },
      });
    })
  );

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // 5. Assign permissions to roles
  console.log("🔗 Assigning permissions to roles...");

  // Super Admin gets ALL permissions
  const allPermissions = createdPermissions.map((permission) => ({
    roleId: superAdminRole.id,
    permissionId: permission.id,
  }));
  await prisma.rolePermission.createMany({ data: allPermissions });

  // Admin gets most permissions (except some auth admin functions)
  const adminPermissions = createdPermissions
    .filter(
      (p) =>
        !(
          p.service === "auth" &&
          ["role", "permission", "department"].includes(p.resource) &&
          ["create", "delete"].includes(p.action)
        )
    )
    .map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    }));
  await prisma.rolePermission.createMany({ data: adminPermissions });

  // Manager gets read/update permissions
  const managerPermissions = createdPermissions
    .filter((p) => ["read", "update"].includes(p.action))
    .map((permission) => ({
      roleId: managerRole.id,
      permissionId: permission.id,
    }));
  await prisma.rolePermission.createMany({ data: managerPermissions });

  // Operator gets operational permissions
  const operatorPermissions = createdPermissions
    .filter(
      (p) =>
        (p.service !== "auth" || p.resource === "user") &&
        ["read", "update", "create"].includes(p.action) &&
        !["delete"].includes(p.action)
    )
    .map((permission) => ({
      roleId: operatorRole.id,
      permissionId: permission.id,
    }));
  await prisma.rolePermission.createMany({ data: operatorPermissions });

  // Telecaller gets limited permissions
  const telecallerPermissions = createdPermissions
    .filter(
      (p) =>
        ["read"].includes(p.action) ||
        (p.service === "client-store" &&
          ["read", "update"].includes(p.action)) ||
        (p.service === "rider" && ["read"].includes(p.action))
    )
    .map((permission) => ({
      roleId: telecallerRole.id,
      permissionId: permission.id,
    }));
  await prisma.rolePermission.createMany({ data: telecallerPermissions });

  // Viewer gets only read permissions
  const viewerPermissions = createdPermissions
    .filter((p) => p.action === "read")
    .map((permission) => ({
      roleId: viewerRole.id,
      permissionId: permission.id,
    }));
  await prisma.rolePermission.createMany({ data: viewerPermissions });

  console.log("✅ Assigned permissions to roles");

  // 6. Create Users
  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);
  const hashedDefaultPassword = await bcrypt.hash("Password123!", 12);

  // Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@ev91.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      phone: "+91-9999999999",
      isActive: true,
      emailVerified: true,
    },
  });

  // Regular Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@ev91.com",
      password: hashedDefaultPassword,
      firstName: "System",
      lastName: "Administrator",
      phone: "+91-9999999998",
      isActive: true,
      emailVerified: true,
    },
  });

  // Manager User
  const manager = await prisma.user.create({
    data: {
      email: "manager@ev91.com",
      password: hashedDefaultPassword,
      firstName: "Operations",
      lastName: "Manager",
      phone: "+91-9999999997",
      isActive: true,
      emailVerified: true,
    },
  });

  // Operator User
  const operator = await prisma.user.create({
    data: {
      email: "operator@ev91.com",
      password: hashedDefaultPassword,
      firstName: "System",
      lastName: "Operator",
      phone: "+91-9999999996",
      isActive: true,
      emailVerified: true,
    },
  });

  // Telecaller User
  const telecaller = await prisma.user.create({
    data: {
      email: "telecaller@ev91.com",
      password: hashedDefaultPassword,
      firstName: "Customer",
      lastName: "Service",
      phone: "+91-9999999995",
      isActive: true,
      emailVerified: true,
    },
  });

  // Test User
  const testUser = await prisma.user.create({
    data: {
      email: "test@ev91.com",
      password: hashedDefaultPassword,
      firstName: "Test",
      lastName: "User",
      phone: "+91-9999999994",
      isActive: true,
      emailVerified: true,
    },
  });

  console.log("✅ Created users");

  // 7. Create Teams
  console.log("👥 Creating teams...");
  const devTeam = await prisma.team.create({
    data: {
      name: "Development Team",
      description: "Software development and engineering team",
      departmentId: techDept.id,
      city: "Bangalore",
      state: "Karnataka",
      memberCount: 0,
      maxMembers: 20,
      skills: JSON.stringify([
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "PostgreSQL",
      ]),
      status: "Active",
    },
  });

  const opsTeam = await prisma.team.create({
    data: {
      name: "Operations Team",
      description: "Daily operations and service management team",
      departmentId: operationsDept.id,
      city: "Mumbai",
      state: "Maharashtra",
      memberCount: 0,
      maxMembers: 15,
      skills: JSON.stringify([
        "Customer Service",
        "Operations Management",
        "Process Optimization",
      ]),
      status: "Active",
    },
  });

  const salesTeam = await prisma.team.create({
    data: {
      name: "Sales Team",
      description: "Business development and client acquisition team",
      departmentId: salesDept.id,
      city: "Delhi",
      state: "Delhi",
      memberCount: 0,
      maxMembers: 12,
      skills: JSON.stringify([
        "Sales",
        "Business Development",
        "Client Relations",
      ]),
      status: "Active",
    },
  });

  console.log("✅ Created teams");

  // 8. Create Employees
  console.log("👷 Creating employees...");
  const superAdminEmployee = await prisma.employee.create({
    data: {
      userId: superAdmin.id,
      employeeId: "EMP001",
      position: "Super Administrator",
      departmentId: techDept.id,
      teamId: devTeam.id,
      hireDate: new Date("2023-01-01"),
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      userId: admin.id,
      employeeId: "EMP002",
      position: "System Administrator",
      departmentId: techDept.id,
      teamId: devTeam.id,
      managerId: superAdminEmployee.id,
      hireDate: new Date("2023-01-15"),
    },
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      userId: manager.id,
      employeeId: "EMP003",
      position: "Operations Manager",
      departmentId: operationsDept.id,
      teamId: opsTeam.id,
      managerId: superAdminEmployee.id,
      hireDate: new Date("2023-02-01"),
    },
  });

  const operatorEmployee = await prisma.employee.create({
    data: {
      userId: operator.id,
      employeeId: "EMP004",
      position: "System Operator",
      departmentId: operationsDept.id,
      teamId: opsTeam.id,
      managerId: managerEmployee.id,
      hireDate: new Date("2023-02-15"),
    },
  });

  const telecallerEmployee = await prisma.employee.create({
    data: {
      userId: telecaller.id,
      employeeId: "EMP005",
      position: "Customer Service Representative",
      departmentId: operationsDept.id,
      teamId: opsTeam.id,
      managerId: managerEmployee.id,
      hireDate: new Date("2023-03-01"),
    },
  });

  console.log("✅ Created employees");

  // 9. Assign roles to users
  console.log("🔐 Assigning roles to users...");
  await prisma.userRole.createMany({
    data: [
      { userId: superAdmin.id, roleId: superAdminRole.id, createdBy: "system" },
      { userId: admin.id, roleId: adminRole.id, createdBy: superAdmin.id },
      { userId: manager.id, roleId: managerRole.id, createdBy: superAdmin.id },
      {
        userId: operator.id,
        roleId: operatorRole.id,
        createdBy: superAdmin.id,
      },
      {
        userId: telecaller.id,
        roleId: telecallerRole.id,
        createdBy: superAdmin.id,
      },
      { userId: testUser.id, roleId: viewerRole.id, createdBy: superAdmin.id },
    ],
  });

  // Update team member counts and managers
  await prisma.team.update({
    where: { id: devTeam.id },
    data: {
      memberCount: 2,
      managerId: superAdminEmployee.id,
    },
  });

  await prisma.team.update({
    where: { id: opsTeam.id },
    data: {
      memberCount: 3,
      managerId: managerEmployee.id,
    },
  });

  await prisma.team.update({
    where: { id: salesTeam.id },
    data: {
      memberCount: 0,
    },
  });

  console.log("✅ Assigned roles to users");

  // Summary
  console.log("\n📊 Seeding Summary:");
  console.log("=".repeat(50));
  console.log(`🏙️ Cities: 6`);
  console.log(`🏢 Departments: 5`);
  console.log(`👥 Teams: 3`);
  console.log(`🔐 Roles: 6`);
  console.log(`📝 Permissions: ${createdPermissions.length}`);
  console.log(`👤 Users: 6`);
  console.log(`👷 Employees: 5`);

  console.log("\n👤 Default User Accounts:");
  console.log("=".repeat(50));
  console.log("🔥 Super Admin: superadmin@ev91.com | SuperAdmin123!");
  console.log("⚡ Admin: admin@ev91.com | Password123!");
  console.log("🎯 Manager: manager@ev91.com | Password123!");
  console.log("⚙️ Operator: operator@ev91.com | Password123!");
  console.log("📞 Telecaller: telecaller@ev91.com | Password123!");
  console.log("👁️ Test User: test@ev91.com | Password123!");

  console.log("\n🚀 Auth Service database seeded successfully!");
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
