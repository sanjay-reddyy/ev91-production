import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";

// Use a separate test database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || "file:./test.db";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

export async function setupTestDatabase() {
  try {
    // Run migrations on test database
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: "inherit",
    });

    console.log("✅ Test database setup complete");
  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    throw error;
  }
}

export async function cleanupTestDatabase() {
  try {
    // Clean up all tables in reverse order to handle foreign keys
    await prisma.serviceCostBreakdown.deleteMany();
    await prisma.installedPart.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.approvalHistory.deleteMany();
    await prisma.sparePartRequest.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.technicianLimit.deleteMany();

    // Clean up existing tables
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryLevel.deleteMany();
    await prisma.sparePart.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();

    console.log("✅ Test database cleaned");
  } catch (error) {
    console.error("❌ Test database cleanup failed:", error);
    throw error;
  }
}

export async function createTestData() {
  try {
    // Create test category
    const category = await prisma.category.create({
      data: {
        name: "Engine Parts",
        displayName: "Engine Parts",
        code: "ENG",
        description: "Engine related spare parts",
        isActive: true,
      },
    });

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: "Test Supplier Ltd",
        displayName: "Test Supplier",
        code: "TS001",
        supplierType: "OEM",
        email: "test@supplier.com",
        phone: "+1234567890",
        address: "123 Test Street",
        paymentTerms: "NET_30",
        isActive: true,
      },
    });

    // Create test spare part
    const sparePart = await prisma.sparePart.create({
      data: {
        name: "Test Engine Oil Filter",
        displayName: "Engine Oil Filter",
        partNumber: "EOF001",
        internalCode: "INTCODE001",            // Added required field
        compatibility: "Universal",            // Added required field
        mrp: 100.0,                            // Added required field
        description: "High-quality engine oil filter",
        categoryId: category.id,
        supplierId: supplier.id,
        specifications: JSON.stringify({
          dimensions: "10x5x3 cm",
          weight: "200g",
        }),
        costPrice: 50.0,
        sellingPrice: 75.0,
        markupPercent: 50.0,
        minimumStock: 10,
        maximumStock: 100,
        reorderLevel: 15,
        warranty: 12, // 12 months
        isActive: true,
      },
    });

    // Create test inventory level
    const inventoryLevel = await prisma.inventoryLevel.create({
      data: {
        sparePartId: sparePart.id,
        storeId: "STORE001",
        storeName: "Main Store",
        currentStock: 50,
        availableStock: 45,
        reservedStock: 5,
        isActive: true,
      },
    });

    // Create test service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ticketNumber: "SRV001",
        vehicleId: "VEH001",
        storeId: "STORE001",
        technicianId: "TECH001",
        serviceType: "MAINTENANCE",
        priority: "NORMAL",
        status: "In Progress",
        description: "Regular maintenance service",
        estimatedCost: 500.0,
        scheduledDate: new Date(),
      },
    });

    // Create technician limits
    await prisma.technicianLimit.create({
      data: {
        technicianId: "TECH001",
        sparePartId: sparePart.id,
        maxQuantityPerRequest: 5,
        maxValuePerRequest: 200.0,
        autoApproveBelow: 100.0,
        requiresApproval: true,
        isActive: true,
      },
    });

    console.log("✅ Test data created successfully");

    return {
      category,
      supplier,
      sparePart,
      inventoryLevel,
      serviceRequest,
    };
  } catch (error) {
    console.error("❌ Test data creation failed:", error);
    throw error;
  }
}

// Jest setup and teardown
export async function setupTests() {
  await setupTestDatabase();
  return createTestData();
}

export async function teardownTests() {
  await cleanupTestDatabase();
  await prisma.$disconnect();
}
