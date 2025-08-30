import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Helper function to generate realistic Indian business data
function generateIndianBusinessData() {
  const cities = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Pimpri-Chinchwad",
    "Patna",
    "Vadodara",
    "Ghaziabad",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Kalyan-Dombivali",
    "Vasai-Virar",
    "Varanasi",
    "Srinagar",
    "Dhanbad",
    "Jodhpur",
    "Amritsar",
    "Raipur",
    "Allahabad",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Vijayawada",
  ];

  const states = [
    "Maharashtra",
    "Delhi",
    "Karnataka",
    "Tamil Nadu",
    "West Bengal",
    "Telangana",
    "Gujarat",
    "Rajasthan",
    "Uttar Pradesh",
    "Madhya Pradesh",
    "Punjab",
    "Haryana",
    "Kerala",
    "Odisha",
    "Bihar",
    "Jharkhand",
    "Assam",
    "Uttarakhand",
    "Himachal Pradesh",
    "Jammu and Kashmir",
  ];

  return {
    city: faker.helpers.arrayElement(cities),
    state: faker.helpers.arrayElement(states),
    pinCode: faker.helpers.fromRegExp(/[1-9][0-9]{5}/),
    gstNumber: faker.helpers.fromRegExp(
      /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/
    ),
    panNumber: faker.helpers.fromRegExp(/[A-Z]{5}[0-9]{4}[A-Z]{1}/),
  };
}

// Vehicle compatibility data (realistic EV models)
const vehicleModels = [
  "Ola S1 Pro",
  "Ola S1 Air",
  "Ather 450X",
  "Ather 450 Plus",
  "TVS iQube Electric",
  "Bajaj Chetak Electric",
  "Hero Electric Optima",
  "Okinawa PraisePro",
  "Pure EPluto 7G",
  "Ampere Magnus EX",
  "Hero Electric Photon",
  "Revolt RV400",
  "Bounce Infinity E1",
  "Simple One",
  "Ultraviolette F77",
  "Tork Kratos",
  "Matter Aera",
];

// Spare parts categories with realistic hierarchy
const categoryHierarchy = [
  {
    name: "Battery & Power System",
    children: [
      "Lithium-ion Battery Packs",
      "Battery Management System (BMS)",
      "Charging Components",
      "Power Electronics",
      "Cooling System for Battery",
    ],
  },
  {
    name: "Motor & Drivetrain",
    children: [
      "Electric Motors",
      "Motor Controllers",
      "Gearbox Components",
      "Drive Belts & Chains",
      "Motor Cooling",
    ],
  },
  {
    name: "Chassis & Body",
    children: [
      "Frame Components",
      "Body Panels",
      "Fasteners & Hardware",
      "Seat & Ergonomics",
      "Storage Components",
    ],
  },
  {
    name: "Wheels & Suspension",
    children: [
      "Wheel Rims",
      "Tires & Tubes",
      "Suspension Components",
      "Shock Absorbers",
      "Wheel Bearings",
    ],
  },
  {
    name: "Braking System",
    children: [
      "Brake Discs",
      "Brake Pads",
      "Brake Calipers",
      "Brake Cables",
      "Hydraulic Components",
    ],
  },
  {
    name: "Electronics & Controls",
    children: [
      "Display Units",
      "Control Switches",
      "Wiring Harness",
      "Sensors",
      "ECU Components",
    ],
  },
  {
    name: "Lighting System",
    children: [
      "LED Headlights",
      "Tail Lights",
      "Turn Indicators",
      "Dashboard Lights",
      "Auxiliary Lighting",
    ],
  },
];

// Generate realistic spare part names with part numbers
function generateSparePartData(categoryName: string, index: number) {
  const partTypeMap: Record<string, string[]> = {
    "Lithium-ion Battery Packs": [
      "Li-ion Cell 18650 3.7V 3000mAh",
      "Battery Pack 48V 20Ah",
      "Battery Pack 60V 30Ah",
      "Battery Cell Module 12V 10Ah",
      "Lithium Polymer Battery 48V 15Ah",
    ],
    "Battery Management System (BMS)": [
      "BMS Board 48V 20A",
      "BMS Protection Circuit 60V",
      "Battery Monitoring Unit",
      "Cell Balancing Circuit",
      "Temperature Sensor Module",
    ],
    "Electric Motors": [
      "BLDC Hub Motor 1000W",
      "BLDC Motor 2000W Mid-Drive",
      "Hub Motor 500W Rear",
      "Motor Stator Assembly",
      "Motor Rotor with Magnets",
    ],
    "Brake Discs": [
      "Front Brake Disc 220mm",
      "Rear Brake Disc 180mm",
      "Ventilated Brake Disc 240mm",
      "Solid Brake Disc 200mm",
      "Stainless Steel Brake Disc",
    ],
    "LED Headlights": [
      "LED Headlight Assembly 12V 20W",
      "LED Projector Headlight",
      "LED DRL Strip",
      "Headlight Lens",
      "LED Bulb H4 12V",
    ],
  };

  const defaultParts = [
    "Standard Component",
    "Premium Grade Part",
    "OEM Specification Item",
    "High Performance Unit",
    "Economy Grade Component",
  ];

  const parts = partTypeMap[categoryName] || defaultParts;
  const partName = faker.helpers.arrayElement(parts);

  return {
    name: partName,
    partNumber: `EV91-${categoryName.substring(0, 3).toUpperCase()}-${String(
      index
    ).padStart(4, "0")}`,
    oemPartNumber: `OEM-${faker.string.alphanumeric(8).toUpperCase()}`,
    internalCode: `INT-${faker.string.alphanumeric(6).toUpperCase()}`,
  };
}

async function main() {
  console.log("🌱 Starting to seed spare parts database...");

  try {
    // Clear existing data in reverse dependency order
    console.log("🧹 Cleaning existing data...");

    // Helper function to safely delete from tables that may not exist
    const safeDelete = async (
      deleteOperation: () => Promise<any>,
      tableName: string
    ) => {
      try {
        await deleteOperation();
        console.log(`   ✅ Cleaned ${tableName}`);
      } catch (error: any) {
        if (error.code === "P2021") {
          console.log(`   ⚠️  Table ${tableName} doesn't exist - skipping`);
        } else {
          throw error;
        }
      }
    };

    await safeDelete(
      () => prisma.salesAnalytics.deleteMany(),
      "salesAnalytics"
    );
    await safeDelete(
      () => prisma.inventoryAnalytics.deleteMany(),
      "inventoryAnalytics"
    );
    await safeDelete(
      () => prisma.supplierPriceHistory.deleteMany(),
      "supplierPriceHistory"
    );
    await safeDelete(
      () => prisma.partPriceHistory.deleteMany(),
      "partPriceHistory"
    );
    await safeDelete(
      () => prisma.technicianLimit.deleteMany(),
      "technicianLimit"
    );
    await safeDelete(
      () => prisma.serviceCostBreakdown.deleteMany(),
      "serviceCostBreakdown"
    );
    await safeDelete(() => prisma.installedPart.deleteMany(), "installedPart");
    await safeDelete(
      () => prisma.stockReservation.deleteMany(),
      "stockReservation"
    );
    await safeDelete(
      () => prisma.approvalHistory.deleteMany(),
      "approvalHistory"
    );
    await safeDelete(
      () => prisma.sparePartRequest.deleteMany(),
      "sparePartRequest"
    );
    await safeDelete(
      () => prisma.serviceRequest.deleteMany(),
      "serviceRequest"
    );
    await safeDelete(
      () => prisma.goodsReceivingItem.deleteMany(),
      "goodsReceivingItem"
    );
    await safeDelete(
      () => prisma.goodsReceiving.deleteMany(),
      "goodsReceiving"
    );
    await safeDelete(
      () => prisma.purchaseOrderItem.deleteMany(),
      "purchaseOrderItem"
    );
    await safeDelete(() => prisma.purchaseOrder.deleteMany(), "purchaseOrder");
    await safeDelete(() => prisma.stockMovement.deleteMany(), "stockMovement");
    await safeDelete(
      () => prisma.inventoryLevel.deleteMany(),
      "inventoryLevel"
    );
    await safeDelete(() => prisma.sparePart.deleteMany(), "sparePart");
    await safeDelete(
      () => prisma.supplierContact.deleteMany(),
      "supplierContact"
    );
    await safeDelete(() => prisma.supplier.deleteMany(), "supplier");
    await safeDelete(() => prisma.category.deleteMany(), "category");
    await safeDelete(() => prisma.systemConfig.deleteMany(), "systemConfig");

    // 1. Create System Configuration
    console.log("⚙️ Creating system configuration...");
    const systemConfigs = [
      {
        configKey: "DEFAULT_MARKUP_PERCENT",
        configValue: "20",
        description: "Default markup percentage for spare parts",
        configType: "NUMBER",
      },
      {
        configKey: "AUTO_APPROVE_LIMIT",
        configValue: "1000",
        description: "Auto approve requests below this amount (INR)",
        configType: "NUMBER",
      },
      {
        configKey: "LOW_STOCK_THRESHOLD",
        configValue: "10",
        description: "Threshold for low stock alerts",
        configType: "NUMBER",
      },
      {
        configKey: "DEFAULT_LEAD_TIME_DAYS",
        configValue: "7",
        description: "Default lead time for procurement in days",
        configType: "NUMBER",
      },
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.create({ data: config });
    }

    // 2. Create Categories with Hierarchy
    console.log("📁 Creating spare part categories...");
    const createdCategories: any[] = [];

    for (const parentCategory of categoryHierarchy) {
      // Create parent category
      const parent = await prisma.category.create({
        data: {
          name: parentCategory.name,
          displayName: parentCategory.name,
          code: parentCategory.name.replace(/[^A-Z0-9]/g, "_").toUpperCase(),
          description: `${parentCategory.name} and related components`,
          level: 1,
          path: parentCategory.name,
          isActive: true,
          sortOrder: createdCategories.length,
        },
      });
      createdCategories.push(parent);

      // Create child categories
      for (let i = 0; i < parentCategory.children.length; i++) {
        const childName = parentCategory.children[i];
        const child = await prisma.category.create({
          data: {
            name: childName,
            displayName: childName,
            code: childName.replace(/[^A-Z0-9]/g, "_").toUpperCase(),
            description: `${childName} components and parts`,
            parentId: parent.id,
            level: 2,
            path: `${parentCategory.name}/${childName}`,
            isActive: true,
            sortOrder: i,
          },
        });
        createdCategories.push(child);
      }
    }

    // 3. Create Suppliers
    console.log("🏭 Creating suppliers...");
    const suppliers: any[] = [];
    const supplierTypes = ["OEM", "Aftermarket", "Authorized", "Local"];

    for (let i = 0; i < 15; i++) {
      const businessData = generateIndianBusinessData();
      const supplierType = faker.helpers.arrayElement(supplierTypes);

      const supplier = await prisma.supplier.create({
        data: {
          name: `${faker.company.name()} ${
            supplierType === "OEM" ? "Manufacturing" : "Suppliers"
          }`,
          displayName: faker.company.name(),
          code: `SUP${String(i + 1).padStart(3, "0")}`,
          supplierType,
          contactPerson: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          website: faker.internet.url(),
          address: faker.location.streetAddress(),
          city: businessData.city,
          state: businessData.state,
          pinCode: businessData.pinCode,
          gstNumber: businessData.gstNumber,
          panNumber: businessData.panNumber,
          paymentTerms: faker.helpers.arrayElement([
            "15 Days",
            "30 Days",
            "45 Days",
            "COD",
          ]),
          creditLimit: faker.number.int({ min: 50000, max: 500000 }),
          creditDays: faker.number.int({ min: 15, max: 60 }),
          discountPercent: faker.number.float({
            min: 0,
            max: 15,
            fractionDigits: 2,
          }),
          minOrderValue: faker.number.int({ min: 1000, max: 10000 }),
          deliveryTime: faker.number.int({ min: 3, max: 21 }),
          rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
          onTimeDelivery: faker.number.float({
            min: 70,
            max: 98,
            fractionDigits: 1,
          }),
          qualityRating: faker.number.float({
            min: 3,
            max: 5,
            fractionDigits: 1,
          }),
          totalOrders: faker.number.int({ min: 10, max: 500 }),
          completedOrders: faker.number.int({ min: 8, max: 450 }),
          isActive: true,
          isPreferred: faker.datatype.boolean(0.3),
          isBlacklisted: false,
        },
      });
      suppliers.push(supplier);

      // Create supplier contacts
      for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
        await prisma.supplierContact.create({
          data: {
            supplierId: supplier.id,
            name: faker.person.fullName(),
            designation: faker.helpers.arrayElement([
              "Sales Manager",
              "Technical Head",
              "Account Manager",
              "CEO",
            ]),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            whatsapp: faker.phone.number(),
            department: faker.helpers.arrayElement([
              "Sales",
              "Technical",
              "Accounts",
              "Management",
            ]),
            isPrimary: j === 0,
            isActive: true,
          },
        });
      }
    }

    // 4. Create Spare Parts
    console.log("🔧 Creating spare parts inventory...");
    const spareParts: any[] = [];
    const leafCategories = createdCategories.filter((cat) => cat.level === 2);

    for (let i = 0; i < 200; i++) {
      const category = faker.helpers.arrayElement(leafCategories);
      const supplier = faker.helpers.arrayElement(suppliers);
      const partData = generateSparePartData(category.name, i + 1);

      const costPrice = faker.number.float({
        min: 100,
        max: 5000,
        fractionDigits: 2,
      });
      const markupPercent = faker.number.float({
        min: 15,
        max: 40,
        fractionDigits: 2,
      });
      const sellingPrice = costPrice * (1 + markupPercent / 100);
      const mrp =
        sellingPrice *
        faker.number.float({ min: 1.1, max: 1.3, fractionDigits: 2 });

      const sparePart = await prisma.sparePart.create({
        data: {
          name: partData.name,
          displayName: partData.name,
          partNumber: partData.partNumber,
          oemPartNumber: partData.oemPartNumber,
          internalCode: partData.internalCode,
          description: `High quality ${
            partData.name
          } suitable for ${faker.helpers.arrayElement(vehicleModels)}`,
          categoryId: category.id,
          supplierId: supplier.id,
          compatibility: JSON.stringify(
            faker.helpers.arrayElements(vehicleModels, { min: 1, max: 5 })
          ),
          specifications: JSON.stringify({
            material: faker.helpers.arrayElement([
              "Aluminum",
              "Steel",
              "Plastic",
              "Composite",
              "Lithium",
            ]),
            weight: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
            dimensions: `${faker.number.int({
              min: 10,
              max: 100,
            })}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({
              min: 10,
              max: 100,
            })}mm`,
            voltage:
              category.name.includes("Battery") ||
              category.name.includes("Electronics")
                ? faker.helpers.arrayElement([
                    "12V",
                    "24V",
                    "48V",
                    "60V",
                    "72V",
                  ])
                : null,
            current:
              category.name.includes("Battery") ||
              category.name.includes("Motor")
                ? `${faker.number.int({ min: 5, max: 50 })}A`
                : null,
          }),
          dimensions: `${faker.number.int({
            min: 10,
            max: 100,
          })} x ${faker.number.int({ min: 10, max: 100 })} x ${faker.number.int(
            { min: 10, max: 100 }
          )} mm`,
          weight: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
          material: faker.helpers.arrayElement([
            "Aluminum",
            "Steel",
            "Plastic",
            "Composite",
            "Lithium",
          ]),
          warranty: faker.number.int({ min: 6, max: 36 }),
          costPrice,
          sellingPrice: parseFloat(sellingPrice.toFixed(2)),
          mrp: parseFloat(mrp.toFixed(2)),
          markupPercent,
          unitOfMeasure: faker.helpers.arrayElement([
            "PCS",
            "SET",
            "PAIR",
            "KG",
            "METER",
          ]),
          minimumStock: faker.number.int({ min: 5, max: 20 }),
          maximumStock: faker.number.int({ min: 50, max: 200 }),
          reorderLevel: faker.number.int({ min: 10, max: 30 }),
          reorderQuantity: faker.number.int({ min: 20, max: 100 }),
          leadTimeDays: faker.number.int({ min: 3, max: 21 }),
          qualityGrade: faker.helpers.arrayElement(["A", "B", "C"]),
          isOemApproved: faker.datatype.boolean(0.6),
          certifications: JSON.stringify(
            faker.helpers.arrayElements(
              ["ISO 9001", "CE", "RoHS", "BIS", "ARAI"],
              { min: 0, max: 3 }
            )
          ),
          imageUrls: JSON.stringify([
            faker.image.url({ width: 400, height: 400 }),
            faker.image.url({ width: 400, height: 400 }),
          ]),
          isActive: true,
          isDiscontinued: faker.datatype.boolean(0.05),
          isHazardous: faker.datatype.boolean(0.1),
        },
      });
      spareParts.push(sparePart);
    }

    // 5. Create Store Locations and Inventory Levels
    console.log("📦 Creating inventory levels for stores...");
    const storeIds = [
      "store_mumbai_001",
      "store_delhi_001",
      "store_bangalore_001",
      "store_chennai_001",
      "store_kolkata_001",
      "store_hyderabad_001",
      "store_pune_001",
      "store_ahmedabad_001",
      "store_jaipur_001",
      "store_lucknow_001",
    ];

    const storeNames = [
      "Mumbai Central Hub",
      "Delhi Service Center",
      "Bangalore Tech Hub",
      "Chennai Regional Center",
      "Kolkata Eastern Hub",
      "Hyderabad South Hub",
      "Pune Western Center",
      "Ahmedabad Gujarat Hub",
      "Jaipur Rajasthan Center",
      "Lucknow UP Hub",
    ];

    const inventoryLevels: any[] = [];
    for (const sparePart of spareParts.slice(0, 150)) {
      // Only for first 150 parts to keep data manageable
      // Select random stores for this part (3-7 stores) but avoid duplicates
      const numberOfStores = faker.number.int({ min: 3, max: 7 });
      const selectedStoreIndices = faker.helpers.arrayElements(
        Array.from({ length: storeIds.length }, (_, i) => i),
        numberOfStores
      );

      for (const storeIndex of selectedStoreIndices) {
        const currentStock = faker.number.int({ min: 0, max: 100 });
        const reservedStock = faker.number.int({
          min: 0,
          max: Math.min(currentStock, 10),
        });

        const inventoryLevel = await prisma.inventoryLevel.create({
          data: {
            sparePartId: sparePart.id,
            storeId: storeIds[storeIndex],
            storeName: storeNames[storeIndex],
            currentStock,
            reservedStock,
            availableStock: currentStock - reservedStock,
            damagedStock: faker.number.int({ min: 0, max: 3 }),
            minimumStock: sparePart.minimumStock,
            maximumStock: sparePart.maximumStock,
            reorderLevel: sparePart.reorderLevel,
            reorderQuantity: sparePart.reorderQuantity,
            rackNumber: faker.helpers.arrayElement([
              "R1",
              "R2",
              "R3",
              "R4",
              "R5",
            ]),
            shelfNumber: faker.helpers.arrayElement(["S1", "S2", "S3", "S4"]),
            binLocation: `${faker.helpers.arrayElement([
              "A",
              "B",
              "C",
            ])}${faker.number.int({ min: 1, max: 20 })}`,
            lastCountDate: faker.date.recent({ days: 30 }),
            lastMovementDate: faker.date.recent({ days: 7 }),
            isActive: true,
          },
        });
        inventoryLevels.push(inventoryLevel);
      }
    }

    // 6. Create Stock Movements
    console.log("📊 Creating stock movement history...");
    for (let i = 0; i < 500; i++) {
      const inventoryLevel = faker.helpers.arrayElement(inventoryLevels);
      const movementType = faker.helpers.arrayElement([
        "IN",
        "OUT",
        "TRANSFER",
        "ADJUSTMENT",
      ]);
      const quantity = faker.number.int({ min: 1, max: 20 });
      const isPositive = ["IN", "TRANSFER"].includes(movementType);
      const previousStock = faker.number.int({ min: 10, max: 100 });
      const newStock = isPositive
        ? previousStock + quantity
        : Math.max(0, previousStock - quantity);

      await prisma.stockMovement.create({
        data: {
          stockLevelId: inventoryLevel.id,
          sparePartId: inventoryLevel.sparePartId,
          storeId: inventoryLevel.storeId,
          movementType,
          quantity: isPositive ? quantity : -quantity,
          previousStock,
          newStock,
          unitCost: faker.number.float({
            min: 100,
            max: 2000,
            fractionDigits: 2,
          }),
          totalValue: faker.number.float({
            min: 500,
            max: 10000,
            fractionDigits: 2,
          }),
          referenceType: faker.helpers.arrayElement([
            "PURCHASE",
            "SERVICE",
            "TRANSFER",
            "ADJUSTMENT",
          ]),
          referenceId: faker.string.uuid(),
          reason: faker.helpers.arrayElement([
            "Stock receipt from supplier",
            "Issued for service",
            "Inter-store transfer",
            "Stock count adjustment",
            "Damaged stock write-off",
          ]),
          createdBy: faker.string.uuid(),
          movementDate: faker.date.recent({ days: 60 }),
        },
      });
    }

    // 7. Create Purchase Orders
    console.log("🛒 Creating purchase orders...");
    const purchaseOrders: any[] = [];
    for (let i = 0; i < 50; i++) {
      const supplier = faker.helpers.arrayElement(suppliers);
      const storeIndex = faker.number.int({ min: 0, max: storeIds.length - 1 });
      const status = faker.helpers.arrayElement([
        "DRAFT",
        "SENT",
        "CONFIRMED",
        "PARTIAL",
        "DELIVERED",
        "CANCELLED",
      ]);

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO${new Date().getFullYear()}${String(i + 1).padStart(
            4,
            "0"
          )}`,
          supplierId: supplier.id,
          storeId: storeIds[storeIndex],
          storeName: storeNames[storeIndex],
          orderDate: faker.date.recent({ days: 90 }),
          expectedDate: faker.date.future(),
          deliveryDate:
            status === "DELIVERED" ? faker.date.recent({ days: 15 }) : null,
          subtotal: 0, // Will be calculated after items
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
          status,
          urgencyLevel: faker.helpers.arrayElement([
            "LOW",
            "NORMAL",
            "HIGH",
            "URGENT",
          ]),
          notes: faker.lorem.sentence(),
          terms: "Standard terms and conditions apply",
          createdBy: faker.string.uuid(),
          approvedBy: status !== "DRAFT" ? faker.string.uuid() : null,
          receivedBy: status === "DELIVERED" ? faker.string.uuid() : null,
        },
      });
      purchaseOrders.push(purchaseOrder);

      // Create purchase order items
      const itemCount = faker.number.int({ min: 2, max: 8 });
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const sparePart = faker.helpers.arrayElement(spareParts);
        const orderedQuantity = faker.number.int({ min: 5, max: 50 });
        const receivedQuantity =
          status === "DELIVERED"
            ? orderedQuantity
            : status === "PARTIAL"
            ? faker.number.int({ min: 0, max: orderedQuantity })
            : 0;
        const unitCost = faker.number.float({
          min: 100,
          max: 2000,
          fractionDigits: 2,
        });
        const totalCost = orderedQuantity * unitCost;
        subtotal += totalCost;

        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            sparePartId: sparePart.id,
            orderedQuantity,
            receivedQuantity,
            unitCost,
            totalCost,
            status:
              receivedQuantity === orderedQuantity
                ? "RECEIVED"
                : receivedQuantity > 0
                ? "PARTIAL"
                : "PENDING",
          },
        });
      }

      // Update purchase order totals
      const discountAmount = subtotal * (supplier.discountPercent / 100);
      const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
      const totalAmount = subtotal - discountAmount + taxAmount;

      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
        },
      });
    }

    // 8. Create Service Requests and Part Requests
    console.log("🔧 Creating service requests and part requests...");
    const serviceRequests: any[] = [];

    for (let i = 0; i < 100; i++) {
      const storeIndex = faker.number.int({ min: 0, max: storeIds.length - 1 });
      const serviceType = faker.helpers.arrayElement([
        "Maintenance",
        "Repair",
        "Damage",
        "Inspection",
      ]);
      const priority = faker.helpers.arrayElement([
        "Low",
        "Medium",
        "High",
        "Critical",
        "Emergency",
      ]);
      const status = faker.helpers.arrayElement([
        "Open",
        "In Progress",
        "Waiting Parts",
        "Parts Issued",
        "Completed",
        "Closed",
      ]);

      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          ticketNumber: `TKT${new Date().getFullYear()}${String(i + 1).padStart(
            5,
            "0"
          )}`,
          vehicleId: faker.string.uuid(),
          vehicleNumber: `EV91-${faker.string.alphanumeric(6).toUpperCase()}`,
          technicianId: faker.string.uuid(),
          technicianName: faker.person.fullName(),
          serviceType,
          priority,
          status,
          description: `${serviceType} required for ${faker.helpers.arrayElement(
            vehicleModels
          )} - ${faker.lorem.sentence()}`,
          storeId: storeIds[storeIndex],
          storeName: storeNames[storeIndex],
          serviceAdvisorId: faker.string.uuid(),
          estimatedCost: faker.number.float({
            min: 500,
            max: 15000,
            fractionDigits: 2,
          }),
          actualCost:
            status === "Completed"
              ? faker.number.float({ min: 400, max: 16000, fractionDigits: 2 })
              : null,
          partsCost: faker.number.float({
            min: 200,
            max: 8000,
            fractionDigits: 2,
          }),
          laborCost: faker.number.float({
            min: 200,
            max: 5000,
            fractionDigits: 2,
          }),
          scheduledDate: faker.date.future(),
          startedAt: ["In Progress", "Completed", "Closed"].includes(status)
            ? faker.date.recent({ days: 10 })
            : null,
          completedAt: ["Completed", "Closed"].includes(status)
            ? faker.date.recent({ days: 5 })
            : null,
          externalServiceId: faker.string.uuid(),
          jobCardNumber: `JC${String(i + 1).padStart(6, "0")}`,
          customerName: faker.person.fullName(),
          customerPhone: faker.phone.number(),
        },
      });
      serviceRequests.push(serviceRequest);

      // Create part requests for this service
      const partRequestCount = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < partRequestCount; j++) {
        const sparePart = faker.helpers.arrayElement(spareParts);
        const requestedQuantity = faker.number.int({ min: 1, max: 5 });
        const requestStatus = faker.helpers.arrayElement([
          "Pending",
          "Approved",
          "Rejected",
          "Issued",
          "Installed",
          "Returned",
        ]);

        const partRequest = await prisma.sparePartRequest.create({
          data: {
            serviceRequestId: serviceRequest.id,
            sparePartId: sparePart.id,
            storeId: serviceRequest.storeId,
            requestedBy: serviceRequest.technicianId,
            requestedQuantity,
            urgency: faker.helpers.arrayElement([
              "Normal",
              "Urgent",
              "Emergency",
            ]),
            justification: `Required for ${serviceRequest.serviceType.toLowerCase()} - ${faker.lorem.sentence()}`,
            estimatedCost: sparePart.sellingPrice * requestedQuantity,
            status: requestStatus,
            approvalLevel: faker.number.int({ min: 1, max: 3 }),
            currentApprover:
              requestStatus === "Pending" ? faker.string.uuid() : null,
            approvedBy: ["Approved", "Issued", "Installed"].includes(
              requestStatus
            )
              ? faker.string.uuid()
              : null,
            approvedAt: ["Approved", "Issued", "Installed"].includes(
              requestStatus
            )
              ? faker.date.recent({ days: 3 })
              : null,
            rejectedBy:
              requestStatus === "Rejected" ? faker.string.uuid() : null,
            rejectedAt:
              requestStatus === "Rejected"
                ? faker.date.recent({ days: 2 })
                : null,
            rejectionReason:
              requestStatus === "Rejected"
                ? "Not authorized for this service type"
                : null,
            issuedQuantity: ["Issued", "Installed"].includes(requestStatus)
              ? requestedQuantity
              : 0,
            issuedBy: ["Issued", "Installed"].includes(requestStatus)
              ? faker.string.uuid()
              : null,
            issuedAt: ["Issued", "Installed"].includes(requestStatus)
              ? faker.date.recent({ days: 2 })
              : null,
            issuedCost: ["Issued", "Installed"].includes(requestStatus)
              ? sparePart.sellingPrice * requestedQuantity
              : null,
            technicianNotes: faker.lorem.sentence(),
            approverNotes: ["Approved", "Rejected"].includes(requestStatus)
              ? faker.lorem.sentence()
              : null,
          },
        });

        // Create approval history
        if (requestStatus !== "Pending") {
          await prisma.approvalHistory.create({
            data: {
              requestId: partRequest.id,
              level: 1,
              approverId: faker.string.uuid(),
              approverName: faker.person.fullName(),
              approverRole: "Service Manager",
              decision: requestStatus === "Rejected" ? "Rejected" : "Approved",
              comments: faker.lorem.sentence(),
              assignedAt: faker.date.recent({ days: 5 }),
              processedAt: faker.date.recent({ days: 3 }),
              requestValue: sparePart.sellingPrice * requestedQuantity,
              availableStock: faker.number.int({ min: 0, max: 50 }),
            },
          });
        }

        // Create stock reservation for approved/issued parts
        if (["Approved", "Issued", "Installed"].includes(requestStatus)) {
          const relatedInventory = inventoryLevels.find(
            (inv) =>
              inv.sparePartId === sparePart.id &&
              inv.storeId === serviceRequest.storeId
          );

          if (relatedInventory) {
            await prisma.stockReservation.create({
              data: {
                requestId: partRequest.id,
                sparePartId: sparePart.id,
                storeId: serviceRequest.storeId,
                inventoryLevelId: relatedInventory.id,
                reservedQuantity: requestedQuantity,
                reservedBy: faker.string.uuid(),
                reservedFor: serviceRequest.technicianId,
                reservationReason: "Service Request",
                status: requestStatus === "Installed" ? "Consumed" : "Active",
                expiresAt: faker.date.future(),
                releasedAt:
                  requestStatus === "Installed"
                    ? faker.date.recent({ days: 1 })
                    : null,
                reservedCost: sparePart.sellingPrice * requestedQuantity,
              },
            });
          }
        }

        // Create installed part record if part is installed
        if (requestStatus === "Installed") {
          await prisma.installedPart.create({
            data: {
              serviceRequestId: serviceRequest.id,
              sparePartId: sparePart.id,
              technicianId: serviceRequest.technicianId,
              storeId: serviceRequest.storeId,
              batchNumber: faker.string.alphanumeric(8).toUpperCase(),
              serialNumber: faker.string.alphanumeric(10).toUpperCase(),
              quantity: requestedQuantity,
              unitCost: sparePart.costPrice,
              totalCost: sparePart.costPrice * requestedQuantity,
              sellingPrice: sparePart.sellingPrice,
              totalRevenue: sparePart.sellingPrice * requestedQuantity,
              installedAt: faker.date.recent({ days: 2 }),
              installationNotes: `Successfully installed ${sparePart.name}`,
              warrantyMonths: sparePart.warranty,
              warrantyExpiry: faker.date.future(),
              warrantyTerms: "Standard manufacturer warranty",
              warrantyProvider: "OEM",
              expectedLife: faker.number.int({ min: 12, max: 60 }),
              qualityChecked: true,
              qualityRating: faker.number.int({ min: 4, max: 5 }),
              complianceCertified: true,
            },
          });
        }
      }

      // Create cost breakdown for completed services
      if (status === "Completed") {
        const partsCost = faker.number.float({
          min: 1000,
          max: 8000,
          fractionDigits: 2,
        });
        const laborCost = faker.number.float({
          min: 500,
          max: 3000,
          fractionDigits: 2,
        });
        const overheadCost = (partsCost + laborCost) * 0.1;
        const subtotal = partsCost + laborCost + overheadCost;
        const taxAmount = subtotal * 0.18;
        const totalCost = subtotal + taxAmount;

        await prisma.serviceCostBreakdown.create({
          data: {
            serviceRequestId: serviceRequest.id,
            partsCost,
            partsMarkup: partsCost * 0.2,
            partsTotal: partsCost * 1.2,
            laborHours: faker.number.float({
              min: 2,
              max: 8,
              fractionDigits: 1,
            }),
            laborRate: faker.number.float({
              min: 300,
              max: 800,
              fractionDigits: 2,
            }),
            laborCost,
            laborMarkup: laborCost * 0.15,
            laborTotal: laborCost * 1.15,
            overheadCost,
            subtotal,
            taxPercent: 18,
            taxAmount,
            totalCost,
            totalRevenue: totalCost,
            netMargin: totalCost * 0.25,
            marginPercent: 25,
            calculatedBy: faker.string.uuid(),
            approvedBy: faker.string.uuid(),
            approvedAt: faker.date.recent({ days: 1 }),
            notes: "Cost breakdown for completed service",
          },
        });
      }
    }

    // 9. Create Technician Limits
    console.log("👨‍🔧 Creating technician limits...");
    const technicianIds = Array.from(
      new Set(serviceRequests.map((sr) => sr.technicianId))
    );

    for (const technicianId of technicianIds.slice(0, 20)) {
      // Create general limits
      await prisma.technicianLimit.create({
        data: {
          technicianId,
          technicianName: faker.person.fullName(),
          storeId: faker.helpers.arrayElement(storeIds),
          limitType: "VALUE",
          maxValuePerRequest: faker.number.float({
            min: 2000,
            max: 10000,
            fractionDigits: 2,
          }),
          maxValuePerDay: faker.number.float({
            min: 5000,
            max: 25000,
            fractionDigits: 2,
          }),
          maxValuePerMonth: faker.number.float({
            min: 50000,
            max: 200000,
            fractionDigits: 2,
          }),
          requiresApproval: true,
          approverLevel: 1,
          autoApproveBelow: faker.number.float({
            min: 500,
            max: 2000,
            fractionDigits: 2,
          }),
          isActive: true,
        },
      });

      // Create category-specific limits for high-value categories
      const highValueCategory = createdCategories.find(
        (cat) => cat.name === "Battery & Power System"
      );
      if (highValueCategory) {
        await prisma.technicianLimit.create({
          data: {
            technicianId,
            technicianName: faker.person.fullName(),
            storeId: faker.helpers.arrayElement(storeIds),
            categoryId: highValueCategory.id,
            limitType: "VALUE",
            maxValuePerRequest: faker.number.float({
              min: 5000,
              max: 15000,
              fractionDigits: 2,
            }),
            maxValuePerDay: faker.number.float({
              min: 10000,
              max: 30000,
              fractionDigits: 2,
            }),
            maxValuePerMonth: faker.number.float({
              min: 100000,
              max: 300000,
              fractionDigits: 2,
            }),
            requiresApproval: true,
            approverLevel: 2,
            autoApproveBelow: faker.number.float({
              min: 1000,
              max: 3000,
              fractionDigits: 2,
            }),
            isActive: true,
          },
        });
      }
    }

    // 10. Create Price History
    console.log("💰 Creating price history...");
    for (const sparePart of spareParts.slice(0, 50)) {
      // Create 2-5 price history entries for each part
      const historyCount = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < historyCount; i++) {
        const effectiveDate = faker.date.past({ years: 1 });
        const costPrice =
          sparePart.costPrice *
          faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 });
        const markupPercent = faker.number.float({
          min: 15,
          max: 35,
          fractionDigits: 2,
        });
        const sellingPrice = costPrice * (1 + markupPercent / 100);

        await prisma.partPriceHistory.create({
          data: {
            sparePartId: sparePart.id,
            costPrice,
            sellingPrice,
            mrp: sellingPrice * 1.2,
            markupPercent,
            changeReason: faker.helpers.arrayElement([
              "Supplier Price Change",
              "Market Adjustment",
              "Inflation Adjustment",
              "Volume Discount",
              "Promotional Pricing",
            ]),
            effectiveDate,
            changedBy: faker.string.uuid(),
          },
        });
      }

      // Create supplier price history
      await prisma.supplierPriceHistory.create({
        data: {
          supplierId: sparePart.supplierId,
          sparePartId: sparePart.id,
          unitCost: sparePart.costPrice,
          minimumOrder: faker.number.int({ min: 10, max: 100 }),
          discountTiers: JSON.stringify([
            { quantity: 50, discount: 5 },
            { quantity: 100, discount: 10 },
            { quantity: 200, discount: 15 },
          ]),
          effectiveFrom: faker.date.past({ years: 1 }),
          effectiveTo: faker.date.future({ years: 1 }),
          isActive: true,
        },
      });
    }

    // 11. Create Analytics Data
    console.log("📈 Creating analytics data...");
    const periodTypes = ["DAILY", "WEEKLY", "MONTHLY"];
    const now = new Date();

    for (const storeId of storeIds.slice(0, 5)) {
      for (const periodType of periodTypes) {
        const daysBack =
          periodType === "DAILY" ? 30 : periodType === "WEEKLY" ? 12 : 6;

        for (let i = 0; i < daysBack; i++) {
          const periodDate = new Date(now);
          if (periodType === "DAILY") {
            periodDate.setDate(now.getDate() - i);
          } else if (periodType === "WEEKLY") {
            periodDate.setDate(now.getDate() - i * 7);
          } else {
            periodDate.setMonth(now.getMonth() - i);
          }

          await prisma.inventoryAnalytics.create({
            data: {
              periodType,
              periodDate,
              storeId,
              storeName: storeNames[storeIds.indexOf(storeId)],
              totalItems: faker.number.int({ min: 100, max: 500 }),
              totalValue: faker.number.float({
                min: 100000,
                max: 1000000,
                fractionDigits: 2,
              }),
              totalCostValue: faker.number.float({
                min: 80000,
                max: 800000,
                fractionDigits: 2,
              }),
              lowStockItems: faker.number.int({ min: 5, max: 25 }),
              outOfStockItems: faker.number.int({ min: 0, max: 10 }),
              excessStockItems: faker.number.int({ min: 10, max: 50 }),
              totalInbound: faker.number.int({ min: 20, max: 100 }),
              totalOutbound: faker.number.int({ min: 15, max: 80 }),
              totalAdjustments: faker.number.int({ min: 0, max: 10 }),
              stockTurnover: faker.number.float({
                min: 0.5,
                max: 2.5,
                fractionDigits: 2,
              }),
              totalPurchases: faker.number.float({
                min: 10000,
                max: 100000,
                fractionDigits: 2,
              }),
              totalSales: faker.number.float({
                min: 15000,
                max: 120000,
                fractionDigits: 2,
              }),
              totalMargin: faker.number.float({
                min: 3000,
                max: 30000,
                fractionDigits: 2,
              }),
              averageMargin: faker.number.float({
                min: 15,
                max: 35,
                fractionDigits: 2,
              }),
              fastMovingItems: faker.number.int({ min: 20, max: 80 }),
              slowMovingItems: faker.number.int({ min: 30, max: 100 }),
              deadStockItems: faker.number.int({ min: 5, max: 20 }),
            },
          });
        }
      }
    }

    // Create sales analytics for categories
    for (const category of createdCategories
      .filter((cat) => cat.level === 1)
      .slice(0, 5)) {
      for (let i = 0; i < 12; i++) {
        const periodDate = new Date();
        periodDate.setMonth(now.getMonth() - i);

        await prisma.salesAnalytics.create({
          data: {
            periodType: "MONTHLY",
            periodDate,
            categoryId: category.id,
            totalSales: faker.number.float({
              min: 50000,
              max: 500000,
              fractionDigits: 2,
            }),
            totalCost: faker.number.float({
              min: 40000,
              max: 400000,
              fractionDigits: 2,
            }),
            totalMargin: faker.number.float({
              min: 10000,
              max: 100000,
              fractionDigits: 2,
            }),
            totalTransactions: faker.number.int({ min: 100, max: 1000 }),
            averageTransactionValue: faker.number.float({
              min: 500,
              max: 5000,
              fractionDigits: 2,
            }),
            topSellingPartId: faker.helpers.arrayElement(spareParts).id,
            topProfitablePartId: faker.helpers.arrayElement(spareParts).id,
          },
        });
      }
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`
📊 Summary of created test data:
   📁 Categories: ${createdCategories.length} (${categoryHierarchy.length} parent + children)
   🏭 Suppliers: ${suppliers.length} with contacts
   🔧 Spare Parts: ${spareParts.length} with specifications
   📦 Inventory Levels: ${inventoryLevels.length} across ${storeIds.length} stores
   📋 Purchase Orders: ${purchaseOrders.length} with items
   🔧 Service Requests: ${serviceRequests.length} with part requests
   📊 Stock Movements: 500+ movement records
   👨‍🔧 Technician Limits: ${technicianIds.length} technicians configured
   💰 Price History: Historical pricing data
   📈 Analytics: Performance metrics and trends
   ⚙️ System Config: ${systemConfigs.length} configuration settings
    `);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("💥 Fatal error during seeding:", e);
  process.exit(1);
});
