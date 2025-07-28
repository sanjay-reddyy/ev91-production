import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTeamsTable() {
  try {
    console.log('🔄 Starting teams table migration...');
    
    // First, check if the database is accessible
    const tablesResult = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='teams'
    `;
    
    console.log('📋 Database accessible, teams table exists:', tablesResult);
    
    // Check current table structure
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(teams)`;
    console.log('📊 Current table structure:', tableInfo);
    
    // Add missing columns one by one
    const alterQueries = [
      `ALTER TABLE teams ADD COLUMN city TEXT DEFAULT 'Unknown'`,
      `ALTER TABLE teams ADD COLUMN country TEXT DEFAULT 'Unknown'`, 
      `ALTER TABLE teams ADD COLUMN memberCount INTEGER DEFAULT 0`,
      `ALTER TABLE teams ADD COLUMN maxMembers INTEGER DEFAULT 10`,
      `ALTER TABLE teams ADD COLUMN skills TEXT`,
      `ALTER TABLE teams ADD COLUMN status TEXT DEFAULT 'Active'`
    ];
    
    for (const query of alterQueries) {
      try {
        console.log(`⚡ Executing: ${query}`);
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Success');
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('⚠️  Column already exists, skipping');
        } else {
          console.error('❌ Error:', error.message);
        }
      }
    }
    
    // Update NOT NULL constraints after adding columns
    console.log('🔄 Updating NOT NULL constraints...');
    
    await prisma.$executeRawUnsafe(`
      UPDATE teams SET 
        city = COALESCE(city, 'Unknown'),
        country = COALESCE(country, 'Unknown'),
        memberCount = COALESCE(memberCount, 0),
        maxMembers = COALESCE(maxMembers, 10),
        status = COALESCE(status, 'Active')
      WHERE city IS NULL OR country IS NULL OR memberCount IS NULL OR maxMembers IS NULL OR status IS NULL
    `);
    
    // Verify the final structure
    const finalStructure = await prisma.$queryRaw`PRAGMA table_info(teams)`;
    console.log('🎉 Final table structure:', finalStructure);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTeamsTable();
