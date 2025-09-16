const fs = require("fs");
const path = require("path");

// Files to check for mobile/phone consistency
const filesToCheck = [
  "apps/admin-portal/src/pages/Users.tsx",
  "services/auth-service/src/controllers/employeeController.ts",
  "services/auth-service/src/services/employeeService.ts",
  "services/auth-service/src/dtos/employeeDto.ts",
];

console.log("🔍 Verifying Mobile/Phone Field Consistency\n");

filesToCheck.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");

  console.log(`📄 ${filePath}:`);

  // Check for phone field references
  const phoneMatches = content.match(/phone/gi) || [];
  const mobileMatches = content.match(/mobile/gi) || [];

  console.log(`   - "phone" references: ${phoneMatches.length}`);
  console.log(`   - "mobile" references: ${mobileMatches.length}`);

  // Check for specific patterns
  if (content.includes("isMobilePhone")) {
    console.log("   ✅ Mobile validation found");
  }

  if (content.includes("Smartphone as MobileIcon")) {
    console.log("   ✅ Mobile icon import found");
  }

  if (content.includes('label="Mobile"')) {
    console.log("   ✅ Mobile label found");
  }

  console.log();
});

console.log("🎯 Summary:");
console.log('- Backend validation should use .isMobilePhone("any")');
console.log('- Frontend should use "Mobile" labels');
console.log("- Icons should use MobileIcon/Smartphone");
console.log('- Validation messages should mention "mobile number"');
