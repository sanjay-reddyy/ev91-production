import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    const categoryCount = await prisma.category.count();
    const supplierCount = await prisma.supplier.count();
    const sparePartCount = await prisma.sparePart.count();
    const inventoryCount = await prisma.inventoryLevel.count();

    console.log(`📊 Current database state:`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Suppliers: ${supplierCount}`);
    console.log(`   Spare Parts: ${sparePartCount}`);
    console.log(`   Inventory Levels: ${inventoryCount}`);

    if (categoryCount > 0) {
      console.log("✅ Database has data - seeding likely completed");
    } else {
      console.log("⏳ Database empty - seeding may still be running or failed");
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
