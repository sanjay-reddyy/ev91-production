import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyData() {
  console.log("🔍 Verifying seeded data...\n");

  try {
    // Check cities
    const cities = await prisma.city.findMany({
      orderBy: { marketPotential: "desc" },
      select: {
        name: true,
        displayName: true,
        code: true,
        state: true,
        regionCode: true,
        estimatedPopulation: true,
        marketPotential: true,
        isOperational: true,
        _count: {
          select: { hubs: true },
        },
      },
    });

    console.log("🌆 CITIES SUMMARY:");
    console.log(`Total cities: ${cities.length}`);
    console.log("");

    console.log("📊 TOP 10 CITIES BY POPULATION:");
    const topCities = cities
      .sort(
        (a, b) => (b.estimatedPopulation || 0) - (a.estimatedPopulation || 0)
      )
      .slice(0, 10);
    topCities.forEach((city, index) => {
      const population = city.estimatedPopulation
        ? (city.estimatedPopulation / 1000000).toFixed(1) + "M"
        : "N/A";
      const hubs =
        city._count.hubs > 0 ? `${city._count.hubs} hubs` : "No hubs";
      const status = city.isOperational ? "✅ Operational" : "⏳ Future";
      console.log(
        `${index + 1}. ${city.displayName} (${city.code}) - ${population} people - ${city.marketPotential} potential - ${hubs} - ${status}`
      );
    });

    console.log("\n🗺️  CITIES BY REGION:");
    const regionGroups = cities.reduce(
      (acc, city) => {
        if (!acc[city.regionCode || "Unknown"]) {
          acc[city.regionCode || "Unknown"] = [];
        }
        acc[city.regionCode || "Unknown"].push(city);
        return acc;
      },
      {} as Record<string, typeof cities>
    );

    Object.entries(regionGroups).forEach(([region, regionCities]) => {
      console.log(`\n${region} Region (${regionCities.length} cities):`);
      regionCities.forEach((city) => {
        const hubs = city._count.hubs > 0 ? ` [${city._count.hubs} hubs]` : "";
        const status = city.isOperational ? "✅" : "⏳";
        console.log(
          `  ${status} ${city.displayName} (${city.code}) - ${city.state}${hubs}`
        );
      });
    });

    // Check hubs
    const hubs = await prisma.hub.findMany({
      include: {
        city: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ city: { code: "asc" } }, { code: "asc" }],
    });

    console.log("\n\n🏢 HUBS SUMMARY:");
    console.log(`Total hubs: ${hubs.length}`);

    if (hubs.length > 0) {
      console.log("\n📍 HUBS BY CITY:");
      const hubsByCity = hubs.reduce(
        (acc, hub) => {
          const cityCode = hub.city.code;
          if (!acc[cityCode]) {
            acc[cityCode] = [];
          }
          acc[cityCode].push(hub);
          return acc;
        },
        {} as Record<string, typeof hubs>
      );

      Object.entries(hubsByCity).forEach(([cityCode, cityHubs]) => {
        const cityName = cityHubs[0].city.name;
        console.log(`\n${cityName} (${cityCode}):`);
        cityHubs.forEach((hub) => {
          const capacity = `${hub.vehicleCapacity} vehicles, ${hub.chargingPoints} charging points`;
          const facilities = [];
          if (hub.hasServiceCenter) facilities.push("Service");
          if (hub.hasChargingStation) facilities.push("Charging");
          if (hub.hasWashFacility) facilities.push("Wash");
          const facilitiesStr =
            facilities.length > 0 ? ` | ${facilities.join(", ")}` : "";
          console.log(
            `  • ${hub.name} (${hub.code}) - ${hub.hubType} - ${capacity}${facilitiesStr}`
          );
        });
      });

      // Capacity summary
      const totalCapacity = hubs.reduce(
        (sum, hub) => sum + (hub.vehicleCapacity || 0),
        0
      );
      const totalChargingPoints = hubs.reduce(
        (sum, hub) => sum + (hub.chargingPoints || 0),
        0
      );
      const totalServiceCapacity = hubs.reduce(
        (sum, hub) => sum + (hub.serviceCapacity || 0),
        0
      );

      console.log("\n📈 TOTAL INFRASTRUCTURE CAPACITY:");
      console.log(
        `  Vehicle Storage: ${totalCapacity.toLocaleString()} vehicles`
      );
      console.log(`  Charging Points: ${totalChargingPoints} points`);
      console.log(`  Service Capacity: ${totalServiceCapacity} vehicles/day`);
      console.log(
        `  Average vehicles per hub: ${Math.round(totalCapacity / hubs.length)}`
      );
    }

    console.log("\n✅ Data verification complete!");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    throw error;
  }
}

async function main() {
  await verifyData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
