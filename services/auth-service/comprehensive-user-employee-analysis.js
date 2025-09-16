const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function analyzeUserEmployeeTables() {
  console.log("🔍 COMPREHENSIVE USER vs EMPLOYEE TABLE ANALYSIS\n");
  console.log("=" * 60 + "\n");

  try {
    // 1. Get schema structure for both tables
    console.log("📋 1. TABLE STRUCTURE COMPARISON\n");

    // Get all users with their data
    const users = await prisma.user.findMany({
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Get all employees with their data
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        department: true,
        team: true,
        manager: true,
        subordinates: true,
        managedTeams: true,
      },
    });

    console.log("USER TABLE FIELDS:");
    console.log("✓ id (Primary Key)");
    console.log("✓ email (Unique)");
    console.log("✓ firstName");
    console.log("✓ lastName");
    console.log("✓ password");
    console.log("✓ isActive");
    console.log("✓ emailVerified");
    console.log("✓ emailVerificationToken");
    console.log("✓ passwordResetToken");
    console.log("✓ passwordResetExpires");
    console.log("✓ lastLoginAt");
    console.log("✓ role (Legacy field - should be removed)");
    console.log("✓ createdAt");
    console.log("✓ updatedAt");
    console.log("Relations: employee (1:1), userRoles (1:many)\n");

    console.log("EMPLOYEE TABLE FIELDS:");
    console.log("✓ id (Primary Key)");
    console.log("✓ userId (Foreign Key to User - Unique)");
    console.log("✓ employeeId (Unique employee identifier)");
    console.log("✓ firstName (DUPLICATE of User.firstName)");
    console.log("✓ lastName (DUPLICATE of User.lastName)");
    console.log("✓ email (DUPLICATE of User.email)");
    console.log("✓ phone");
    console.log("✓ position");
    console.log("✓ departmentId");
    console.log("✓ teamId");
    console.log("✓ managerId");
    console.log("✓ hireDate");
    console.log("✓ isActive (DUPLICATE of User.isActive)");
    console.log("✓ createdAt");
    console.log("✓ updatedAt");
    console.log(
      "Relations: user (1:1), department, team, manager, subordinates, managedTeams\n"
    );

    // 2. Data comparison
    console.log("📊 2. DATA COMPARISON\n");
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Employees: ${employees.length}`);

    if (users.length > 0) {
      console.log("\n🔍 USER DATA ANALYSIS:");
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. USER: ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   ✅ Active: ${user.isActive}`);
        console.log(`   📧 Email Verified: ${user.emailVerified}`);
        console.log(
          `   👑 Roles: ${
            user.userRoles.map((ur) => ur.role.name).join(", ") || "None"
          }`
        );
        console.log(
          `   🏢 Has Employee Record: ${user.employee ? "YES" : "NO"}`
        );

        if (user.employee) {
          console.log(`   🏢 Employee ID: ${user.employee.employeeId}`);
          console.log(`   🏢 Position: ${user.employee.position || "N/A"}`);
          console.log(`   🏢 Department: ${user.employee.departmentId}`);
          console.log(`   🏢 Team: ${user.employee.teamId || "N/A"}`);
        }
      });
    }

    if (employees.length > 0) {
      console.log("\n🔍 EMPLOYEE DATA ANALYSIS:");
      employees.forEach((employee, index) => {
        console.log(
          `\n${index + 1}. EMPLOYEE: ${employee.firstName} ${employee.lastName}`
        );
        console.log(`   📧 Email: ${employee.email}`);
        console.log(`   🆔 Employee ID: ${employee.employeeId}`);
        console.log(`   🆔 User ID: ${employee.userId}`);
        console.log(`   ✅ Active: ${employee.isActive}`);
        console.log(`   🏢 Position: ${employee.position || "N/A"}`);
        console.log(`   🏬 Department: ${employee.department?.name || "N/A"}`);
        console.log(`   👥 Team: ${employee.team?.name || "N/A"}`);
        console.log(
          `   👑 User Roles: ${
            employee.user?.userRoles.map((ur) => ur.role.name).join(", ") ||
            "None"
          }`
        );
      });
    }

    // 3. Data inconsistency check
    console.log("\n⚠️  3. DATA INCONSISTENCY ANALYSIS\n");

    let inconsistencies = [];

    users.forEach((user) => {
      if (user.employee) {
        // Check for data mismatches
        if (user.firstName !== user.employee.firstName) {
          inconsistencies.push(
            `${user.email}: firstName mismatch (User: "${user.firstName}" vs Employee: "${user.employee.firstName}")`
          );
        }
        if (user.lastName !== user.employee.lastName) {
          inconsistencies.push(
            `${user.email}: lastName mismatch (User: "${user.lastName}" vs Employee: "${user.employee.lastName}")`
          );
        }
        if (user.email !== user.employee.email) {
          inconsistencies.push(
            `${user.email}: email mismatch (User: "${user.email}" vs Employee: "${user.employee.email}")`
          );
        }
        if (user.isActive !== user.employee.isActive) {
          inconsistencies.push(
            `${user.email}: isActive mismatch (User: ${user.isActive} vs Employee: ${user.employee.isActive})`
          );
        }
      }
    });

    if (inconsistencies.length > 0) {
      console.log("❌ FOUND INCONSISTENCIES:");
      inconsistencies.forEach((issue) => console.log(`   - ${issue}`));
    } else {
      console.log(
        "✅ No data inconsistencies found between User and Employee records"
      );
    }

    // 4. Schema design analysis
    console.log("\n🏗️  4. SCHEMA DESIGN ANALYSIS\n");

    console.log("CURRENT ISSUES:");
    console.log("❌ Data Duplication:");
    console.log("   - firstName exists in both User and Employee");
    console.log("   - lastName exists in both User and Employee");
    console.log("   - email exists in both User and Employee");
    console.log("   - isActive exists in both User and Employee");

    console.log("\n❌ Schema Confusion:");
    console.log(
      "   - User table has legacy 'role' field (should use UserRole)"
    );
    console.log("   - Employee table duplicates core identity data");
    console.log("   - Unclear separation of concerns");

    console.log("\n❌ Middleware Confusion:");
    console.log("   - Some routes use authMiddleware (User-based)");
    console.log("   - Some routes use authenticateEmployee (Employee-based)");
    console.log("   - Inconsistent access patterns");

    // 5. Recommended solution
    console.log("\n💡 5. RECOMMENDED SOLUTION\n");

    console.log("OPTION 1: Employee as Extension (RECOMMENDED)");
    console.log("✅ Keep User table as primary identity/authentication");
    console.log("✅ Employee table only contains work-specific data:");
    console.log("   - employeeId (unique work identifier)");
    console.log("   - position, departmentId, teamId, managerId");
    console.log("   - hireDate, phone (work-specific)");
    console.log("   - Remove: firstName, lastName, email, isActive");
    console.log("✅ All authentication uses User table");
    console.log("✅ Employee data is optional extension for org features");

    console.log("\nOPTION 2: Single User Table");
    console.log("❓ Merge all Employee fields into User table");
    console.log("❓ Remove Employee table entirely");
    console.log("❓ May not scale for complex organizational structures");

    // 6. Migration recommendations
    console.log("\n🔧 6. MIGRATION STEPS\n");

    console.log("STEP 1: Remove duplicate fields from Employee");
    console.log("STEP 2: Update middleware to use User as primary auth");
    console.log(
      "STEP 3: Update Employee-based routes to check User.employee relationship"
    );
    console.log("STEP 4: Remove legacy User.role field");
    console.log("STEP 5: Ensure data consistency");

    console.log("\n" + "=" * 60);
    console.log("ANALYSIS COMPLETE");
  } catch (error) {
    console.error("❌ Error during analysis:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUserEmployeeTables();
