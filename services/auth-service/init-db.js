const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database with basic admin user...");

    // Hash password
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);

    // Try to create a simple user directly
    console.log("👤 Creating Super Admin user...");

    try {
      const superAdmin = await prisma.user.create({
        data: {
          email: "admin@ev91.com",
          password: hashedPassword,
          firstName: "Super",
          lastName: "Admin",
          isActive: true,
          emailVerified: true,
        },
      });
      console.log("✅ Super Admin user created:", superAdmin.id);
    } catch (error) {
      console.log("⚠️  User may already exist, trying upsert...");
      const superAdmin = await prisma.user.upsert({
        where: { email: "admin@ev91.com" },
        update: {
          password: hashedPassword,
          isActive: true,
          emailVerified: true,
        },
        create: {
          email: "admin@ev91.com",
          password: hashedPassword,
          firstName: "Super",
          lastName: "Admin",
          isActive: true,
          emailVerified: true,
        },
      });
      console.log("✅ Super Admin user updated:", superAdmin.id);
    }

    console.log("\n🎉 Database initialization completed!");
    console.log("📧 Login Credentials:");
    console.log("Email: admin@ev91.com");
    console.log("Password: SuperAdmin123!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
