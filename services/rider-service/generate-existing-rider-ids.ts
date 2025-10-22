/**
 * Migration Script: Generate Rider IDs for Existing Riders
 *
 * This script generates publicRiderIds for all existing riders
 * based on their existing city and createdAt values.
 *
 * Uses:
 * - Existing city column (no new data needed)
 * - Existing createdAt column (preserves registration date)
 * - Sequential numbering per city-year combination
 *
 * Run: npx ts-node generate-existing-rider-ids.ts
 */

import { PrismaClient } from "@prisma/client";
import riderIdGenerator from "./src/services/riderIdGenerator";

const prisma = new PrismaClient();

interface MigrationStats {
  totalRiders: number;
  ridersWithIds: number;
  ridersWithoutIds: number;
  ridersWithCity: number;
  ridersWithoutCity: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: Array<{ riderId: string; error: string }>;
}

async function generateExistingRiderIds() {
  console.log("\n🚀 ===== RIDER ID MIGRATION =====\n");
  console.log("Generating public rider IDs for existing riders...");
  console.log("Uses: existing city and createdAt columns\n");

  const stats: MigrationStats = {
    totalRiders: 0,
    ridersWithIds: 0,
    ridersWithoutIds: 0,
    ridersWithCity: 0,
    ridersWithoutCity: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Step 1: Get total rider count
    stats.totalRiders = await prisma.rider.count();
    console.log(`📊 Total riders in database: ${stats.totalRiders}`);

    // Step 2: Check how many already have IDs
    stats.ridersWithIds = await prisma.rider.count({
      where: { publicRiderId: { not: null } },
    });
    stats.ridersWithoutIds = stats.totalRiders - stats.ridersWithIds;

    console.log(`✅ Riders with public ID: ${stats.ridersWithIds}`);
    console.log(`❌ Riders without public ID: ${stats.ridersWithoutIds}\n`);

    if (stats.ridersWithoutIds === 0) {
      console.log(
        "🎉 All riders already have public IDs! No migration needed."
      );
      return;
    }

    // Step 3: Get riders without public IDs (who have city information)
    const ridersToMigrate = await prisma.rider.findMany({
      where: {
        publicRiderId: null,
        city: { not: null },
      },
      select: {
        id: true,
        name: true,
        city: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc", // Maintain chronological order
      },
    });

    stats.ridersWithCity = ridersToMigrate.length;
    stats.ridersWithoutCity = stats.ridersWithoutIds - stats.ridersWithCity;

    console.log(`📋 Riders ready for migration: ${stats.ridersWithCity}`);
    console.log(`⚠️  Riders without city data: ${stats.ridersWithoutCity}`);
    console.log(`\n🔄 Starting migration...\n`);

    // Step 4: Generate IDs for each rider
    for (let i = 0; i < ridersToMigrate.length; i++) {
      const rider = ridersToMigrate[i];
      const progress = `[${i + 1}/${ridersToMigrate.length}]`;

      try {
        console.log(
          `${progress} Processing: ${rider.name || "Unnamed"} (${rider.city})`
        );

        // Generate public rider ID using existing city and createdAt
        const publicRiderId = await riderIdGenerator.generateRiderId({
          city: rider.city!,
          createdAt: rider.createdAt,
        });

        // Update rider with generated ID
        await prisma.rider.update({
          where: { id: rider.id },
          data: { publicRiderId },
        });

        stats.successCount++;
        console.log(`   ✅ Generated: ${publicRiderId}\n`);
      } catch (error) {
        stats.errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        stats.errors.push({
          riderId: rider.id,
          error: errorMessage,
        });
        console.error(`   ❌ Error: ${errorMessage}\n`);
      }
    }

    // Step 5: Handle riders without city data
    if (stats.ridersWithoutCity > 0) {
      console.log(
        `\n⚠️  WARNING: ${stats.ridersWithoutCity} riders have no city data`
      );
      console.log(
        "These riders were skipped. Please update their city field and re-run migration."
      );

      const ridersWithoutCity = await prisma.rider.findMany({
        where: {
          publicRiderId: null,
          city: null,
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
        take: 10,
      });

      console.log("\n📋 First 10 riders without city:");
      ridersWithoutCity.forEach((rider) => {
        console.log(`   - ${rider.name || "Unnamed"} (${rider.phone})`);
      });

      stats.skippedCount = stats.ridersWithoutCity;
    }

    // Step 6: Display migration statistics
    console.log("\n");
    console.log("═══════════════════════════════════════");
    console.log("📊 MIGRATION SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(`Total Riders:           ${stats.totalRiders}`);
    console.log(`Already had IDs:        ${stats.ridersWithIds}`);
    console.log(`Needed Migration:       ${stats.ridersWithoutIds}`);
    console.log("───────────────────────────────────────");
    console.log(`✅ Successfully Generated: ${stats.successCount}`);
    console.log(`❌ Errors:                 ${stats.errorCount}`);
    console.log(`⚠️  Skipped (no city):     ${stats.skippedCount}`);
    console.log("═══════════════════════════════════════\n");

    // Step 7: Display errors if any
    if (stats.errors.length > 0) {
      console.log("❌ ERRORS ENCOUNTERED:");
      stats.errors.forEach((err, index) => {
        console.log(`${index + 1}. Rider ID: ${err.riderId}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    // Step 8: Display rider ID statistics
    console.log("📈 RIDER ID STATISTICS:\n");
    const idStats = await riderIdGenerator.getRiderIdStats();
    console.log(`Total Riders with IDs: ${idStats.totalRiders}`);
    console.log("\nBreakdown by City-Year:");
    idStats.cityCounts.forEach(
      (stat: { cityCode: string; year: number; count: number }) => {
        console.log(`   ${stat.cityCode} (${stat.year}): ${stat.count} riders`);
      }
    );

    console.log("\n🎉 Migration completed successfully!\n");
  } catch (error) {
    console.error("\n💥 Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  generateExistingRiderIds()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { generateExistingRiderIds };
