import { PrismaClient } from "@prisma/client";
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
  const cities = await Promise.all([
    prisma.city.create({
      data: {
        id: "mumbai",
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
        estimatedPopulation: null,
        marketPotential: null,
        launchDate: null,
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 0,
        createdAt: new Date("2025-09-06T17:54:07.150Z"),
        updatedAt: new Date("2025-09-06T17:54:07.150Z")
      }
    }),
    prisma.city.create({
      data: {
        id: "delhi",
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
        estimatedPopulation: null,
        marketPotential: null,
        launchDate: null,
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 0,
        createdAt: new Date("2025-09-06T17:54:07.176Z"),
        updatedAt: new Date("2025-09-06T17:54:07.176Z")
      }
    }),
    prisma.city.create({
      data: {
        id: "bangalore",
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
        estimatedPopulation: null,
        marketPotential: null,
        launchDate: null,
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 0,
        createdAt: new Date("2025-09-06T17:54:07.179Z"),
        updatedAt: new Date("2025-09-06T17:54:07.179Z")
      }
    }),
    prisma.city.create({
      data: {
        id: "hyderabad",
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
        estimatedPopulation: null,
        marketPotential: null,
        launchDate: null,
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 0,
        createdAt: new Date("2025-09-06T17:54:07.182Z"),
        updatedAt: new Date("2025-09-06T17:54:07.182Z")
      }
    }),
    prisma.city.create({
      data: {
        id: "chennai",
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
        estimatedPopulation: null,
        marketPotential: null,
        launchDate: null,
        version: 1,
        lastModifiedBy: "system",
        eventSequence: 0,
        createdAt: new Date("2025-09-06T17:54:07.186Z"),
        updatedAt: new Date("2025-09-06T17:54:07.186Z")
      }
    })
  ]);
  console.log(`✅ Created ${cities.length} cities`);

  // 2. Create Departments
  console.log("🏢 Creating departments...");
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        id: "cmf888qc400bej4cs6iubxubp",
        name: "Information Technology",
        description: "Technology and system administration",
        code: "IT",
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.868Z"),
        updatedAt: new Date("2025-09-06T12:15:18.868Z")
      }
    }),
    prisma.department.create({
      data: {
        id: "cmf888qc600bfj4cszjngn4l4",
        name: "Human Resources",
        description: "Human resources management",
        code: "HR",
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.870Z"),
        updatedAt: new Date("2025-09-06T12:15:18.870Z")
      }
    }),
    prisma.department.create({
      data: {
        id: "cmf888qc600bgj4cslp60n41o",
        name: "Operations",
        description: "Daily operations and fleet management",
        code: "OPS",
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.871Z"),
        updatedAt: new Date("2025-09-06T12:15:18.871Z")
      }
    })
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // 3. Create Roles
  console.log("👥 Creating roles...");
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        id: "cmf888q87001kj4cso4azopay",
        name: "Super Admin",
        description: "Full system access with all permissions",
        level: 10,
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.728Z"),
        updatedAt: new Date("2025-09-06T12:15:18.728Z")
      }
    }),
    prisma.role.create({
      data: {
        id: "cmf888q8b001lj4cs6mp3bx9b",
        name: "Admin",
        description: "Administrative access to most features",
        level: 8,
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.731Z"),
        updatedAt: new Date("2025-09-06T12:15:18.731Z")
      }
    }),
    prisma.role.create({
      data: {
        id: "cmf888q8c001mj4cswjx4di2a",
        name: "Manager",
        description: "Team management and operational oversight",
        level: 6,
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.732Z"),
        updatedAt: new Date("2025-09-06T12:15:18.732Z")
      }
    })
  ]);
  console.log(`✅ Created ${roles.length} roles`);

  // 4. Create Permissions
  console.log("🔐 Creating permissions...");
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        id: "cmfb08t870000j4u49ax7wihx",
        name: "client-store:clients:create",
        description: "Create new clients",
        service: "client-store-service",
        resource: "clients",
        action: "create",
        isActive: true,
        createdAt: new Date("2025-09-08T10:54:44.214Z"),
        updatedAt: new Date("2025-09-08T10:54:44.214Z")
      }
    }),
    prisma.permission.create({
      data: {
        id: "cmfb08t8g0001j4u4wmf5buch",
        name: "client-store:clients:read",
        description: "Read client information",
        service: "client-store-service",
        resource: "clients",
        action: "read",
        isActive: true,
        createdAt: new Date("2025-09-08T10:54:44.225Z"),
        updatedAt: new Date("2025-09-08T10:54:44.225Z")
      }
    }),
    prisma.permission.create({
      data: {
        id: "cmfb08t8i0002j4u41ebl9tno",
        name: "client-store:clients:update",
        description: "Update client information",
        service: "client-store-service",
        resource: "clients",
        action: "update",
        isActive: true,
        createdAt: new Date("2025-09-08T10:54:44.227Z"),
        updatedAt: new Date("2025-09-08T10:54:44.227Z")
      }
    })
  ]);
  console.log(`✅ Created ${permissions.length} permissions`);

  // 5. Create Users
  console.log("👤 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "cmf888qa1006zj4cs7kw6hcmt",
        email: "admin@ev91.com",
        password: "$2a$12$Zls1M4Yn3v0QiIHC8CgeK.yRjOTbITDsMSzpYtPzElopcDxcFczwG", // Password123!
        firstName: "Admin",
        lastName: "User",
        phone: "+919876543210",
        isActive: true,
        emailVerified: true,
        createdAt: new Date("2025-09-06T12:15:18.789Z"),
        updatedAt: new Date("2025-09-06T12:15:18.789Z")
      }
    }),
    prisma.user.create({
      data: {
        id: "cmf888qab0070j4cscfl0ru0d",
        email: "superadmin@ev91.com",
        password: "$2a$12$Zls1M4Yn3v0QiIHC8CgeK.yRjOTbITDsMSzpYtPzElopcDxcFczwG", // Password123!
        firstName: "Super",
        lastName: "Admin",
        phone: "+919876543200",
        isActive: true,
        emailVerified: true,
        createdAt: new Date("2025-09-06T12:15:18.801Z"),
        updatedAt: new Date("2025-09-06T12:15:18.801Z")
      }
    })
  ]);
  console.log(`✅ Created ${users.length} users`);

  // 6. Create Teams
  console.log("👥 Creating teams...");
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        id: "cmf888qbe0074j4csvaql03rz",
        name: "IT Operations",
        description: "Infrastructure management team",
        departmentId: "cmf888qc400bej4cs6iubxubp", // IT department
        city: "Mumbai",
        state: "Maharashtra",
        memberCount: 3,
        maxMembers: 10,
        skills: JSON.stringify(["Network", "Cloud", "Linux", "Windows"]),
        status: "Active",
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.813Z"),
        updatedAt: new Date("2025-09-06T12:15:18.813Z")
      }
    }),
    prisma.team.create({
      data: {
        id: "cmf888qbi0075j4csigzkjbpx",
        name: "Development",
        description: "Software development team",
        departmentId: "cmf888qc400bej4cs6iubxubp", // IT department
        city: "Bangalore",
        state: "Karnataka",
        memberCount: 5,
        maxMembers: 15,
        skills: JSON.stringify(["JavaScript", "TypeScript", "React", "Node.js"]),
        status: "Active",
        isActive: true,
        createdAt: new Date("2025-09-06T12:15:18.817Z"),
        updatedAt: new Date("2025-09-06T12:15:18.817Z")
      }
    })
  ]);
  console.log(`✅ Created ${teams.length} teams`);

  // 7. Create Employees
  console.log("👷 Creating employees...");
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        id: "cmf888qbp0077j4csjjmyv4q3",
        userId: "cmf888qa1006zj4cs7kw6hcmt", // admin user
        employeeId: "EMP001",
        position: "IT Administrator",
        departmentId: "cmf888qc400bej4cs6iubxubp", // IT department
        teamId: "cmf888qbe0074j4csvaql03rz", // IT Operations team
        hireDate: new Date("2025-01-01"),
        createdAt: new Date("2025-09-06T12:15:18.826Z"),
        updatedAt: new Date("2025-09-06T12:15:18.826Z")
      }
    }),
    prisma.employee.create({
      data: {
        id: "cmf888qbs0078j4csdco53s1c",
        userId: "cmf888qab0070j4cscfl0ru0d", // superadmin user
        employeeId: "EMP002",
        position: "CTO",
        departmentId: "cmf888qc400bej4cs6iubxubp", // IT department
        teamId: "cmf888qbi0075j4csigzkjbpx", // Development team
        hireDate: new Date("2024-01-01"),
        createdAt: new Date("2025-09-06T12:15:18.829Z"),
        updatedAt: new Date("2025-09-06T12:15:18.829Z")
      }
    })
  ]);
  console.log(`✅ Created ${employees.length} employees`);

  // 8. Assign roles to users
  console.log("🔐 Assigning roles to users...");
  await prisma.userRole.createMany({
    data: [
      {
        userId: "cmf888qab0070j4cscfl0ru0d", // superadmin user
        roleId: "cmf888q87001kj4cso4azopay", // Super Admin role
        createdBy: "system",
        createdAt: new Date("2025-09-06T12:15:18.850Z")
      },
      {
        userId: "cmf888qa1006zj4cs7kw6hcmt", // admin user
        roleId: "cmf888q8b001lj4cs6mp3bx9b", // Admin role
        createdBy: "cmf888qab0070j4cscfl0ru0d", // superadmin user
        createdAt: new Date("2025-09-06T12:15:18.851Z")
      }
    ]
  });
  console.log("✅ Assigned roles to users");

  // 9. Assign permissions to roles
  console.log("🔗 Assigning permissions to roles...");
  await prisma.rolePermission.createMany({
    data: [
      {
        id: "rp-001", // Generate unique IDs for role permissions
        roleId: "cmf888q87001kj4cso4azopay", // Super Admin role
        permissionId: "cmfb08t870000j4u49ax7wihx" // client-store:clients:create
      },
      {
        id: "rp-002",
        roleId: "cmf888q87001kj4cso4azopay", // Super Admin role
        permissionId: "cmfb08t8g0001j4u4wmf5buch" // client-store:clients:read
      },
      {
        id: "rp-003",
        roleId: "cmf888q87001kj4cso4azopay", // Super Admin role
        permissionId: "cmfb08t8i0002j4u41ebl9tno" // client-store:clients:update
      }
    ]
  });
  console.log("✅ Assigned permissions to roles");

  console.log("\n🚀 Auth Service database seeded successfully with extracted data!");
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