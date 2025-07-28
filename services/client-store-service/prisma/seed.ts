import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample clients
  const client1 = await prisma.client.create({
    data: {
      clientCode: 'FPG001',
      clientType: 'business',
      name: 'Food Palace Restaurant Group',
      primaryContactPerson: 'Rajesh Sharma',
      email: 'admin@foodpalace.com',
      phone: '+91-9876543210',
      headquartersCity: 'Mumbai',
      headquartersState: 'Maharashtra',
      registrationNumber: 'REG001',
      panNumber: 'ABCDE1234F',
      gstNumber: 'GSTIN001',
      businessSize: 'SME',
      creditLimit: 50000.00,
      preferredPaymentMethod: 'bank_transfer',
      baseOrderRate: 30.0,
      bulkBonusEnabled: true,
      bulkOrdersThreshold: 15,
      bulkBonusAmount: 75.0,
      weeklyBonusEnabled: true,
      weeklyOrderTarget: 80,
      weeklyBonusAmount: 600.0,
      clientStatus: 'Active',
      clientPriority: 'High'
    }
  });

  const client2 = await prisma.client.create({
    data: {
      clientCode: 'QMR002',
      clientType: 'enterprise',
      name: 'QuickMart Retail Chain',
      primaryContactPerson: 'Priya Singh',
      email: 'operations@quickmart.com',
      phone: '+91-9876543211',
      headquartersCity: 'Delhi',
      headquartersState: 'Delhi',
      registrationNumber: 'REG002',
      panNumber: 'FGHIJ5678K',
      gstNumber: 'GSTIN002',
      businessSize: 'Large Enterprise',
      creditLimit: 75000.00,
      preferredPaymentMethod: 'digital_wallet',
      baseOrderRate: 28.0,
      bulkBonusEnabled: true,
      bulkOrdersThreshold: 20,
      bulkBonusAmount: 100.0,
      weeklyBonusEnabled: true,
      weeklyOrderTarget: 100,
      weeklyBonusAmount: 800.0,
      clientStatus: 'Active',
      clientPriority: 'High'
    }
  });

  console.log('✅ Database seeding completed!');
  console.log(`📊 Created:`);
  console.log(`   - ${client1.name} (Client)`);
  console.log(`   - ${client2.name} (Client)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
