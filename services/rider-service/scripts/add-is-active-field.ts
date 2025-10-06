/**
 * Migration script to add isActive field to the Rider model
 * Run this script after updating the schema.prisma file
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addIsActiveField() {
  console.log("Starting migration: Add isActive field to Rider model");

  try {
    // Generate the migration
    console.log("1. Creating migration file...");
    // This should be run manually: npx prisma migrate dev --name add_isActive_field

    // Update existing records
    console.log("2. Updating existing riders...");
    const riders = await prisma.rider.findMany();
    console.log(`Found ${riders.length} riders to update`);

    let updated = 0;
    for (const rider of riders) {
      // Set isActive based on registrationStatus
      const isCompleted = rider.registrationStatus === "COMPLETED";

      try {
        // Use raw query to avoid TypeScript issues
        await prisma.$executeRaw`
          UPDATE "rider"."Rider"
          SET "isActive" = ${isCompleted}
          WHERE "id" = ${rider.id}
        `;
        updated++;
      } catch (err) {
        console.error(`Failed to update rider ${rider.id}:`, err);
      }
    }

    console.log(`Successfully updated ${updated} of ${riders.length} riders`);
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addIsActiveField();
