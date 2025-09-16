const fs = require("fs");
const path = require("path");

// Files to check for 10-digit mobile validation
const filesToCheck = [
  "apps/admin-portal/src/pages/Users.tsx",
  "services/auth-service/src/controllers/employeeController.ts",
];

console.log("🔍 Verifying 10-Digit Mobile Validation\n");

filesToCheck.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");

  console.log(`📄 ${filePath}:`);

  // Check for 10-digit validation patterns
  const tenDigitMatches = content.match(/^\d{10}\$/g) || [];
  const oldMobileMatches = content.match(/isMobilePhone\("any"\)/g) || [];

  console.log(`   - 10-digit regex patterns: ${tenDigitMatches.length}`);
  console.log(`   - Old isMobilePhone patterns: ${oldMobileMatches.length}`);

  if (content.includes("Mobile number must be exactly 10 digits")) {
    console.log("   ✅ 10-digit error message found");
  }

  if (content.includes("inputMode: 'numeric'")) {
    console.log("   ✅ Numeric input mode found");
  }

  if (content.includes("maxLength: 10")) {
    console.log("   ✅ Max length constraint found");
  }

  if (content.includes("Enter 10-digit mobile number")) {
    console.log("   ✅ 10-digit placeholder found");
  }

  console.log();
});

console.log("🎯 Validation Summary:");
console.log("- Backend should use .matches(/^\\d{10}$/) for validation");
console.log("- Frontend should have numeric input constraints");
console.log('- Error messages should specify "10 digits"');
console.log("- Input should auto-filter non-numeric characters");
