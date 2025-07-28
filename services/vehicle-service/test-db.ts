import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const oemCount = await prisma.oEM.count();
    console.log(`📊 Current OEM count: ${oemCount}`);
    
    // Test creating a simple OEM
    const testOem = await prisma.oEM.upsert({
      where: { name: 'TestOEM' },
      update: { displayName: 'Test OEM Updated' },
      create: {
        name: 'TestOEM',
        displayName: 'Test OEM',
        code: 'TEST',
        isActive: true,
        isPreferred: false
      }
    });
    
    console.log('✅ Test OEM created/updated:', testOem.name);
    
    // Clean up test OEM
    await prisma.oEM.delete({ where: { id: testOem.id } });
    console.log('🗑️ Test OEM cleaned up');
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
