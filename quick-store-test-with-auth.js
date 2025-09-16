const axios = require("axios");

async function getToken() {
  try {
    console.log("🔑 Getting authentication token...");

    const response = await axios.post("http://localhost:4001/api/auth/login", {
      email: "superadmin@ev91.com",
      password: "Super@2024",
    });

    console.log("✅ Token obtained:", response.data.data.token);
    return response.data.data.token;
  } catch (error) {
    console.error("❌ Auth error:", error.response?.data);
    return null;
  }
}

async function testStoreCreation() {
  try {
    const token = await getToken();
    if (!token) return;

    console.log("🧪 Quick store creation test...");

    // Test data with only valid schema fields
    const testData = {
      clientId: "cmfb9pklq0001j4co2l9wweyz", // Known client ID
      storeName: "Quick Test Store " + Date.now(),
      storeCode: "QT_" + Date.now(),
      storeType: "Showroom",
      completeAddress: "Test Address",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      contactNumber: "9999999999",
      emailAddress: "test@test.com",
      contactPersonName: "Test Manager", // This should be mapped to storeManagerName
      storeStatus: "Active",
    };

    console.log("📤 Sending data:", JSON.stringify(testData, null, 2));

    const response = await axios.post(
      "http://localhost:3006/api/stores",
      testData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Store created successfully!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.status);
    console.error("❌ Error details:", error.response?.data);
  }
}

testStoreCreation();
