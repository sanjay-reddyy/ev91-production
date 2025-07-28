"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedOEMsAndModels = seedOEMsAndModels;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedOEMsAndModels() {
    console.log('🌱 Seeding OEMs and Vehicle Models...');
    const oemsData = [
        {
            name: 'Honda',
            displayName: 'Honda Motor Co.',
            code: 'HON',
            country: 'Japan',
            website: 'https://www.honda.com',
            isActive: true,
            isPreferred: true
        },
        {
            name: 'Bajaj',
            displayName: 'Bajaj Auto Limited',
            code: 'BAJ',
            country: 'India',
            website: 'https://www.bajajauto.com',
            isActive: true,
            isPreferred: true
        },
        {
            name: 'TVS',
            displayName: 'TVS Motor Company',
            code: 'TVS',
            country: 'India',
            website: 'https://www.tvsmotor.com',
            isActive: true,
            isPreferred: true
        },
        {
            name: 'Hero',
            displayName: 'Hero MotoCorp',
            code: 'HER',
            country: 'India',
            website: 'https://www.heromotocorp.com',
            isActive: true,
            isPreferred: true
        },
        {
            name: 'Ather',
            displayName: 'Ather Energy',
            code: 'ATH',
            country: 'India',
            website: 'https://www.atherenergy.com',
            isActive: true,
            isPreferred: true
        },
        {
            name: 'Ola Electric',
            displayName: 'Ola Electric Mobility',
            code: 'OLA',
            country: 'India',
            website: 'https://olaelectric.com',
            isActive: true,
            isPreferred: true
        }
    ];
    const oems = [];
    for (const oemData of oemsData) {
        const oem = await prisma.oEM.upsert({
            where: { name: oemData.name },
            update: oemData,
            create: oemData
        });
        oems.push(oem);
        console.log(`✅ Created/Updated OEM: ${oem.name}`);
    }
    const modelsData = [
        {
            oemName: 'Honda',
            name: 'Activa 6G',
            displayName: 'Honda Activa 6G',
            modelCode: 'ACT6G',
            category: 'Scooter',
            segment: 'Entry',
            vehicleType: '2-Wheeler',
            fuelType: 'Petrol',
            engineCapacity: '109.51cc',
            maxSpeed: 83,
            range: 60,
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Honda',
            name: 'Dio',
            displayName: 'Honda Dio',
            modelCode: 'DIO',
            category: 'Scooter',
            segment: 'Entry',
            vehicleType: '2-Wheeler',
            fuelType: 'Petrol',
            engineCapacity: '109.51cc',
            maxSpeed: 83,
            range: 60,
            seatingCapacity: 2,
            isActive: true,
            isPopular: false
        },
        {
            oemName: 'Bajaj',
            name: 'Pulsar 150',
            displayName: 'Bajaj Pulsar 150',
            modelCode: 'PUL150',
            category: 'Motorcycle',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Petrol',
            engineCapacity: '149.5cc',
            maxSpeed: 120,
            range: 50,
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Bajaj',
            name: 'Chetak Electric',
            displayName: 'Bajaj Chetak Electric',
            modelCode: 'CHETEK',
            category: 'Scooter',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '3.0kWh',
            maxSpeed: 60,
            range: 95,
            chargingTime: '5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'TVS',
            name: 'Jupiter',
            displayName: 'TVS Jupiter',
            modelCode: 'JUP',
            category: 'Scooter',
            segment: 'Entry',
            vehicleType: '2-Wheeler',
            fuelType: 'Petrol',
            engineCapacity: '109.7cc',
            maxSpeed: 82,
            range: 62,
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'TVS',
            name: 'iQube Electric',
            displayName: 'TVS iQube Electric',
            modelCode: 'IQUBE',
            category: 'Scooter',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '4.56kWh',
            maxSpeed: 78,
            range: 140,
            chargingTime: '4.5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Hero',
            name: 'Splendor Plus',
            displayName: 'Hero Splendor Plus',
            modelCode: 'SPL+',
            category: 'Motorcycle',
            segment: 'Entry',
            vehicleType: '2-Wheeler',
            fuelType: 'Petrol',
            engineCapacity: '97.2cc',
            maxSpeed: 85,
            range: 68,
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Ather',
            name: '450X',
            displayName: 'Ather 450X',
            modelCode: '450X',
            category: 'Scooter',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '3.7kWh',
            maxSpeed: 90,
            range: 146,
            chargingTime: '6.5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Ather',
            name: '450 Plus',
            displayName: 'Ather 450 Plus',
            modelCode: '450+',
            category: 'Scooter',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '3.7kWh',
            maxSpeed: 70,
            range: 100,
            chargingTime: '6.5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: false
        },
        {
            oemName: 'Ola Electric',
            name: 'S1 Pro',
            displayName: 'Ola S1 Pro',
            modelCode: 'S1PRO',
            category: 'Scooter',
            segment: 'Premium',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '4.0kWh',
            maxSpeed: 115,
            range: 181,
            chargingTime: '6.5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        },
        {
            oemName: 'Ola Electric',
            name: 'S1',
            displayName: 'Ola S1',
            modelCode: 'S1',
            category: 'Scooter',
            segment: 'Standard',
            vehicleType: '2-Wheeler',
            fuelType: 'Electric',
            batteryCapacity: '3.97kWh',
            maxSpeed: 90,
            range: 141,
            chargingTime: '6.5 hours',
            seatingCapacity: 2,
            isActive: true,
            isPopular: true
        }
    ];
    for (const modelData of modelsData) {
        const oem = oems.find(o => o.name === modelData.oemName);
        if (!oem) {
            console.error(`❌ OEM not found: ${modelData.oemName}`);
            continue;
        }
        const { oemName, ...modelCreateData } = modelData;
        const model = await prisma.vehicleModel.upsert({
            where: {
                oemId_modelCode: {
                    oemId: oem.id,
                    modelCode: modelData.modelCode
                }
            },
            update: { ...modelCreateData, oemId: oem.id },
            create: { ...modelCreateData, oemId: oem.id }
        });
        console.log(`✅ Created/Updated Model: ${oem.name} ${model.name}`);
    }
    console.log('🎉 Seeding completed successfully!');
}
async function main() {
    try {
        await seedOEMsAndModels();
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map