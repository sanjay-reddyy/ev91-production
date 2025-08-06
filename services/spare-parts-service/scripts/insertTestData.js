const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Starting spare parts test data insertion...')

    // Clear existing data (in dependency order)
    console.log('🧹 Clearing existing data...')
    await prisma.stockMovement.deleteMany()
    await prisma.inventoryLevel.deleteMany()
    await prisma.servicePartUsage.deleteMany()
    await prisma.goodsReceivingItem.deleteMany()
    await prisma.goodsReceiving.deleteMany()
    await prisma.purchaseOrderItem.deleteMany()
    await prisma.purchaseOrder.deleteMany()
    await prisma.partPriceHistory.deleteMany()
    await prisma.supplierPriceHistory.deleteMany()
    await prisma.inventoryAnalytics.deleteMany()
    await prisma.salesAnalytics.deleteMany()
    await prisma.sparePart.deleteMany()
    await prisma.supplierContact.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.category.deleteMany()
    await prisma.systemConfig.deleteMany()

    // 1. Insert System Configuration
    console.log('📋 Creating system configuration...')
    await prisma.systemConfig.createMany({
      data: [
        {
          configKey: 'DEFAULT_MARKUP_PERCENTAGE',
          configValue: '25',
          description: 'Default markup percentage for spare parts',
          configType: 'NUMBER'
        },
        {
          configKey: 'LOW_STOCK_THRESHOLD',
          configValue: '10',
          description: 'Default low stock threshold',
          configType: 'NUMBER'
        },
        {
          configKey: 'AUTO_REORDER_ENABLED',
          configValue: 'true',
          description: 'Enable automatic reorder when stock is low',
          configType: 'BOOLEAN'
        },
        {
          configKey: 'DEFAULT_LEAD_TIME_DAYS',
          configValue: '7',
          description: 'Default lead time for orders in days',
          configType: 'NUMBER'
        },
        {
          configKey: 'TAX_RATE',
          configValue: '18',
          description: 'GST rate percentage',
          configType: 'NUMBER'
        }
      ]
    })

    // 2. Insert Categories
    console.log('📁 Creating categories...')
    const categories = await Promise.all([
      // Root categories
      prisma.category.create({
        data: {
          name: 'engine',
          displayName: 'Engine Components',
          code: 'ENG',
          description: 'All engine related parts and components',
          level: 1,
          path: 'Engine',
          sortOrder: 1
        }
      }),
      prisma.category.create({
        data: {
          name: 'brake',
          displayName: 'Brake System',
          code: 'BRK',
          description: 'Brake system components and parts',
          level: 1,
          path: 'Brake',
          sortOrder: 2
        }
      }),
      prisma.category.create({
        data: {
          name: 'electrical',
          displayName: 'Electrical System',
          code: 'ELE',
          description: 'Electrical components and wiring',
          level: 1,
          path: 'Electrical',
          sortOrder: 3
        }
      }),
      prisma.category.create({
        data: {
          name: 'suspension',
          displayName: 'Suspension System',
          code: 'SUS',
          description: 'Suspension and steering components',
          level: 1,
          path: 'Suspension',
          sortOrder: 4
        }
      }),
      prisma.category.create({
        data: {
          name: 'body',
          displayName: 'Body Parts',
          code: 'BDY',
          description: 'Body panels and exterior components',
          level: 1,
          path: 'Body',
          sortOrder: 5
        }
      }),
      prisma.category.create({
        data: {
          name: 'transmission',
          displayName: 'Transmission',
          code: 'TRN',
          description: 'Transmission and drivetrain components',
          level: 1,
          path: 'Transmission',
          sortOrder: 6
        }
      })
    ])

    // Sub-categories
    await Promise.all([
      prisma.category.create({
        data: {
          name: 'engine_cooling',
          displayName: 'Cooling System',
          code: 'ENG-COOL',
          description: 'Engine cooling system components',
          parentId: categories[0].id,
          level: 2,
          path: 'Engine/Cooling',
          sortOrder: 1
        }
      }),
      prisma.category.create({
        data: {
          name: 'engine_fuel',
          displayName: 'Fuel System',
          code: 'ENG-FUEL',
          description: 'Fuel injection and delivery system',
          parentId: categories[0].id,
          level: 2,
          path: 'Engine/Fuel',
          sortOrder: 2
        }
      }),
      prisma.category.create({
        data: {
          name: 'brake_pads',
          displayName: 'Brake Pads & Discs',
          code: 'BRK-PAD',
          description: 'Brake pads and disc components',
          parentId: categories[1].id,
          level: 2,
          path: 'Brake/Pads',
          sortOrder: 1
        }
      }),
      prisma.category.create({
        data: {
          name: 'brake_fluid',
          displayName: 'Brake Fluid & Hydraulics',
          code: 'BRK-FLD',
          description: 'Brake fluid and hydraulic components',
          parentId: categories[1].id,
          level: 2,
          path: 'Brake/Fluid',
          sortOrder: 2
        }
      })
    ])

    // 3. Insert Suppliers
    console.log('🏢 Creating suppliers...')
    const suppliers = await Promise.all([
      prisma.supplier.create({
        data: {
          name: 'Hero MotoCorp',
          displayName: 'Hero MotoCorp Ltd.',
          code: 'HERO',
          supplierType: 'OEM',
          contactPerson: 'Rajesh Kumar',
          email: 'parts@heromotocorp.com',
          phone: '+91-124-4819000',
          website: 'https://www.heromotocorp.com',
          address: 'The Grand Plaza, Plot No. 2, Nelson Mandela Road',
          city: 'Gurugram',
          state: 'Haryana',
          country: 'India',
          pinCode: '122001',
          gstNumber: '06AABCH2781N1ZU',
          paymentTerms: '30 Days',
          creditLimit: 500000,
          creditDays: 30,
          discountPercent: 5,
          minOrderValue: 10000,
          deliveryTime: 5,
          rating: 4.5,
          onTimeDelivery: 92.5,
          qualityRating: 4.7,
          totalOrders: 156,
          completedOrders: 144,
          isPreferred: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'TVS Motor Company',
          displayName: 'TVS Motor Company Ltd.',
          code: 'TVS',
          supplierType: 'OEM',
          contactPerson: 'Suresh Krishnan',
          email: 'spares@tvsmotor.com',
          phone: '+91-44-2499-8500',
          website: 'https://www.tvsmotor.com',
          address: 'TVS Motors, Hosur Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pinCode: '600018',
          gstNumber: '33AABCT9699N1ZM',
          paymentTerms: '45 Days',
          creditLimit: 750000,
          creditDays: 45,
          discountPercent: 7,
          minOrderValue: 15000,
          deliveryTime: 7,
          rating: 4.3,
          onTimeDelivery: 89.2,
          qualityRating: 4.5,
          totalOrders: 203,
          completedOrders: 181,
          isPreferred: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Bosch India',
          displayName: 'Robert Bosch Engineering & Business Solutions',
          code: 'BOSCH',
          supplierType: 'Authorized',
          contactPerson: 'Amit Sharma',
          email: 'automotive@bosch.com',
          phone: '+91-80-2299-2244',
          website: 'https://www.bosch.in',
          address: 'Bosch Limited, Hosur Road',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pinCode: '560068',
          gstNumber: '29AABCB5221N1ZS',
          paymentTerms: '60 Days',
          creditLimit: 1000000,
          creditDays: 60,
          discountPercent: 10,
          minOrderValue: 25000,
          deliveryTime: 10,
          rating: 4.8,
          onTimeDelivery: 95.8,
          qualityRating: 4.9,
          totalOrders: 89,
          completedOrders: 85,
          isPreferred: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Fenix Parts',
          displayName: 'Fenix Auto Parts Pvt Ltd',
          code: 'FENIX',
          supplierType: 'Aftermarket',
          contactPerson: 'Vikram Singh',
          email: 'sales@fenixparts.com',
          phone: '+91-11-4567-8900',
          website: 'https://www.fenixparts.com',
          address: 'Plot 45, Sector 8, IMT Manesar',
          city: 'Gurugram',
          state: 'Haryana',
          country: 'India',
          pinCode: '122050',
          gstNumber: '06AABCF1234N1ZP',
          paymentTerms: '15 Days',
          creditLimit: 200000,
          creditDays: 15,
          discountPercent: 12,
          minOrderValue: 5000,
          deliveryTime: 3,
          rating: 4.1,
          onTimeDelivery: 88.5,
          qualityRating: 4.2,
          totalOrders: 234,
          completedOrders: 207,
          isPreferred: false
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Genuine Parts Co',
          displayName: 'Genuine Parts Company India',
          code: 'GPC',
          supplierType: 'Local',
          contactPerson: 'Manoj Gupta',
          email: 'info@genuineparts.in',
          phone: '+91-22-2267-8899',
          website: 'https://www.genuineparts.in',
          address: 'Andheri Industrial Estate',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pinCode: '400053',
          gstNumber: '27AABCG5678N1ZK',
          paymentTerms: 'COD',
          creditLimit: 100000,
          creditDays: 0,
          discountPercent: 8,
          minOrderValue: 2000,
          deliveryTime: 2,
          rating: 3.9,
          onTimeDelivery: 85.2,
          qualityRating: 4.0,
          totalOrders: 312,
          completedOrders: 266,
          isPreferred: false
        }
      })
    ])

    // 4. Insert Supplier Contacts
    console.log('👥 Creating supplier contacts...')
    await Promise.all([
      // Hero contacts
      prisma.supplierContact.create({
        data: {
          supplierId: suppliers[0].id,
          name: 'Rajesh Kumar',
          designation: 'Regional Sales Manager',
          email: 'rajesh.kumar@heromotocorp.com',
          phone: '+91-9876543210',
          whatsapp: '+91-9876543210',
          department: 'Sales',
          isPrimary: true
        }
      }),
      prisma.supplierContact.create({
        data: {
          supplierId: suppliers[0].id,
          name: 'Priya Singh',
          designation: 'Technical Support Lead',
          email: 'priya.singh@heromotocorp.com',
          phone: '+91-9876543211',
          department: 'Technical',
          isPrimary: false
        }
      }),
      // TVS contacts
      prisma.supplierContact.create({
        data: {
          supplierId: suppliers[1].id,
          name: 'Suresh Krishnan',
          designation: 'Spare Parts Manager',
          email: 'suresh.k@tvsmotor.com',
          phone: '+91-9876543212',
          whatsapp: '+91-9876543212',
          department: 'Sales',
          isPrimary: true
        }
      }),
      // Bosch contacts
      prisma.supplierContact.create({
        data: {
          supplierId: suppliers[2].id,
          name: 'Amit Sharma',
          designation: 'Business Development Manager',
          email: 'amit.sharma@bosch.com',
          phone: '+91-9876543213',
          department: 'Sales',
          isPrimary: true
        }
      })
    ])

    // 5. Insert Spare Parts
    console.log('🔧 Creating spare parts...')
    const spareParts = await Promise.all([
      // Engine parts
      prisma.sparePart.create({
        data: {
          name: 'Engine Oil Filter',
          displayName: 'Hero Splendor Engine Oil Filter',
          partNumber: 'HRO-OF-001',
          oemPartNumber: '15410-KEA-003',
          internalCode: 'SP-001',
          description: 'High-quality oil filter for Hero Splendor series',
          categoryId: categories[0].id,
          supplierId: suppliers[0].id,
          compatibility: JSON.stringify(['hero-splendor-plus', 'hero-splendor-ismart']),
          specifications: JSON.stringify({
            'filtration_efficiency': '99.5%',
            'thread_size': 'M20x1.5',
            'bypass_pressure': '1.2 bar',
            'material': 'Paper element'
          }),
          dimensions: '65 x 65 x 75 mm',
          weight: 0.15,
          material: 'Steel & Paper',
          warranty: 6,
          costPrice: 120,
          sellingPrice: 150,
          mrp: 180,
          markupPercent: 25,
          unitOfMeasure: 'PCS',
          minimumStock: 20,
          maximumStock: 200,
          reorderLevel: 40,
          reorderQuantity: 100,
          leadTimeDays: 5,
          qualityGrade: 'A',
          isOemApproved: true,
          imageUrls: JSON.stringify(['/images/parts/oil-filter-hero.jpg']),
          documentUrls: JSON.stringify(['/docs/oil-filter-specs.pdf'])
        }
      }),
      prisma.sparePart.create({
        data: {
          name: 'Air Filter',
          displayName: 'TVS Jupiter Air Filter',
          partNumber: 'TVS-AF-002',
          oemPartNumber: '17230-GFM-000',
          internalCode: 'SP-002',
          description: 'Original air filter for TVS Jupiter scooter',
          categoryId: categories[0].id,
          supplierId: suppliers[1].id,
          compatibility: JSON.stringify(['tvs-jupiter-classic', 'tvs-jupiter-zx']),
          specifications: JSON.stringify({
            'filtration_area': '250 sq cm',
            'dust_capacity': '45g',
            'airflow_rate': '85 CFM',
            'material': 'Non-woven fabric'
          }),
          dimensions: '180 x 120 x 35 mm',
          weight: 0.08,
          material: 'Non-woven fabric',
          warranty: 12,
          costPrice: 180,
          sellingPrice: 225,
          mrp: 270,
          markupPercent: 25,
          unitOfMeasure: 'PCS',
          minimumStock: 15,
          maximumStock: 150,
          reorderLevel: 30,
          reorderQuantity: 75,
          leadTimeDays: 7,
          qualityGrade: 'A',
          isOemApproved: true
        }
      }),
      // Brake parts
      prisma.sparePart.create({
        data: {
          name: 'Brake Pads Front',
          displayName: 'Bosch Front Brake Pads',
          partNumber: 'BSH-BP-003',
          oemPartNumber: '06450-KVB-405',
          internalCode: 'SP-003',
          description: 'Premium brake pads for front disc brake',
          categoryId: categories[1].id,
          supplierId: suppliers[2].id,
          compatibility: JSON.stringify(['hero-xtreme', 'tvs-apache', 'bajaj-pulsar']),
          specifications: JSON.stringify({
            'friction_coefficient': '0.45',
            'operating_temperature': '400°C max',
            'thickness': '8mm',
            'material': 'Semi-metallic'
          }),
          dimensions: '95 x 45 x 8 mm',
          weight: 0.25,
          material: 'Semi-metallic compound',
          warranty: 18,
          costPrice: 350,
          sellingPrice: 440,
          mrp: 520,
          markupPercent: 25.7,
          unitOfMeasure: 'SET',
          minimumStock: 10,
          maximumStock: 100,
          reorderLevel: 20,
          reorderQuantity: 50,
          leadTimeDays: 10,
          qualityGrade: 'A',
          isOemApproved: true
        }
      }),
      prisma.sparePart.create({
        data: {
          name: 'Brake Shoe Set',
          displayName: 'Fenix Rear Brake Shoe Set',
          partNumber: 'FNX-BS-004',
          oemPartNumber: '43120-GBM-000',
          internalCode: 'SP-004',
          description: 'High-quality rear brake shoe set for drum brakes',
          categoryId: categories[1].id,
          supplierId: suppliers[3].id,
          compatibility: JSON.stringify(['hero-passion', 'bajaj-ct100', 'honda-shine']),
          specifications: JSON.stringify({
            'lining_thickness': '4.5mm',
            'drum_diameter': '130mm',
            'friction_coefficient': '0.38',
            'material': 'Asbestos-free'
          }),
          dimensions: '130 x 25 x 4.5 mm',
          weight: 0.18,
          material: 'Asbestos-free lining',
          warranty: 12,
          costPrice: 180,
          sellingPrice: 225,
          mrp: 280,
          markupPercent: 25,
          unitOfMeasure: 'SET',
          minimumStock: 12,
          maximumStock: 120,
          reorderLevel: 25,
          reorderQuantity: 60,
          leadTimeDays: 3,
          qualityGrade: 'B',
          isOemApproved: false
        }
      }),
      // Electrical parts
      prisma.sparePart.create({
        data: {
          name: 'Spark Plug',
          displayName: 'Bosch Spark Plug NGK CR8E',
          partNumber: 'BSH-SP-005',
          oemPartNumber: 'CR8E',
          internalCode: 'SP-005',
          description: 'High-performance spark plug for 4-stroke engines',
          categoryId: categories[2].id,
          supplierId: suppliers[2].id,
          compatibility: JSON.stringify(['universal-4stroke']),
          specifications: JSON.stringify({
            'thread_size': 'M10x1.0',
            'reach': '12.7mm',
            'heat_range': '8',
            'electrode_gap': '0.7-0.8mm'
          }),
          dimensions: '20.6 x 12.7 mm',
          weight: 0.03,
          material: 'Nickel alloy electrode',
          warranty: 24,
          costPrice: 85,
          sellingPrice: 105,
          mrp: 130,
          markupPercent: 23.5,
          unitOfMeasure: 'PCS',
          minimumStock: 25,
          maximumStock: 250,
          reorderLevel: 50,
          reorderQuantity: 125,
          leadTimeDays: 10,
          qualityGrade: 'A',
          isOemApproved: true
        }
      }),
      prisma.sparePart.create({
        data: {
          name: 'Headlight Bulb',
          displayName: 'Halogen Headlight Bulb H4 12V 35/35W',
          partNumber: 'GPC-HB-006',
          oemPartNumber: 'H4-35/35',
          internalCode: 'SP-006',
          description: 'Standard halogen headlight bulb for motorcycles',
          categoryId: categories[2].id,
          supplierId: suppliers[4].id,
          compatibility: JSON.stringify(['universal-12v']),
          specifications: JSON.stringify({
            'voltage': '12V',
            'wattage': '35/35W',
            'base_type': 'P43t',
            'color_temperature': '3200K'
          }),
          dimensions: '60 x 40 mm',
          weight: 0.05,
          material: 'Glass & Tungsten',
          warranty: 6,
          costPrice: 45,
          sellingPrice: 55,
          mrp: 70,
          markupPercent: 22.2,
          unitOfMeasure: 'PCS',
          minimumStock: 30,
          maximumStock: 300,
          reorderLevel: 60,
          reorderQuantity: 150,
          leadTimeDays: 2,
          qualityGrade: 'B',
          isOemApproved: false
        }
      }),
      // Chain and sprocket
      prisma.sparePart.create({
        data: {
          name: 'Drive Chain',
          displayName: 'Heavy Duty Drive Chain 428H-116L',
          partNumber: 'FNX-DC-007',
          oemPartNumber: '428H-116L',
          internalCode: 'SP-007',
          description: 'Heavy duty motorcycle drive chain',
          categoryId: categories[5].id,
          supplierId: suppliers[3].id,
          compatibility: JSON.stringify(['hero-xtreme', 'bajaj-pulsar-150', 'yamaha-fz']),
          specifications: JSON.stringify({
            'pitch': '12.7mm',
            'links': '116',
            'tensile_strength': '18kN',
            'weight': '1.8kg'
          }),
          dimensions: '1470 x 12.7 mm',
          weight: 1.8,
          material: 'Alloy steel',
          warranty: 18,
          costPrice: 650,
          sellingPrice: 815,
          mrp: 980,
          markupPercent: 25.4,
          unitOfMeasure: 'PCS',
          minimumStock: 8,
          maximumStock: 80,
          reorderLevel: 15,
          reorderQuantity: 40,
          leadTimeDays: 3,
          qualityGrade: 'A',
          isOemApproved: false
        }
      }),
      // Body parts
      prisma.sparePart.create({
        data: {
          name: 'Side Mirror',
          displayName: 'Left Side Mirror Assembly',
          partNumber: 'GPC-SM-008',
          oemPartNumber: '88220-GBL-000',
          internalCode: 'SP-008',
          description: 'Left side mirror assembly with mounting bracket',
          categoryId: categories[4].id,
          supplierId: suppliers[4].id,
          compatibility: JSON.stringify(['hero-splendor', 'hero-passion', 'bajaj-platina']),
          specifications: JSON.stringify({
            'mirror_size': '120mm',
            'adjustment_type': 'Manual',
            'mounting': 'Thread type',
            'thread_size': 'M8'
          }),
          dimensions: '120 x 80 x 50 mm',
          weight: 0.15,
          material: 'ABS plastic & glass',
          warranty: 12,
          costPrice: 75,
          sellingPrice: 95,
          mrp: 120,
          markupPercent: 26.7,
          unitOfMeasure: 'PCS',
          minimumStock: 20,
          maximumStock: 200,
          reorderLevel: 40,
          reorderQuantity: 100,
          leadTimeDays: 2,
          qualityGrade: 'B',
          isOemApproved: false
        }
      })
    ])

    // 6. Insert Inventory Levels (Stock at different stores)
    console.log('📦 Creating inventory levels...')
    const stores = [
      { id: 'store-001', name: 'Main Warehouse Delhi' },
      { id: 'store-002', name: 'Service Center Mumbai' },
      { id: 'store-003', name: 'Service Center Bangalore' },
      { id: 'store-004', name: 'Service Center Chennai' }
    ]

    const inventoryData = []
    spareParts.forEach((part, partIndex) => {
      stores.forEach((store, storeIndex) => {
        const baseStock = 50 + (partIndex * 10) + (storeIndex * 5)
        inventoryData.push({
          sparePartId: part.id,
          storeId: store.id,
          storeName: store.name,
          currentStock: baseStock,
          reservedStock: Math.floor(baseStock * 0.1),
          availableStock: Math.floor(baseStock * 0.9),
          damagedStock: Math.floor(Math.random() * 3),
          minimumStock: part.minimumStock,
          maximumStock: part.maximumStock,
          reorderLevel: part.reorderLevel,
          reorderQuantity: part.reorderQuantity,
          rackNumber: `R${storeIndex + 1}`,
          shelfNumber: `S${partIndex + 1}`,
          binLocation: `B${storeIndex + 1}-${partIndex + 1}`,
          lastCountDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          lastMovementDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        })
      })
    })

    await prisma.inventoryLevel.createMany({ data: inventoryData })

    // 7. Insert Purchase Orders
    console.log('📋 Creating purchase orders...')
    const purchaseOrders = await Promise.all([
      prisma.purchaseOrder.create({
        data: {
          orderNumber: 'PO-2025-001',
          supplierId: suppliers[0].id,
          storeId: 'store-001',
          storeName: 'Main Warehouse Delhi',
          orderDate: new Date('2025-01-15'),
          expectedDate: new Date('2025-01-20'),
          deliveryDate: new Date('2025-01-18'),
          subtotal: 12500,
          taxAmount: 2250,
          totalAmount: 14750,
          status: 'DELIVERED',
          urgencyLevel: 'NORMAL',
          notes: 'Regular monthly order for Hero parts',
          createdBy: 'user-001',
          approvedBy: 'user-002',
          receivedBy: 'user-003'
        }
      }),
      prisma.purchaseOrder.create({
        data: {
          orderNumber: 'PO-2025-002',
          supplierId: suppliers[2].id,
          storeId: 'store-002',
          storeName: 'Service Center Mumbai',
          orderDate: new Date('2025-01-20'),
          expectedDate: new Date('2025-02-01'),
          subtotal: 8750,
          taxAmount: 1575,
          totalAmount: 10325,
          status: 'CONFIRMED',
          urgencyLevel: 'HIGH',
          notes: 'Urgent order for Bosch brake pads',
          createdBy: 'user-002',
          approvedBy: 'user-001'
        }
      })
    ])

    // 8. Insert Purchase Order Items
    console.log('📝 Creating purchase order items...')
    await Promise.all([
      // Items for PO-001
      prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrders[0].id,
          sparePartId: spareParts[0].id, // Oil filter
          orderedQuantity: 50,
          receivedQuantity: 50,
          unitCost: 120,
          totalCost: 6000,
          status: 'RECEIVED'
        }
      }),
      prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrders[0].id,
          sparePartId: spareParts[7].id, // Side mirror
          orderedQuantity: 25,
          receivedQuantity: 25,
          unitCost: 75,
          totalCost: 1875,
          status: 'RECEIVED'
        }
      }),
      // Items for PO-002
      prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrders[1].id,
          sparePartId: spareParts[2].id, // Brake pads
          orderedQuantity: 20,
          receivedQuantity: 0,
          unitCost: 350,
          totalCost: 7000,
          status: 'PENDING'
        }
      }),
      prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrders[1].id,
          sparePartId: spareParts[4].id, // Spark plug
          orderedQuantity: 30,
          receivedQuantity: 0,
          unitCost: 85,
          totalCost: 2550,
          status: 'PENDING'
        }
      })
    ])

    // 9. Insert Stock Movements
    console.log('📊 Creating stock movements...')
    const stockMovements = []
    const movementTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']
    const reasons = ['PURCHASE', 'SERVICE', 'TRANSFER', 'ADJUSTMENT', 'RETURN']

    for (let i = 0; i < 50; i++) {
      const randomPart = spareParts[Math.floor(Math.random() * spareParts.length)]
      const randomStore = stores[Math.floor(Math.random() * stores.length)]
      const randomMovementType = movementTypes[Math.floor(Math.random() * movementTypes.length)]
      const quantity = Math.floor(Math.random() * 20) + 1
      const unitCost = randomPart.costPrice
      
      stockMovements.push({
        stockLevelId: 'temp-id', // Will be updated with actual inventory level ID
        sparePartId: randomPart.id,
        storeId: randomStore.id,
        movementType: randomMovementType,
        quantity: randomMovementType === 'OUT' ? -quantity : quantity,
        previousStock: 100,
        newStock: randomMovementType === 'OUT' ? 100 - quantity : 100 + quantity,
        unitCost: unitCost,
        totalValue: quantity * unitCost,
        referenceType: reasons[Math.floor(Math.random() * reasons.length)],
        reason: `${randomMovementType} movement for ${randomPart.name}`,
        createdBy: 'user-001',
        movementDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      })
    }

    // Get actual inventory level IDs and update stock movements
    const inventoryLevels = await prisma.inventoryLevel.findMany()
    const updatedStockMovements = stockMovements.map(movement => {
      const inventory = inventoryLevels.find(inv => 
        inv.sparePartId === movement.sparePartId && inv.storeId === movement.storeId
      )
      return {
        ...movement,
        stockLevelId: inventory?.id || inventoryLevels[0].id
      }
    })

    await prisma.stockMovement.createMany({ data: updatedStockMovements })

    // 10. Insert Service Part Usage
    console.log('🔧 Creating service part usage...')
    const serviceUsages = []
    for (let i = 0; i < 30; i++) {
      const randomPart = spareParts[Math.floor(Math.random() * spareParts.length)]
      const randomStore = stores[Math.floor(Math.random() * stores.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const unitCost = randomPart.costPrice
      const sellingPrice = randomPart.sellingPrice
      
      serviceUsages.push({
        serviceRecordId: `service-${String(i + 1).padStart(3, '0')}`,
        vehicleId: `vehicle-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        sparePartId: randomPart.id,
        storeId: randomStore.id,
        quantityUsed: quantity,
        unitCost: unitCost,
        sellingPrice: sellingPrice,
        totalCost: quantity * unitCost,
        totalRevenue: quantity * sellingPrice,
        marginAmount: quantity * (sellingPrice - unitCost),
        marginPercent: ((sellingPrice - unitCost) / sellingPrice) * 100,
        usageReason: Math.random() > 0.5 ? 'Replacement' : 'Preventive',
        authorizedBy: `tech-${Math.floor(Math.random() * 5) + 1}`,
        isWarranty: Math.random() > 0.8,
        usageDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
      })
    }

    await prisma.servicePartUsage.createMany({ data: serviceUsages })

    // 11. Insert Price History
    console.log('💰 Creating price history...')
    const priceHistories = []
    spareParts.forEach(part => {
      // Initial price
      priceHistories.push({
        sparePartId: part.id,
        costPrice: part.costPrice * 0.9, // Previous price was 10% lower
        sellingPrice: part.sellingPrice * 0.9,
        mrp: part.mrp * 0.9,
        markupPercent: part.markupPercent,
        changeReason: 'Initial price setup',
        effectiveDate: new Date('2024-12-01'),
        changedBy: 'system'
      })
      
      // Recent price change
      priceHistories.push({
        sparePartId: part.id,
        costPrice: part.costPrice,
        sellingPrice: part.sellingPrice,
        mrp: part.mrp,
        markupPercent: part.markupPercent,
        changeReason: 'Supplier price increase',
        effectiveDate: new Date('2025-01-01'),
        changedBy: 'user-001'
      })
    })

    await prisma.partPriceHistory.createMany({ data: priceHistories })

    // 12. Insert Analytics Data
    console.log('📈 Creating analytics data...')
    const currentDate = new Date()
    const analyticsData = []
    
    for (let i = 0; i < 12; i++) {
      const periodDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      stores.forEach(store => {
        analyticsData.push({
          periodType: 'MONTHLY',
          periodDate: periodDate,
          storeId: store.id,
          storeName: store.name,
          totalItems: Math.floor(Math.random() * 1000) + 500,
          totalValue: Math.floor(Math.random() * 500000) + 250000,
          totalCostValue: Math.floor(Math.random() * 400000) + 200000,
          lowStockItems: Math.floor(Math.random() * 20) + 5,
          outOfStockItems: Math.floor(Math.random() * 10) + 1,
          excessStockItems: Math.floor(Math.random() * 30) + 10,
          totalInbound: Math.floor(Math.random() * 200) + 100,
          totalOutbound: Math.floor(Math.random() * 180) + 90,
          totalAdjustments: Math.floor(Math.random() * 20) + 5,
          stockTurnover: Math.random() * 2 + 1,
          totalPurchases: Math.floor(Math.random() * 300000) + 150000,
          totalSales: Math.floor(Math.random() * 400000) + 200000,
          totalMargin: Math.floor(Math.random() * 100000) + 50000,
          averageMargin: Math.random() * 30 + 15,
          fastMovingItems: Math.floor(Math.random() * 50) + 25,
          slowMovingItems: Math.floor(Math.random() * 100) + 50,
          deadStockItems: Math.floor(Math.random() * 20) + 5
        })
      })
    }

    await prisma.inventoryAnalytics.createMany({ data: analyticsData })

    console.log('✅ Spare parts test data insertion completed successfully!')
    console.log(`📊 Inserted data summary:`)
    console.log(`   - ${await prisma.category.count()} Categories`)
    console.log(`   - ${await prisma.supplier.count()} Suppliers`)
    console.log(`   - ${await prisma.supplierContact.count()} Supplier Contacts`)
    console.log(`   - ${await prisma.sparePart.count()} Spare Parts`)
    console.log(`   - ${await prisma.inventoryLevel.count()} Inventory Levels`)
    console.log(`   - ${await prisma.purchaseOrder.count()} Purchase Orders`)
    console.log(`   - ${await prisma.purchaseOrderItem.count()} Purchase Order Items`)
    console.log(`   - ${await prisma.stockMovement.count()} Stock Movements`)
    console.log(`   - ${await prisma.servicePartUsage.count()} Service Usage Records`)
    console.log(`   - ${await prisma.partPriceHistory.count()} Price History Records`)
    console.log(`   - ${await prisma.inventoryAnalytics.count()} Analytics Records`)

  } catch (error) {
    console.error('❌ Error inserting test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
