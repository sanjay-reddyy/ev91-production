import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fullStatus() {
  try {
    console.log("📊 Checking complete database status...");

    const results = await prisma.$queryRaw`
      SELECT
        'categories' as table_name, COUNT(*) as count FROM spare_parts.categories
      UNION ALL
      SELECT
        'suppliers' as table_name, COUNT(*) as count FROM spare_parts.suppliers
      UNION ALL
      SELECT
        'supplier_contacts' as table_name, COUNT(*) as count FROM spare_parts.supplier_contacts
      UNION ALL
      SELECT
        'spare_parts' as table_name, COUNT(*) as count FROM spare_parts.spare_parts
      UNION ALL
      SELECT
        'inventory_levels' as table_name, COUNT(*) as count FROM spare_parts.inventory_levels
      UNION ALL
      SELECT
        'purchase_orders' as table_name, COUNT(*) as count FROM spare_parts.purchase_orders
      UNION ALL
      SELECT
        'purchase_order_items' as table_name, COUNT(*) as count FROM spare_parts.purchase_order_items
      UNION ALL
      SELECT
        'service_requests' as table_name, COUNT(*) as count FROM spare_parts.service_requests
      UNION ALL
      SELECT
        'spare_part_requests' as table_name, COUNT(*) as count FROM spare_parts.spare_part_requests
      UNION ALL
      SELECT
        'stock_reservations' as table_name, COUNT(*) as count FROM spare_parts.stock_reservations
      UNION ALL
      SELECT
        'installed_parts' as table_name, COUNT(*) as count FROM spare_parts.installed_parts
      UNION ALL
      SELECT
        'system_config' as table_name, COUNT(*) as count FROM spare_parts.system_config
      ORDER BY table_name;
    `;

    console.log("🗃️ Complete database status:");
    // @ts-ignore
    results.forEach((row: any) => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });

    // @ts-ignore
    const totalRecords = results.reduce(
      (sum: number, row: any) => sum + parseInt(row.count),
      0
    );
    console.log(`\n📈 Total records across all tables: ${totalRecords}`);

    if (totalRecords > 1000) {
      console.log(
        "✅ Database seeding appears to be complete and comprehensive!"
      );
    } else {
      console.log("⏳ Seeding may still be in progress...");
    }
  } catch (error) {
    console.error("❌ Error checking status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fullStatus();
