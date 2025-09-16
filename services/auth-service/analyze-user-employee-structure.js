const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeUserEmployeeStructure() {
  try {
    console.log('🔍 COMPREHENSIVE ANALYSIS: User vs Employee Tables\n');

    // 1. Analyze User Table
    console.log('=== USER TABLE ANALYSIS ===');
    const users = await prisma.user.findMany({
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true
          }
        },
        sessions: true
      }
    });

    console.log(`📊 Total Users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role (legacy): ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Has Employee Record: ${user.employee ? '✅ YES' : '❌ NO'}`);
      
      if (user.employee) {
        console.log(`   Employee ID: ${user.employee.employeeId}`);
        console.log(`   Position: ${user.employee.position || 'N/A'}`);
        console.log(`   Department: ${user.employee.departmentId}`);
        console.log(`   Team: ${user.employee.teamId || 'N/A'}`);
      }
      
      console.log(`   System Roles: ${user.userRoles.length > 0 ? user.userRoles.map(ur => ur.role.name).join(', ') : 'None'}`);
      console.log(`   Active Sessions: ${user.sessions.length}`);
      console.log('');
    });

    // 2. Analyze Employee Table
    console.log('=== EMPLOYEE TABLE ANALYSIS ===');
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        department: true,
        team: true,
        manager: true,
        subordinates: true
      }
    });

    console.log(`📊 Total Employees: ${employees.length}\n`);

    employees.forEach((employee, index) => {
      console.log(`👷 Employee ${index + 1}:`);
      console.log(`   ID: ${employee.id}`);
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Position: ${employee.position || 'N/A'}`);
      console.log(`   Department: ${employee.department ? employee.department.name : 'N/A'}`);
      console.log(`   Team: ${employee.team ? employee.team.name : 'N/A'}`);
      console.log(`   Manager: ${employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'N/A'}`);
      console.log(`   Subordinates: ${employee.subordinates.length}`);
      console.log(`   Linked User: ${employee.user ? employee.user.email : '❌ NO USER LINK'}`);
      console.log(`   Active: ${employee.isActive}`);
      console.log('');
    });

    // 3. Data Integrity Analysis
    console.log('=== DATA INTEGRITY ANALYSIS ===');
    
    const usersWithoutEmployees = users.filter(u => !u.employee);
    const employeesWithoutUsers = employees.filter(e => !e.user);
    
    console.log(`🔍 Users without Employee records: ${usersWithoutEmployees.length}`);
    usersWithoutEmployees.forEach(user => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    console.log(`🔍 Employees without User records: ${employeesWithoutUsers.length}`);
    employeesWithoutUsers.forEach(employee => {
      console.log(`   - ${employee.email} (${employee.firstName} ${employee.lastName})`);
    });

    // 4. Schema Design Analysis
    console.log('\n=== SCHEMA DESIGN ANALYSIS ===');
    console.log('📋 Current Design Issues:');
    
    if (usersWithoutEmployees.length > 0) {
      console.log('❌ ISSUE 1: Users exist without Employee records');
      console.log('   Impact: These users cannot access employee-only endpoints');
      console.log('   Users affected: System admins, external users');
    }
    
    console.log('❌ ISSUE 2: Duplicate data fields');
    console.log('   - User table has: firstName, lastName, email, phone');
    console.log('   - Employee table has: firstName, lastName, email, phone');
    console.log('   Impact: Data inconsistency risk, maintenance overhead');
    
    console.log('❌ ISSUE 3: Legacy role field in User table');
    console.log('   - User.role (string) vs UserRole (proper RBAC)');
    console.log('   Impact: Confusion between old and new permission systems');

    // 5. Architecture Recommendations
    console.log('\n=== ARCHITECTURE RECOMMENDATIONS ===');
    console.log('🎯 RECOMMENDED APPROACH: User-centric with Employee extension');
    console.log('');
    console.log('📌 Option 1: Keep current design but fix issues');
    console.log('   ✅ User table = Authentication & basic profile');
    console.log('   ✅ Employee table = HR/organizational data');
    console.log('   ✅ Create Employee records for all admin users');
    console.log('   ✅ Remove duplicate fields from Employee table');
    console.log('');
    console.log('📌 Option 2: Merge tables (simpler but less flexible)');
    console.log('   ✅ Single User table with optional organizational fields');
    console.log('   ❌ Less separation of concerns');
    console.log('   ❌ More complex for external users');

    // 6. Check middleware expectations
    console.log('\n=== MIDDLEWARE REQUIREMENTS ANALYSIS ===');
    console.log('🔍 Current middleware expects:');
    console.log('   - Employee record must exist for organizational endpoints');
    console.log('   - User must be linked to Employee for team/department access');
    console.log('   - Admin users need Employee records to manage teams');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUserEmployeeStructure();
