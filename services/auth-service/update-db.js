const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Updating database schema...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add_team_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(statement => statement.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await prisma.$executeRawUnsafe(statement.trim());
      }
    }
    
    console.log('✅ Database updated successfully!');
    
    // Verify the changes
    const teams = await prisma.team.findMany();
    console.log('Current teams:', teams);
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase();
