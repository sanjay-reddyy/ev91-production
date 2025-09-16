const axios = require("axios");

async function checkSyncResult() {
  const testCityName = "Test City Sync";
  console.log("🔍 Checking if sync worked...\n");

  const services = [
    { name: "Vehicle Service", url: "http://localhost:4004/api/v1/cities" },
    {
      name: "Client Store Service",
      url: "http://localhost:3006/internal/city-sync/cities",
    },
    {
      name: "Rider Service",
      url: "http://localhost:4005/internal/city-sync/cities",
    },
    {
      name: "Auth Service",
      url: "http://localhost:4001/internal/city-sync/cities",
    },
  ];

  for (const service of services) {
    try {
      console.log(`📋 Checking ${service.name}...`);
      const response = await axios.get(service.url);

      if (response.data && response.data.data) {
        const cities = response.data.data;
        const testCity = cities.find((city) =>
          city.name.includes(testCityName)
        );

        if (testCity) {
          console.log(
            `   ✅ Found test city: ${testCity.name} (ID: ${testCity.id})`
          );
        } else {
          console.log(`   ❌ Test city not found`);
        }
        console.log(`   Total cities: ${cities.length}`);
      } else {
        console.log(`   ❌ Invalid response format`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log("");
  }
}

checkSyncResult().catch(console.error);
