import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedEmployeeSystem() {
  console.log("🌱 Seeding employee management system...");

  try {
    // Create super admin user
    const hashedPassword = await bcrypt.hash("SuperAdmin@123", 12);

    const superAdminUser = await prisma.user.create({
      data: {
        email: "admin@ev91.com",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        isActive: true,
        emailVerified: true,
      },
    });

    console.log("✅ Created super admin user");

    // Get IT department and create super admin employee
    const itDepartment = await prisma.department.findFirst({
      where: { code: "IT" },
    });

    if (!itDepartment) {
      throw new Error("IT Department not found. Run migration first.");
    }

    const superAdminEmployee = await prisma.employee.create({
      data: {
        userId: superAdminUser.id,
        employeeId: "EMP001",
        // firstName: "Super",
        // lastName: "Admin",
        // email: "admin@ev91.com",
        departmentId: itDepartment.id,
        position: "System Administrator",
        hireDate: new Date(),
        // isActive: true,
      },
    });

    console.log("✅ Created super admin employee");

    // Assign super admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: "Super Admin" },
    });

    if (!superAdminRole) {
      throw new Error("Super Admin role not found. Run migration first.");
    }

    await prisma.userRole.create({
      data: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        createdBy: superAdminUser.id,
      },
    });

    console.log("✅ Assigned super admin role");

    // Create a few demo employees
    const demoEmployees = [
      {
        email: "john.manager@ev91.com",
        firstName: "John",
        lastName: "Manager",
        employeeId: "EMP002",
        departmentCode: "IT",
        teamName: "Backend Development",
        position: "Development Manager",
        roleName: "Manager",
      },
      {
        email: "jane.developer@ev91.com",
        firstName: "Jane",
        lastName: "Developer",
        employeeId: "EMP003",
        departmentCode: "IT",
        teamName: "Backend Development",
        position: "Senior Developer",
        roleName: "Employee",
      },
      {
        email: "bob.supervisor@ev91.com",
        firstName: "Bob",
        lastName: "Supervisor",
        employeeId: "EMP004",
        departmentCode: "OPS",
        teamName: "Field Operations",
        position: "Operations Supervisor",
        roleName: "Supervisor",
      },
    ];

    for (const emp of demoEmployees) {
      const password = await bcrypt.hash("Employee@123", 12);

      const user = await prisma.user.create({
        data: {
          email: emp.email,
          password: password,
          firstName: emp.firstName,
          lastName: emp.lastName,
          isActive: true,
          emailVerified: true,
        },
      });

      const department = await prisma.department.findFirst({
        where: { code: emp.departmentCode },
      });

      const team = await prisma.team.findFirst({
        where: {
          name: emp.teamName,
          departmentId: department?.id,
        },
      });

      const employee = await prisma.employee.create({
        data: {
          userId: user.id,
          employeeId: emp.employeeId,
          departmentId: department!.id,
          teamId: team?.id,
          position: emp.position,
          hireDate: new Date(),
        },
      });

      const role = await prisma.role.findFirst({
        where: { name: emp.roleName },
      });

      if (role) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            createdBy: superAdminUser.id,
          },
        });
      }

      console.log(`✅ Created demo employee: ${emp.firstName} ${emp.lastName}`);
    }

    // Set John as manager of Backend Development team
    const johnEmployee = await prisma.employee.findFirst({
      where: { 
        user: { 
          email: "john.manager@ev91.com" 
        } 
      },
    });

    const backendTeam = await prisma.team.findFirst({
      where: { name: "Backend Development" },
    });

    if (johnEmployee && backendTeam) {
      await prisma.team.update({
        where: { id: backendTeam.id },
        data: { managerId: johnEmployee.id },
      });

      // Set Jane as reporting to John
      const janeEmployee = await prisma.employee.findFirst({
        where: { 
          user: { 
            email: "jane.developer@ev91.com" 
          } 
        },
      });

      if (janeEmployee) {
        await prisma.employee.update({
          where: { id: janeEmployee.id },
          data: { managerId: johnEmployee.id },
        });
      }

      console.log("✅ Set up management hierarchy");
    }

    console.log("\n🎉 Employee system seeding completed successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("Super Admin: admin@ev91.com / SuperAdmin@123");
    console.log("Manager: john.manager@ev91.com / Employee@123");
    console.log("Developer: jane.developer@ev91.com / Employee@123");
    console.log("Supervisor: bob.supervisor@ev91.com / Employee@123");
  } catch (error) {
    console.error("❌ Error seeding employee system:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedEmployeeSystem()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seedEmployeeSystem };
