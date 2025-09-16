import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function simpleTest() {
  try {
    console.log("🔌 Testing simple database connection...");
    await prisma.$connect();
    console.log("✅ Connected to database successfully!");

    console.log("📊 Checking database tables...");

    // Try to list tables using raw SQL
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'spare_parts'
      ORDER BY table_name;
    `;

    console.log("🗃️ Tables in spare_parts schema:", tables);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
