import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function basicSeed() {
  console.log("🌱 Starting basic seed...");

  try {
    // Check which tables exist by trying to count them
    console.log("🔍 Checking existing tables...");

    const checkTable = async (
      tableName: string,
      operation: () => Promise<number>
    ) => {
      try {
        const count = await operation();
        console.log(`   ✅ ${tableName}: ${count} records`);
        return true;
      } catch (error: any) {
        if (error.code === "P2021") {
          console.log(`   ❌ ${tableName}: table doesn't exist`);
          return false;
        }
        throw error;
      }
    };

    const categoryExists = await checkTable("Category", () =>
      prisma.category.count()
    );
    const supplierExists = await checkTable("Supplier", () =>
      prisma.supplier.count()
    );
    const sparePartExists = await checkTable("SparePart", () =>
      prisma.sparePart.count()
    );
    const inventoryExists = await checkTable("InventoryLevel", () =>
      prisma.inventoryLevel.count()
    );

    // Only seed basic tables if they exist
    if (categoryExists && supplierExists && sparePartExists) {
      console.log("✅ Basic tables exist - ready to seed!");

      // Clean existing data
      if (inventoryExists) {
        await prisma.inventoryLevel.deleteMany();
        console.log("   🧹 Cleaned inventory levels");
      }
      await prisma.sparePart.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.category.deleteMany();
      console.log("   🧹 Cleaned basic tables");

      // Create basic data
      console.log("📁 Creating categories...");
      const category = await prisma.category.create({
        data: {
          name: "Electric Vehicle Components",
          displayName: "Electric Vehicle Components",
          code: "EV_COMP",
          level: 1,
          parentId: null,
          isActive: true,
        },
      });

      console.log("🏭 Creating supplier...");
      const supplier = await prisma.supplier.create({
        data: {
          name: "Premium EV Parts Ltd",
          displayName: "Premium EV Parts Ltd",
          code: "PEV001",
          supplierType: "OEM",
          contactPerson: "John Smith",
          email: "john@premiumevparts.com",
          phone: "+91-9876543210",
          isActive: true,
        },
      });

      console.log("🔧 Creating spare parts...");
      for (let i = 1; i <= 10; i++) {
        await prisma.sparePart.create({
          data: {
            name: `Test Part ${i}`,
            displayName: `Test Part ${i}`,
            partNumber: `TP${String(i).padStart(3, "0")}`,
            internalCode: `INT${String(i).padStart(3, "0")}`,
            categoryId: category.id,
            supplierId: supplier.id,
            compatibility: JSON.stringify(["Model A", "Model B"]),
            costPrice: faker.number.float({
              min: 100,
              max: 1000,
              fractionDigits: 2,
            }),
            sellingPrice: faker.number.float({
              min: 120,
              max: 1200,
              fractionDigits: 2,
            }),
            mrp: faker.number.float({ min: 150, max: 1500, fractionDigits: 2 }),
            minimumStock: 5,
            maximumStock: 50,
            reorderLevel: 10,
            reorderQuantity: 20,
            warranty: 12,
            isActive: true,
          },
        });
      }

      console.log("✅ Basic seeding completed successfully!");
    } else {
      console.log("❌ Some basic tables are missing. Run migrations first.");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

basicSeed();
