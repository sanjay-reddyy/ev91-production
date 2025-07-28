import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test client retrieval
    const clients = await prisma.client.findMany({
      take: 5,
      include: {
        stores: true
      }
    });
    
    console.log(`✅ Found ${clients.length} clients in database:`);
    
    clients.forEach(client => {
      console.log(`   📦 ${client.name} (${client.clientCode})`);
      console.log(`      Type: ${client.clientType}`);
      console.log(`      Contact: ${client.primaryContactPerson}`);
      console.log(`      Base Rate: ₹${client.baseOrderRate}/order`);
      console.log(`      Stores: ${client.stores.length}`);
      console.log('');
    });

    // Test store functionality if we had stores
    const storeCount = await prisma.store.count();
    console.log(`📊 Total stores in database: ${storeCount}`);

    // Test rider earnings functionality
    const earningsCount = await prisma.riderEarning.count();
    console.log(`💰 Total rider earning records: ${earningsCount}`);

    console.log('✅ Database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
