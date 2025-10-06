import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/**
 * Modified seed script to handle teams with foreign key constraints
 */
async function main() {
  try {
    console.log(
      "🌱 Starting auth-service database seeding with modified order..."
    );

    // Get the backup directory path
    const backupDir = path.join(__dirname, "backup");

    // Load the data from backup files
    const citiesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "cities-seed.json"), "utf8")
    );
    const departmentsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "departments-seed.json"), "utf8")
    );
    const rolesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "roles-seed.json"), "utf8")
    );
    const permissionsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "permissions-seed.json"), "utf8")
    );
    const usersData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "users-seed.json"), "utf8")
    );
    const teamsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "teams-seed.json"), "utf8")
    );
    const employeesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "employees-seed.json"), "utf8")
    );
    const rolePermissionsData = JSON.parse(
      fs.readFileSync(
        path.join(backupDir, "role-permissions-seed.json"),
        "utf8"
      )
    );
    const userRolesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "user-roles-seed.json"), "utf8")
    );

    // Clean existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.$transaction([
      prisma.userRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.employee.deleteMany(),
      prisma.team.deleteMany(),
      prisma.user.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.department.deleteMany(),
      prisma.city.deleteMany(),
    ]);

    // 1. Create Cities
    console.log("🏙️ Creating cities...");
    for (const city of citiesData) {
      await prisma.city.create({
        data: {
          id: city.id,
          name: city.name,
          state: city.state,
          country: city.country,
          isActive: city.isActive,
          createdAt: new Date(city.createdAt),
          updatedAt: new Date(city.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${citiesData.length} cities`);

    // 2. Create Departments
    console.log("🏢 Creating departments...");
    for (const dept of departmentsData) {
      await prisma.department.create({
        data: {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          isActive: dept.isActive,
          createdAt: new Date(dept.createdAt),
          updatedAt: new Date(dept.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${departmentsData.length} departments`);

    // 3. Create Roles
    console.log("👥 Creating roles...");
    for (const role of rolesData) {
      await prisma.role.create({
        data: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          isSystem: role.isSystem,
          createdAt: new Date(role.createdAt),
          updatedAt: new Date(role.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${rolesData.length} roles`);

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
          isSystem: permission.isSystem,
          createdAt: new Date(permission.createdAt),
          updatedAt: new Date(permission.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${permissionsData.length} permissions`);

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
          isVerified: user.isVerified,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${usersData.length} users`);

    // 6. Create Teams without manager IDs first
    console.log("👥 Creating teams without manager IDs...");
    for (const team of teamsData) {
      await prisma.team.create({
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          departmentId: team.departmentId,
          // Temporarily set managerId to null to avoid foreign key constraint
          managerId: null,
          isActive: team.isActive,
          city: team.city,
          state: team.state,
          memberCount: team.memberCount,
          maxMembers: team.maxMembers,
          skills: team.skills,
          status: team.status,
          createdAt: new Date(team.createdAt),
          updatedAt: new Date(team.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${teamsData.length} teams (without manager IDs)`);

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
          // Set managerId to null temporarily if needed
          managerId: employee.managerId,
          hireDate: new Date(employee.hireDate),
          createdAt: new Date(employee.createdAt),
          updatedAt: new Date(employee.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${employeesData.length} employees`);

    // 8. Now update teams with manager IDs
    console.log("🔄 Updating teams with manager IDs...");
    let updatedCount = 0;
    for (const team of teamsData) {
      if (team.managerId) {
        // Check if the manager exists
        const managerExists = await prisma.user.findUnique({
          where: { id: team.managerId },
        });

        if (managerExists) {
          await prisma.team.update({
            where: { id: team.id },
            data: { managerId: team.managerId },
          });
          updatedCount++;
        } else {
          console.log(
            `⚠️ Manager ID ${team.managerId} not found for team ${team.name}. Keeping managerId as null.`
          );
        }
      }
    }
    console.log(`✅ Updated ${updatedCount} teams with manager IDs`);

    // 9. Create Role Permissions
    console.log("🔐 Creating role permissions...");
    for (const rp of rolePermissionsData) {
      await prisma.rolePermission.create({
        data: {
          id: rp.id,
          roleId: rp.roleId,
          permissionId: rp.permissionId,
          createdAt: new Date(rp.createdAt),
          updatedAt: new Date(rp.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${rolePermissionsData.length} role permissions`);

    // 10. Create User Roles
    console.log("👤 Creating user roles...");
    for (const ur of userRolesData) {
      await prisma.userRole.create({
        data: {
          id: ur.id,
          userId: ur.userId,
          roleId: ur.roleId,
          createdAt: new Date(ur.createdAt),
          updatedAt: new Date(ur.updatedAt),
        },
      });
    }
    console.log(`✅ Created ${userRolesData.length} user roles`);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
