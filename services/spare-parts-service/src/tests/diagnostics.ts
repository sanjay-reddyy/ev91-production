/**
 * Diagnostic Script for Outward Flow Implementation
 * Run this to check the current state before testing
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log("🔍 Running Outward Flow Diagnostics...\n");

  // 1. Check Prisma Client Generation
  console.log("1. 📦 Checking Prisma Client...");
  try {
    const clientPath = path.join(
      process.cwd(),
      "node_modules",
      ".prisma",
      "client",
      "index.d.ts"
    );
    if (fs.existsSync(clientPath)) {
      const clientContent = fs.readFileSync(clientPath, "utf8");
      const hasServiceRequest = clientContent.includes("ServiceRequest");
      const hasSparePartRequest = clientContent.includes("SparePartRequest");
      const hasApprovalHistory = clientContent.includes("ApprovalHistory");

      console.log(`   ✅ Prisma client exists`);
      console.log(
        `   ${hasServiceRequest ? "✅" : "❌"} ServiceRequest model available`
      );
      console.log(
        `   ${
          hasSparePartRequest ? "✅" : "❌"
        } SparePartRequest model available`
      );
      console.log(
        `   ${hasApprovalHistory ? "✅" : "❌"} ApprovalHistory model available`
      );
    } else {
      console.log(`   ❌ Prisma client not found`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking Prisma client: ${error}`);
  }

  // 2. Check Database Connection
  console.log("\n2. 🗄️ Checking Database Connection...");
  try {
    await prisma.$connect();
    console.log("   ✅ Database connection successful");

    // Check if we can query existing tables
    const categoryCount = await prisma.category.count();
    const sparePartCount = await prisma.sparePart.count();
    const inventoryCount = await prisma.inventoryLevel.count();

    console.log(
      `   📊 Existing data: ${categoryCount} categories, ${sparePartCount} parts, ${inventoryCount} inventory levels`
    );
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error}`);
  }

  // 3. Check New Tables (if migration was successful)
  console.log("\n3. 🆕 Checking New Tables...");
  try {
    // This will fail if the new tables don't exist yet
    const serviceRequestCount = await prisma.serviceRequest.count();
    const requestCount = await prisma.sparePartRequest.count();
    console.log(
      `   ✅ New tables exist: ${serviceRequestCount} service requests, ${requestCount} part requests`
    );
  } catch (error) {
    console.log(`   ⚠️ New tables not available yet: ${error.message}`);
    console.log(`   💡 This is expected if migration hasn't run yet`);
  }

  // 4. Check File Structure
  console.log("\n4. 📁 Checking File Structure...");
  const files = [
    "src/types/outward.ts",
    "src/services/OutwardFlowService.ts",
    "src/controllers/outwardFlowController.ts",
    "src/routes/outwardFlowRoutes.ts",
  ];

  files.forEach((file) => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`   ${exists ? "✅" : "❌"} ${file}`);
  });

  // 5. Check Build Status
  console.log("\n5. 🔨 Checking Build Status...");
  const distExists = fs.existsSync(path.join(process.cwd(), "dist"));
  if (distExists) {
    const distFiles = [
      "dist/services/OutwardFlowService.js",
      "dist/controllers/outwardFlowController.js",
      "dist/routes/outwardFlowRoutes.js",
    ];

    distFiles.forEach((file) => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      console.log(`   ${exists ? "✅" : "❌"} ${file}`);
    });
  } else {
    console.log(`   ❌ Dist folder not found - run 'npm run build'`);
  }

  // 6. Check Package Dependencies
  console.log("\n6. 📦 Checking Dependencies...");
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    );
    const hasPrisma = packageJson.dependencies["@prisma/client"];
    const hasExpress = packageJson.dependencies["express"];
    const hasTypescript =
      packageJson.devDependencies?.["typescript"] ||
      packageJson.dependencies?.["typescript"];

    console.log(
      `   ${hasPrisma ? "✅" : "❌"} @prisma/client: ${hasPrisma || "missing"}`
    );
    console.log(
      `   ${hasExpress ? "✅" : "❌"} express: ${hasExpress || "missing"}`
    );
    console.log(
      `   ${hasTypescript ? "✅" : "❌"} typescript: ${
        hasTypescript || "missing"
      }`
    );
  } catch (error) {
    console.log(`   ❌ Error checking package.json: ${error}`);
  }

  await prisma.$disconnect();

  // 7. Provide Recommendations
  console.log("\n🎯 Recommendations:");
  console.log(`
  If you see ❌ markers above, follow these steps:

  1. If Prisma models are missing:
     npx prisma generate

  2. If database connection fails:
     - Check DATABASE_URL in .env
     - Ensure PostgreSQL is running
     - Verify database exists

  3. If new tables are missing:
     npx prisma migrate dev --name add-outward-flow
     (or create tables manually if permissions issue)

  4. If build files are missing:
     npm run build

  5. If dependencies are missing:
     npm install

  6. To start testing:
     npm run dev
     (then use the curl commands from TESTING_GUIDE.md)
  `);
}

// Run diagnostics
runDiagnostics().catch(console.error);

export default runDiagnostics;
