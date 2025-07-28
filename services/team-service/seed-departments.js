const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDepartments() {
  try {
    console.log('Checking existing departments...');
    
    const existingDepartments = await prisma.department.findMany();
    console.log('Existing departments:', existingDepartments);
    
    if (existingDepartments.length === 0) {
      console.log('No departments found. Creating seed data...');
      
      const departments = [
        { name: 'Engineering', description: 'Software Development and Technology' },
        { name: 'Marketing', description: 'Brand and Growth Marketing' },
        { name: 'Sales', description: 'Revenue Generation and Customer Acquisition' },
        { name: 'Human Resources', description: 'People Operations and Talent Management' },
        { name: 'Operations', description: 'Business Operations and Process Management' },
        { name: 'Finance', description: 'Financial Planning and Analysis' },
      ];
      
      for (const dept of departments) {
        await prisma.department.create({
          data: dept
        });
      }
      
      console.log('Seed departments created successfully!');
    } else {
      console.log('Departments already exist. No seeding needed.');
    }
    
    // Show final list
    const allDepartments = await prisma.department.findMany();
    console.log('All departments:', allDepartments);
    
  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDepartments();
