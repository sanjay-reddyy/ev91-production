import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to generate random date within the last 30 days
function getRandomRecentDate(): Date {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(
    thirtyDaysAgo.getTime() +
      Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
  );
}

// Helper function to generate random date for job completion
function getRandomEndDate(startDate: Date): Date | null {
  // 80% chance the job is completed
  if (Math.random() < 0.8) {
    const minDuration = 30 * 60 * 1000; // 30 minutes
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours
    const duration = Math.random() * (maxDuration - minDuration) + minDuration;
    return new Date(startDate.getTime() + duration);
  }
  return null; // Job is still ongoing
}

async function main() {
  console.log("🚀 Starting order service database seed...");

  try {
    // Clear existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.job.deleteMany();

    // Create sample jobs
    console.log("📝 Creating sample jobs...");

    const jobs = [];
    const jobStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "FAILED",
    ];

    // Sample user IDs (assuming these exist in the auth service)
    const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    // Sample vehicle IDs (assuming these exist in the vehicle service)
    const vehicleIds = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ];

    for (let i = 0; i < 100; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const vehicleId =
        vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
      const startedAt = getRandomRecentDate();

      // Determine status based on whether job is completed
      let status: string;
      let endedAt: Date | null = null;

      if (Math.random() < 0.05) {
        // 5% chance of cancelled
        status = "CANCELLED";
        endedAt = getRandomEndDate(startedAt);
      } else if (Math.random() < 0.03) {
        // 3% chance of failed
        status = "FAILED";
        endedAt = getRandomEndDate(startedAt);
      } else if (Math.random() < 0.1) {
        // 10% chance of pending
        status = "PENDING";
      } else if (Math.random() < 0.2) {
        // 15% chance of in progress
        status = "IN_PROGRESS";
      } else {
        // 67% chance of completed
        status = "COMPLETED";
        endedAt =
          getRandomEndDate(startedAt) ||
          new Date(startedAt.getTime() + 2 * 60 * 60 * 1000);
      }

      const job = await prisma.job.create({
        data: {
          userId,
          vehicleId,
          status,
          startedAt,
          endedAt,
        },
      });

      jobs.push(job);
    }

    console.log("✅ Order service database seeding completed successfully!");
    console.log(`
📊 Summary of created data:
   📝 Jobs: ${jobs.length}
    `);

    // Display statistics
    const statusBreakdown = jobs.reduce((acc: any, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📈 Job Status Breakdown:");
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      const emoji =
        {
          PENDING: "⏳",
          IN_PROGRESS: "🔄",
          COMPLETED: "✅",
          CANCELLED: "❌",
          FAILED: "💥",
        }[status] || "❓";
      console.log(`   ${emoji} ${status}: ${count}`);
    });

    // User activity breakdown
    const userBreakdown = jobs.reduce((acc: any, job) => {
      acc[job.userId] = (acc[job.userId] || 0) + 1;
      return acc;
    }, {});

    console.log("\n👥 Top Active Users:");
    Object.entries(userBreakdown)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .forEach(([userId, count]) => {
        console.log(`   👤 User ${userId}: ${count} jobs`);
      });

    // Vehicle usage breakdown
    const vehicleBreakdown = jobs.reduce((acc: any, job) => {
      acc[job.vehicleId] = (acc[job.vehicleId] || 0) + 1;
      return acc;
    }, {});

    console.log("\n🚗 Top Used Vehicles:");
    Object.entries(vehicleBreakdown)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .forEach(([vehicleId, count]) => {
        console.log(`   🚙 Vehicle ${vehicleId}: ${count} jobs`);
      });

    // Calculate average job duration for completed jobs
    const completedJobs = jobs.filter(
      (job) => job.status === "COMPLETED" && job.endedAt
    );
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum, job) => {
        if (job.endedAt) {
          return sum + (job.endedAt.getTime() - job.startedAt.getTime());
        }
        return sum;
      }, 0);
      const avgDurationMinutes = Math.round(
        totalDuration / completedJobs.length / (1000 * 60)
      );
      console.log(`\n⏱️ Average Job Duration: ${avgDurationMinutes} minutes`);
    }

    console.log("\n🔑 Sample Data:");
    console.log("📋 Recent Jobs:");
    jobs.slice(0, 5).forEach((job) => {
      const duration = job.endedAt
        ? Math.round(
            (job.endedAt.getTime() - job.startedAt.getTime()) / (1000 * 60)
          ) + " min"
        : "ongoing";
      console.log(
        `   - Job ${job.id}: User ${job.userId} | Vehicle ${job.vehicleId} | ${job.status} | Duration: ${duration}`
      );
    });
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("💥 Fatal error during seeding:", e);
  process.exit(1);
});

export default main;
