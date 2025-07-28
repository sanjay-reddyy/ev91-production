@echo off
echo 🚀 Setting up Teams API database...

cd /d "c:\voice_project\EV91-Platform\services\auth-service"

echo.
echo Step 1: Generating Prisma client with Teams support...
call npx prisma generate

echo.
echo Step 2: Applying database schema changes...
call npx prisma db push

echo.
echo Step 3: Verifying database setup...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check if teams table exists and has the right columns
    const tableInfo = await prisma.$queryRaw\`PRAGMA table_info(teams)\`;
    console.log('📋 Teams table structure:');
    tableInfo.forEach(col => {
      console.log(\`  - \${col.name}: \${col.type}\`);
    });
    
    // Try to query teams
    const teams = await prisma.team.findMany();
    console.log(\`✅ Teams table accessible, found \${teams.length} teams\`);
    
    console.log('🎉 Teams API database is ready!');
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
"

echo.
echo 🏁 Teams API setup completed!
echo You can now start the service with: npm run dev
pause
