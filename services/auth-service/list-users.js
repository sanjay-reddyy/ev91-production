const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log("Users in system:");
    users.forEach((u) => {
      const roles = u.userRoles.map((ur) => ur.role.name).join(", ");
      const empName = u.employee
        ? `${u.employee.firstName} ${u.employee.lastName}`
        : "No employee";
      console.log(`${u.email} - ${empName} - Roles: ${roles}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
