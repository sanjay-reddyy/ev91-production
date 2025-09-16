const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addClientStorePermissions() {
  console.log("🔐 Adding Client-Store Service Permissions...");

  try {
    // Define all client-store permissions
    const clientStorePermissions = [
      // Client permissions
      {
        name: "client-store:clients:create",
        description: "Create new clients",
        service: "client-store-service",
        resource: "clients",
        action: "create",
      },
      {
        name: "client-store:clients:read",
        description: "Read client information",
        service: "client-store-service",
        resource: "clients",
        action: "read",
      },
      {
        name: "client-store:clients:update",
        description: "Update client information",
        service: "client-store-service",
        resource: "clients",
        action: "update",
      },
      {
        name: "client-store:clients:delete",
        description: "Delete clients",
        service: "client-store-service",
        resource: "clients",
        action: "delete",
      },
      {
        name: "client-store:clients:archive",
        description: "Archive/unarchive clients",
        service: "client-store-service",
        resource: "clients",
        action: "archive",
      },
      {
        name: "client-store:clients:stats",
        description: "View client statistics",
        service: "client-store-service",
        resource: "clients",
        action: "stats",
      },

      // Store permissions
      {
        name: "client-store:stores:create",
        description: "Create new stores",
        service: "client-store-service",
        resource: "stores",
        action: "create",
      },
      {
        name: "client-store:stores:read",
        description: "Read store information",
        service: "client-store-service",
        resource: "stores",
        action: "read",
      },
      {
        name: "client-store:stores:update",
        description: "Update store information",
        service: "client-store-service",
        resource: "stores",
        action: "update",
      },
      {
        name: "client-store:stores:delete",
        description: "Delete stores",
        service: "client-store-service",
        resource: "stores",
        action: "delete",
      },
      {
        name: "client-store:stores:archive",
        description: "Archive/unarchive stores",
        service: "client-store-service",
        resource: "stores",
        action: "archive",
      },
      {
        name: "client-store:stores:stats",
        description: "View store statistics",
        service: "client-store-service",
        resource: "stores",
        action: "stats",
      },

      // Rider earnings permissions
      {
        name: "client-store:rider-earnings:create",
        description: "Create rider earnings records",
        service: "client-store-service",
        resource: "rider-earnings",
        action: "create",
      },
      {
        name: "client-store:rider-earnings:read",
        description: "Read rider earnings data",
        service: "client-store-service",
        resource: "rider-earnings",
        action: "read",
      },
      {
        name: "client-store:rider-earnings:update",
        description: "Update rider earnings records",
        service: "client-store-service",
        resource: "rider-earnings",
        action: "update",
      },
      {
        name: "client-store:rider-earnings:delete",
        description: "Delete rider earnings records",
        service: "client-store-service",
        resource: "rider-earnings",
        action: "delete",
      },

      // City sync permissions
      {
        name: "client-store:city-sync:read",
        description: "Access city synchronization data",
        service: "client-store-service",
        resource: "city-sync",
        action: "read",
      },
      {
        name: "client-store:city-sync:sync",
        description: "Perform city synchronization",
        service: "client-store-service",
        resource: "city-sync",
        action: "sync",
      },

      // Account manager permissions
      {
        name: "client-store:account-managers:read",
        description: "View account manager information",
        service: "client-store-service",
        resource: "account-managers",
        action: "read",
      },
    ];

    // Add permissions to database
    console.log("➕ Adding permissions to database...");
    const createdPermissions = [];

    for (const permission of clientStorePermissions) {
      try {
        const existingPermission = await prisma.permission.findFirst({
          where: {
            service: permission.service,
            resource: permission.resource,
            action: permission.action,
          },
        });

        if (existingPermission) {
          console.log(`⚠️  Permission already exists: ${permission.name}`);
          createdPermissions.push(existingPermission);
        } else {
          const newPermission = await prisma.permission.create({
            data: permission,
          });
          console.log(`✅ Created permission: ${permission.name}`);
          createdPermissions.push(newPermission);
        }
      } catch (error) {
        console.error(
          `❌ Error creating permission ${permission.name}:`,
          error.message
        );
      }
    }

    // Find Super Admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: "Super Admin" },
    });

    if (!superAdminRole) {
      console.error("❌ Super Admin role not found!");
      return;
    }

    console.log(`🎯 Found Super Admin role: ${superAdminRole.id}`);

    // Assign all permissions to Super Admin
    console.log("🔗 Assigning all client-store permissions to Super Admin...");

    for (const permission of createdPermissions) {
      try {
        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });

        if (existingRolePermission) {
          console.log(`⚠️  Permission already assigned: ${permission.name}`);
        } else {
          await prisma.rolePermission.create({
            data: {
              roleId: superAdminRole.id,
              permissionId: permission.id,
            },
          });
          console.log(
            `✅ Assigned permission to Super Admin: ${permission.name}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error assigning permission ${permission.name}:`,
          error.message
        );
      }
    }

    // Also assign to Admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: "Admin" },
    });

    if (adminRole) {
      console.log("🔗 Assigning client-store permissions to Admin role...");

      for (const permission of createdPermissions) {
        try {
          const existingRolePermission = await prisma.rolePermission.findFirst({
            where: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });

          if (!existingRolePermission) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            });
            console.log(`✅ Assigned permission to Admin: ${permission.name}`);
          }
        } catch (error) {
          console.error(
            `❌ Error assigning permission to Admin ${permission.name}:`,
            error.message
          );
        }
      }
    }

    console.log("🎉 Client-Store permissions setup complete!");

    // Verify the assignments
    console.log("🔍 Verifying Super Admin permissions...");
    const superAdminPermissions = await prisma.rolePermission.findMany({
      where: { roleId: superAdminRole.id },
      include: { permission: true },
    });

    const clientStorePerms = superAdminPermissions.filter(
      (rp) => rp.permission.service === "client-store-service"
    );

    console.log(
      `✅ Super Admin now has ${clientStorePerms.length} client-store permissions`
    );
  } catch (error) {
    console.error("❌ Error setting up client-store permissions:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the function
addClientStorePermissions();
