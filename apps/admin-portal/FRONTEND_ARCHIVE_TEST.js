// TEST FRONTEND ARCHIVE FUNCTION - Simulate exact frontend behavior
async function testFrontendArchive() {
  console.log("🧪 Testing frontend archive function behavior...");

  try {
    // Step 1: Login
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

    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log("✅ Login successful");

    // Step 2: Get a client first (to simulate real data structure)
    console.log("📡 Step 2: Getting client data...");
    const clientResponse = await fetch(
      "http://localhost:8000/api/clients?limit=1",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const clientsData = await clientResponse.json();
    if (!clientsData.success || clientsData.data.length === 0) {
      console.error("❌ No clients found to test with");
      return false;
    }

    const client = clientsData.data[0];
    console.log("✅ Got client:", client.name, client.id);

    // Step 3: Test archive with minimal data (like the fixed frontend)
    console.log("📡 Step 3: Testing archive with minimal data...");

    const updatedData = {
      clientStatus: "archived",
      // Include required fields
      clientCode: client.clientCode,
      clientType: client.clientType,
      name: client.name,
      baseOrderRate: client.baseOrderRate,
      // Include other basic updatable fields
      primaryContactPerson: client.primaryContactPerson,
      email: client.email,
      phone: client.phone,
      city: client.city,
      state: client.state,
      pinCode: client.pinCode,
    };

    console.log(
      "📊 Sending update data:",
      JSON.stringify(updatedData, null, 2)
    );

    const updateResponse = await fetch(
      `http://localhost:8000/api/clients/${client.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      }
    );

    console.log("📊 Response status:", updateResponse.status);

    if (updateResponse.ok) {
      const responseData = await updateResponse.json();
      console.log("✅ Frontend simulation SUCCESS!");
      console.log("📋 Client status updated:", responseData.data.clientStatus);
      return true;
    } else {
      const errorData = await updateResponse.text();
      console.error("❌ Frontend simulation FAILED:", errorData);
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
}

// Auto-run
testFrontendArchive();
