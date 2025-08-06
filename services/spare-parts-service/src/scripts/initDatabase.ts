import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Initializing spare parts database...');

    // Create sample categories first
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { code: 'BATTERY' },
        update: {},
        create: {
          name: 'Battery Components',
          displayName: 'Battery Components',
          code: 'BATTERY',
          description: 'Battery cells, packs, and related components',
        },
      }),
      prisma.category.upsert({
        where: { code: 'MOTOR' },
        update: {},
        create: {
          name: 'Motor Systems',
          displayName: 'Motor Systems',
          code: 'MOTOR',
          description: 'Electric motors and controllers',
        },
      }),
      prisma.category.upsert({
        where: { code: 'CHARGING' },
        update: {},
        create: {
          name: 'Charging Systems',
          displayName: 'Charging Systems',
          code: 'CHARGING',
          description: 'Charging ports and related components',
        },
      }),
      prisma.category.upsert({
        where: { code: 'BRAKING' },
        update: {},
        create: {
          name: 'Braking Systems',
          displayName: 'Braking Systems',
          code: 'BRAKING',
          description: 'Regenerative and traditional braking components',
        },
      }),
      prisma.category.upsert({
        where: { code: 'ELECTRONICS' },
        update: {},
        create: {
          name: 'Electronics',
          displayName: 'Electronics',
          code: 'ELECTRONICS',
          description: 'ECUs and electronic control systems',
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create sample suppliers
    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { code: 'AP001' },
        update: {},
        create: {
          name: 'AutoParts Plus',
          displayName: 'AutoParts Plus',
          code: 'AP001',
          contactPerson: 'John Smith',
          email: 'contact@autoparts-plus.com',
          phone: '+1-555-0123',
          address: '123 Industrial Ave, Detroit, MI 48201',
          isActive: true,
          rating: 4.5,
          paymentTerms: 'NET_30',
          deliveryTime: 5,
        },
      }),
      prisma.supplier.upsert({
        where: { code: 'EVC002' },
        update: {},
        create: {
          name: 'EV Components Corp',
          displayName: 'EV Components Corp',
          code: 'EVC002',
          contactPerson: 'Sarah Johnson',
          email: 'sales@ev-components.com',
          phone: '+1-555-0456',
          address: '456 Tech Blvd, San Jose, CA 95110',
          isActive: true,
          rating: 4.8,
          paymentTerms: 'NET_15',
          deliveryTime: 3,
        },
      }),
      prisma.supplier.upsert({
        where: { code: 'BW003' },
        update: {},
        create: {
          name: 'Battery World Inc',
          displayName: 'Battery World Inc',
          code: 'BW003',
          contactPerson: 'Mike Chen',
          email: 'info@battery-world.com',
          phone: '+1-555-0789',
          address: '789 Power St, Austin, TX 73301',
          isActive: true,
          rating: 4.2,
          paymentTerms: 'NET_30',
          deliveryTime: 7,
        },
      }),
    ]);

    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create sample spare parts
    const spareParts = await Promise.all([
      // Battery components
      prisma.sparePart.upsert({
        where: { partNumber: 'BAT-LI-001' },
        update: {},
        create: {
          partNumber: 'BAT-LI-001',
          name: 'Lithium Battery Cell 18650',
          displayName: 'Lithium Battery Cell 18650',
          internalCode: 'INT-BAT-001',
          description: 'High-capacity lithium-ion battery cell for EV packs',
          categoryId: categories[0].id, // BATTERY
          supplierId: suppliers[0].id,
          compatibility: JSON.stringify(['Tesla Model S', 'Tesla Model 3', 'BMW i3']),
          costPrice: 18.50,
          sellingPrice: 25.99,
          mrp: 30.00,
          weight: 0.048,
          dimensions: '65mm x 18mm',
          warranty: 24,
          isActive: true,
        },
      }),
      prisma.sparePart.upsert({
        where: { partNumber: 'MOT-AC-002' },
        update: {},
        create: {
          partNumber: 'MOT-AC-002',
          name: 'AC Motor Controller',
          displayName: 'AC Motor Controller',
          internalCode: 'INT-MOT-002',
          description: 'High-efficiency AC motor controller for electric vehicles',
          categoryId: categories[1].id, // MOTOR
          supplierId: suppliers[1].id,
          compatibility: JSON.stringify(['Nissan Leaf', 'Chevy Bolt', 'Tesla Model Y']),
          costPrice: 950.00,
          sellingPrice: 1299.99,
          mrp: 1500.00,
          weight: 5.2,
          dimensions: '300mm x 200mm x 100mm',
          warranty: 36,
          isActive: true,
        },
      }),
      prisma.sparePart.upsert({
        where: { partNumber: 'CHG-DC-003' },
        update: {},
        create: {
          partNumber: 'CHG-DC-003',
          name: 'DC Fast Charging Port',
          displayName: 'DC Fast Charging Port',
          internalCode: 'INT-CHG-003',
          description: 'CCS2 compatible DC fast charging port assembly',
          categoryId: categories[2].id, // CHARGING
          supplierId: suppliers[2].id,
          compatibility: JSON.stringify(['BMW i3', 'Audi e-tron', 'Mercedes EQC']),
          costPrice: 320.00,
          sellingPrice: 450.00,
          mrp: 550.00,
          weight: 2.1,
          dimensions: '150mm x 100mm x 80mm',
          warranty: 12,
          isActive: true,
        },
      }),
      prisma.sparePart.upsert({
        where: { partNumber: 'BRK-REG-004' },
        update: {},
        create: {
          partNumber: 'BRK-REG-004',
          name: 'Regenerative Brake Module',
          displayName: 'Regenerative Brake Module',
          internalCode: 'INT-BRK-004',
          description: 'Advanced regenerative braking system module',
          categoryId: categories[3].id, // BRAKING
          supplierId: suppliers[0].id,
          compatibility: JSON.stringify(['Tesla Model S', 'Model 3', 'Model X', 'Model Y']),
          costPrice: 620.00,
          sellingPrice: 850.00,
          mrp: 1000.00,
          weight: 3.8,
          dimensions: '250mm x 180mm x 120mm',
          warranty: 24,
          isActive: true,
        },
      }),
      prisma.sparePart.upsert({
        where: { partNumber: 'ECU-MAIN-005' },
        update: {},
        create: {
          partNumber: 'ECU-MAIN-005',
          name: 'Main ECU Control Unit',
          displayName: 'Main ECU Control Unit',
          internalCode: 'INT-ECU-005',
          description: 'Primary electronic control unit for vehicle systems',
          categoryId: categories[4].id, // ELECTRONICS
          supplierId: suppliers[1].id,
          compatibility: JSON.stringify(['Multiple Models']),
          costPrice: 1680.00,
          sellingPrice: 2250.00,
          mrp: 2500.00,
          weight: 1.5,
          dimensions: '200mm x 150mm x 60mm',
          warranty: 36,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${spareParts.length} spare parts`);

    // Create supplier price relationships
    const supplierPrices = await Promise.all([
      // AutoParts Plus supplies battery cells and brake modules
      prisma.supplierPriceHistory.upsert({
        where: {
          id: 'price-1', // Using a temp ID for upsert
        },
        update: {},
        create: {
          supplierId: suppliers[0].id,
          sparePartId: spareParts[0].id,
          unitCost: 18.50,
          minimumOrder: 50,
          isActive: true,
        },
      }),
      prisma.supplierPriceHistory.upsert({
        where: {
          id: 'price-2',
        },
        update: {},
        create: {
          supplierId: suppliers[0].id,
          sparePartId: spareParts[3].id,
          unitCost: 620.00,
          minimumOrder: 5,
          isActive: true,
        },
      }),
      // EV Components supplies motors and ECUs
      prisma.supplierPriceHistory.upsert({
        where: {
          id: 'price-3',
        },
        update: {},
        create: {
          supplierId: suppliers[1].id,
          sparePartId: spareParts[1].id,
          unitCost: 950.00,
          minimumOrder: 2,
          isActive: true,
        },
      }),
      prisma.supplierPriceHistory.upsert({
        where: {
          id: 'price-4',
        },
        update: {},
        create: {
          supplierId: suppliers[1].id,
          sparePartId: spareParts[4].id,
          unitCost: 1680.00,
          minimumOrder: 1,
          isActive: true,
        },
      }),
      // Battery World supplies charging components
      prisma.supplierPriceHistory.upsert({
        where: {
          id: 'price-5',
        },
        update: {},
        create: {
          supplierId: suppliers[2].id,
          sparePartId: spareParts[2].id,
          unitCost: 320.00,
          minimumOrder: 10,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${supplierPrices.length} supplier price relationships`);

    // Create initial inventory levels for different stores
    const stores = [
      { id: 'store-main', name: 'Main Warehouse' },
      { id: 'store-north', name: 'North Branch' },
      { id: 'store-south', name: 'South Branch' },
    ];

    const inventoryLevels = [];
    for (const store of stores) {
      for (const part of spareParts) {
        const baseStock = Math.floor(Math.random() * 50) + 10;
        inventoryLevels.push(
          prisma.inventoryLevel.upsert({
            where: {
              sparePartId_storeId: {
                sparePartId: part.id,
                storeId: store.id,
              },
            },
            update: {},
            create: {
              sparePartId: part.id,
              storeId: store.id,
              storeName: store.name,
              currentStock: baseStock,
              reservedStock: Math.floor(Math.random() * 5),
              minimumStock: 10,
              maximumStock: 100,
              reorderLevel: 20,
            },
          })
        );
      }
    }

    const createdInventory = await Promise.all(inventoryLevels);
    console.log(`✅ Created ${createdInventory.length} inventory level records`);

    // Create sample stock movements (need to create after inventory levels exist)
    const sampleInventoryLevel = createdInventory[0]; // Get the first inventory level for reference
    
    const stockMovements = await Promise.all([
      prisma.stockMovement.create({
        data: {
          stockLevelId: sampleInventoryLevel.id,
          sparePartId: spareParts[0].id,
          storeId: 'store-main',
          movementType: 'IN',
          quantity: 100,
          previousStock: 0,
          newStock: 100,
          referenceType: 'PURCHASE_ORDER',
          referenceId: 'PO-2024-001',
          notes: 'Initial stock receipt',
          createdBy: 'system',
        },
      }),
      prisma.stockMovement.create({
        data: {
          stockLevelId: createdInventory[5].id, // Different inventory level
          sparePartId: spareParts[1].id,
          storeId: 'store-main',
          movementType: 'OUT',
          quantity: 2,
          previousStock: 20,
          newStock: 18,
          referenceType: 'SERVICE_REQUEST',
          referenceId: 'SR-2024-001',
          notes: 'Used in Model 3 repair',
          createdBy: 'technician-001',
        },
      }),
      prisma.stockMovement.create({
        data: {
          stockLevelId: createdInventory[10].id, // Different inventory level
          sparePartId: spareParts[2].id,
          storeId: 'store-north',
          movementType: 'TRANSFER',
          quantity: 5,
          previousStock: 15,
          newStock: 20,
          referenceType: 'STORE_TRANSFER',
          referenceId: 'ST-2024-001',
          notes: 'Transfer from main warehouse',
          createdBy: 'warehouse-manager',
        },
      }),
    ]);

    console.log(`✅ Created ${stockMovements.length} stock movement records`);

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Spare Parts: ${spareParts.length}`);
    console.log(`   - Supplier Price Records: ${supplierPrices.length}`);
    console.log(`   - Inventory Records: ${createdInventory.length}`);
    console.log(`   - Stock Movements: ${stockMovements.length}`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
