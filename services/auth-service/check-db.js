const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database connection...');
    
    // Try to query the database
    const result = await prisma.$queryRaw`PRAGMA table_info(teams)`;
    console.log('Teams table structure:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // If teams table doesn't exist, try to see what tables do exist
    try {
      const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
      console.log('Available tables:', tables);
    } catch (e) {
      console.error('Cannot access database:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
