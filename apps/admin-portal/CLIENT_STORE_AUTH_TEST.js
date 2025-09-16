// ========================================
// TEST CLIENT-STORE AUTHENTICATION - COPY AND PASTE IN BROWSER CONSOLE
// ========================================

async function testClientStoreAuth() {
  console.log("🔐 Testing Client-Store authentication...");

  try {
    // Step 1: Login and get tokens
    console.log("📡 Step 1: Logging in...");
    const loginResponse = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@ev91.com",
        password: "SuperAdmin123!",
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error("❌ Login failed:", loginResponse.status, errorText);
      return false;
    }

    const loginData = await loginResponse.json();
    console.log("✅ Login successful");

    if (!loginData.success || !loginData.data?.tokens?.accessToken) {
      console.error("❌ Invalid login response:", loginData);
      return false;
    }

    const token = loginData.data.tokens.accessToken;

    // Step 2: Test client creation (requires Super Admin permissions)
    console.log("📡 Step 2: Testing client creation...");

    const testClientData = {
      name: "Test Client " + Date.now(),
      clientCode: "TEST_" + Math.random().toString(36).substring(7),
      clientType: "Enterprise",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      primaryContactPerson: "Test Contact",
      email: "test_" + Math.random().toString(36).substring(7) + "@example.com",
      phone: "9999999999",
      clientStatus: "active",
      baseOrderRate: 50.0,
    };

    const createResponse = await fetch("http://localhost:8000/api/clients", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testClientData),
    });

    console.log("📊 Create response status:", createResponse.status);

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log("✅ Client creation successful!");
      console.log("📋 Created client:", createData);

      // Step 3: Test client update (archive)
      console.log("📡 Step 3: Testing client update/archive...");

      const clientId = createData.data.id;
      const updateData = {
        ...testClientData,
        clientStatus: "archived",
      };

      const updateResponse = await fetch(
        `http://localhost:8000/api/clients/${clientId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log("✅ Client update/archive successful!");
        console.log("📋 Updated client:", updateResult);

        console.log(
          "🎉 ALL TESTS PASSED! Client-Store CRUD is working with proper authentication!"
        );
        return true;
      } else {
        const updateError = await updateResponse.text();
        console.error(
          "❌ Client update failed:",
          updateResponse.status,
          updateError
        );
        return false;
      }
    } else {
      const createError = await createResponse.text();
      console.error(
        "❌ Client creation failed:",
        createResponse.status,
        createError
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
}

console.log("🚀 Client-Store Authentication Test loaded");
console.log("🔄 Running test...");

// Run the test
testClientStoreAuth();
