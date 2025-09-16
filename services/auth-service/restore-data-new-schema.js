const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function restoreDataWithNewSchema() {
  console.log("🔄 RESTORING DATA WITH NEW SCHEMA\n");

  try {
    // Read the backup
    const backup = JSON.parse(
      fs.readFileSync("schema-migration-backup.json", "utf8")
    );
    console.log(`📦 Backup loaded from: ${backup.timestamp}`);
    console.log(`   Users in backup: ${backup.users.length}`);
    console.log(`   Employees in backup: ${backup.employees.length}\n`);

    // Step 1: Recreate roles first
    console.log("👑 1. Creating roles...");

    const superAdminRole = await prisma.role.create({
      data: {
        name: "Super Admin",
        description: "Full system access",
        level: 10,
        isActive: true,
      },
    });

    const adminRole = await prisma.role.create({
      data: {
        name: "Admin",
        description: "Administrative access",
        level: 5,
        isActive: true,
      },
    });

    const userRole = await prisma.role.create({
      data: {
        name: "User",
        description: "Basic user access",
        level: 1,
        isActive: true,
      },
    });

    console.log("✅ Roles created\n");

    // Step 2: Create permissions
    console.log("🔑 2. Creating permissions...");

    const permissions = [
      // Auth permissions
      {
        name: "auth:users:create",
        service: "auth",
        resource: "users",
        action: "create",
      },
      {
        name: "auth:users:read",
        service: "auth",
        resource: "users",
        action: "read",
      },
      {
        name: "auth:users:update",
        service: "auth",
        resource: "users",
        action: "update",
      },
      {
        name: "auth:users:delete",
        service: "auth",
        resource: "users",
        action: "delete",
      },
      {
        name: "auth:roles:create",
        service: "auth",
        resource: "roles",
        action: "create",
      },
      {
        name: "auth:roles:read",
        service: "auth",
        resource: "roles",
        action: "read",
      },
      {
        name: "auth:roles:update",
        service: "auth",
        resource: "roles",
        action: "update",
      },
      {
        name: "auth:roles:delete",
        service: "auth",
        resource: "roles",
        action: "delete",
      },
      {
        name: "auth:permissions:create",
        service: "auth",
        resource: "permissions",
        action: "create",
      },
      {
        name: "auth:permissions:read",
        service: "auth",
        resource: "permissions",
        action: "read",
      },
      {
        name: "auth:permissions:update",
        service: "auth",
        resource: "permissions",
        action: "update",
      },
      {
        name: "auth:permissions:delete",
        service: "auth",
        resource: "permissions",
        action: "delete",
      },
      {
        name: "auth:teams:create",
        service: "auth",
        resource: "teams",
        action: "create",
      },
      {
        name: "auth:teams:read",
        service: "auth",
        resource: "teams",
        action: "read",
      },
      {
        name: "auth:teams:update",
        service: "auth",
        resource: "teams",
        action: "update",
      },
      {
        name: "auth:teams:delete",
        service: "auth",
        resource: "teams",
        action: "delete",
      },
      {
        name: "auth:departments:create",
        service: "auth",
        resource: "departments",
        action: "create",
      },
      {
        name: "auth:departments:read",
        service: "auth",
        resource: "departments",
        action: "read",
      },
      {
        name: "auth:departments:update",
        service: "auth",
        resource: "departments",
        action: "update",
      },
      {
        name: "auth:departments:delete",
        service: "auth",
        resource: "departments",
        action: "delete",
      },
      {
        name: "auth:employees:create",
        service: "auth",
        resource: "employees",
        action: "create",
      },
      {
        name: "auth:employees:read",
        service: "auth",
        resource: "employees",
        action: "read",
      },
      {
        name: "auth:employees:update",
        service: "auth",
        resource: "employees",
        action: "update",
      },
      {
        name: "auth:employees:delete",
        service: "auth",
        resource: "employees",
        action: "delete",
      },
      // Super admin permission
      {
        name: "admin:full",
        service: "admin",
        resource: "admin",
        action: "full",
      },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const permission = await prisma.permission.create({
        data: {
          ...perm,
          description: `${perm.action} access to ${perm.resource}`,
          isActive: true,
        },
      });
      createdPermissions.push(permission);
    }

    console.log(`✅ ${createdPermissions.length} permissions created\n`);

    // Step 3: Assign all permissions to Super Admin role
    console.log("🔗 3. Assigning permissions to roles...");

    for (const permission of createdPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    console.log("✅ Permissions assigned to Super Admin\n");

    // Step 4: Create departments
    console.log("🏬 4. Creating departments...");

    const adminDept = await prisma.department.create({
      data: {
        name: "Administration",
        code: "ADMIN",
        description: "Administrative Department",
        isActive: true,
      },
    });

    const itDept = await prisma.department.create({
      data: {
        name: "Information Technology",
        code: "IT",
        description: "IT Department",
        isActive: true,
      },
    });

    console.log("✅ Departments created\n");

    // Step 5: Create teams
    console.log("👥 5. Creating teams...");

    const adminTeam = await prisma.team.create({
      data: {
        name: "Admin Team",
        description: "Administrative Team",
        departmentId: adminDept.id,
        isActive: true,
      },
    });

    const itTeam = await prisma.team.create({
      data: {
        name: "IT Team",
        description: "IT Support Team",
        departmentId: itDept.id,
        isActive: true,
      },
    });

    console.log("✅ Teams created\n");

    // Step 6: Recreate users from backup (with updated schema)
    console.log("👤 6. Recreating users...");

    for (const backupUser of backup.users) {
      console.log(
        `   Creating user: ${backupUser.firstName} ${backupUser.lastName}`
      );

      const user = await prisma.user.create({
        data: {
          email: backupUser.email,
          firstName: backupUser.firstName,
          lastName: backupUser.lastName,
          password: backupUser.password, // Keep existing hashed password
          isActive: backupUser.isActive,
          emailVerified: backupUser.emailVerified,
          lastLoginAt: backupUser.lastLoginAt,
          createdAt: backupUser.createdAt,
        },
      });

      // Assign roles based on backup
      for (const userRole of backupUser.userRoles) {
        let roleId;
        if (userRole.role.name === "Super Admin") roleId = superAdminRole.id;
        else if (userRole.role.name === "Admin") roleId = adminRole.id;
        else if (userRole.role.name === "User") roleId = userRole.id;

        if (roleId) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: roleId,
              assignedAt: userRole.assignedAt,
            },
          });
        }
      }

      // Create employee record if existed in backup
      if (backupUser.employee) {
        const emp = backupUser.employee;
        const isAdmin = backupUser.userRoles.some(
          (ur) => ur.role.name === "Super Admin" || ur.role.name === "Admin"
        );

        await prisma.employee.create({
          data: {
            userId: user.id,
            employeeId: emp.employeeId,
            position: emp.position,
            phone: emp.phone,
            departmentId: isAdmin ? adminDept.id : itDept.id,
            teamId: isAdmin ? adminTeam.id : itTeam.id,
            hireDate: emp.hireDate,
          },
        });
      }
    }

    console.log("✅ Users and employees recreated\n");

    // Step 7: Verify the restoration
    console.log("🔍 7. Verifying restoration...");

    const finalUsers = await prisma.user.findMany({
      include: {
        employee: {
          include: {
            department: true,
            team: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`   Users restored: ${finalUsers.length}`);
    finalUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
      );
      console.log(
        `      Roles: ${user.userRoles.map((ur) => ur.role.name).join(", ")}`
      );
      if (user.employee) {
        console.log(
          `      Employee: ${user.employee.employeeId} - ${user.employee.position}`
        );
        console.log(`      Department: ${user.employee.department.name}`);
      }
      console.log("");
    });

    console.log("🎉 DATA RESTORATION COMPLETE WITH NEW SCHEMA!");
    console.log("\n✅ Schema Migration Step 1 Complete:");
    console.log("   - Removed duplicate fields from Employee table");
    console.log("   - Data successfully migrated to new schema");
    console.log("   - All users and employees restored");
  } catch (error) {
    console.error("❌ Error during data restoration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDataWithNewSchema();
