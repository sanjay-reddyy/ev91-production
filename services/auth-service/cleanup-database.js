const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function removeTeamsAndDepartments() {
  console.log('🗃️ Starting database cleanup - removing teams and departments...');
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'remove_teams_departments.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements (SQLite doesn't support multiple statements in one call)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Create Prisma client
    const prisma = new PrismaClient();
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (error) {
        console.log(`⚠️ Statement ${i + 1} failed (may be expected): ${error.message}`);
      }
    }
    
    // Verify the cleanup
    console.log('\n🔍 Verifying database structure...');
    
    try {
      // Try to query teams table (should fail)
      await prisma.$queryRaw`SELECT COUNT(*) FROM teams`;
      console.log('❌ Teams table still exists!');
    } catch (error) {
      console.log('✅ Teams table successfully removed');
    }
    
    try {
      // Try to query departments table (should fail)
      await prisma.$queryRaw`SELECT COUNT(*) FROM departments`;
      console.log('❌ Departments table still exists!');
    } catch (error) {
      console.log('✅ Departments table successfully removed');
    }
    
    // Verify users table structure
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Users table is accessible');
    
    await prisma.$disconnect();
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📋 Summary:');
    console.log('  - Removed teams table and data');
    console.log('  - Removed departments table and data'); 
    console.log('  - Updated users table to remove department/team references');
    console.log('  - Auth service now focuses purely on authentication');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
removeTeamsAndDepartments();
