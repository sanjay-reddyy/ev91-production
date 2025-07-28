const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTeams() {
  try {
    console.log('Checking teams in database...');
    const teams = await prisma.team.findMany();
    console.log('Teams found:', teams.length);
    
    if (teams.length > 0) {
      console.log('Team details:');
      teams.forEach(team => {
        console.log(`- ID: ${team.id}, Name: ${team.name}, Department: ${team.departmentId}`);
      });
    } else {
      console.log('No teams found in database');
    }
    
  } catch (error) {
    console.error('Error checking teams:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeams();
