const { PrismaClient } = require("@prisma/client");

async function checkTables() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking database tables after schema update...");

    // Get all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log("❌ No tables found in database");
    } else {
      console.log("📋 Current tables:");
      tables.forEach((table) => console.log(`  - ${table.table_name}`));

      // Check if client/store tables are removed
      const hasClients = tables.some((t) => t.table_name === "clients");
      const hasStores = tables.some((t) => t.table_name === "stores");

      if (!hasClients && !hasStores) {
        console.log("✅ Client and Store tables successfully removed!");
      } else {
        if (hasClients) console.log("⚠️  Clients table still exists");
        if (hasStores) console.log("⚠️  Stores table still exists");
      }
    }
  } catch (error) {
    console.error("❌ Error checking tables:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
