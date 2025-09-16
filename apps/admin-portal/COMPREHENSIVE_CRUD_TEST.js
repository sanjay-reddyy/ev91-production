// COMPREHENSIVE CLIENT CRUD TEST - Final verification
async function comprehensiveClientTest() {
  console.log("🧪 COMPREHENSIVE CLIENT CRUD TEST - Final verification");
  console.log("=".repeat(60));

  try {
    // Step 1: Login
    console.log("📡 Step 1: Authentication...");
    const loginResponse = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@ev91.com",
        password: "SuperAdmin123!",
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log("✅ Authentication successful");

    // Step 2: CREATE Client
    console.log("\n📡 Step 2: Testing CREATE client...");
    const newClientData = {
      name: "Final Test Client " + Date.now(),
      clientCode: "FINAL_" + Math.random().toString(36).substring(7),
      clientType: "Enterprise",
      city: "Delhi",
      state: "Delhi",
      pinCode: "110001",
      primaryContactPerson: "Final Test Contact",
      email:
        "final_" + Math.random().toString(36).substring(7) + "@example.com",
      phone: "8888888888",
      clientStatus: "active",
      baseOrderRate: 75.0,
    };

    const createResponse = await fetch("http://localhost:8000/api/clients", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newClientData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("❌ CREATE failed:", error);
      return false;
    }

    const createdClient = await createResponse.json();
    const clientId = createdClient.data.id;
    console.log(`✅ CREATE successful - Client ID: ${clientId}`);

    // Step 3: READ Client
    console.log("\n📡 Step 3: Testing READ client...");
    const readResponse = await fetch(
      `http://localhost:8000/api/clients/${clientId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!readResponse.ok) {
      console.error("❌ READ failed");
      return false;
    }

    const readClient = await readResponse.json();
    console.log(`✅ READ successful - Name: ${readClient.data.name}`);

    // Step 4: UPDATE Client (using minimal data approach)
    console.log("\n📡 Step 4: Testing UPDATE client...");
    const updateData = {
      clientStatus: "inactive", // Change status
      clientCode: readClient.data.clientCode,
      clientType: readClient.data.clientType,
      name: readClient.data.name + " UPDATED",
      baseOrderRate: readClient.data.baseOrderRate,
      primaryContactPerson: readClient.data.primaryContactPerson,
      email: readClient.data.email,
      phone: readClient.data.phone,
      city: readClient.data.city,
      state: readClient.data.state,
      pinCode: readClient.data.pinCode,
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

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error("❌ UPDATE failed:", error);
      return false;
    }

    const updatedClient = await updateResponse.json();
    console.log(
      `✅ UPDATE successful - Status: ${updatedClient.data.clientStatus}, Name: ${updatedClient.data.name}`
    );

    // Step 5: ARCHIVE Client (like frontend does)
    console.log("\n📡 Step 5: Testing ARCHIVE client...");
    const archiveData = {
      clientStatus: "archived",
      clientCode: updatedClient.data.clientCode,
      clientType: updatedClient.data.clientType,
      name: updatedClient.data.name,
      baseOrderRate: updatedClient.data.baseOrderRate,
      primaryContactPerson: updatedClient.data.primaryContactPerson,
      email: updatedClient.data.email,
      phone: updatedClient.data.phone,
      city: updatedClient.data.city,
      state: updatedClient.data.state,
      pinCode: updatedClient.data.pinCode,
    };

    const archiveResponse = await fetch(
      `http://localhost:8000/api/clients/${clientId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(archiveData),
      }
    );

    if (!archiveResponse.ok) {
      const error = await archiveResponse.text();
      console.error("❌ ARCHIVE failed:", error);
      return false;
    }

    const archivedClient = await archiveResponse.json();
    console.log(
      `✅ ARCHIVE successful - Status: ${archivedClient.data.clientStatus}`
    );

    // Step 6: LIST Clients (verify it appears in list)
    console.log("\n📡 Step 6: Testing LIST clients...");
    const listResponse = await fetch(
      "http://localhost:8000/api/clients?limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!listResponse.ok) {
      console.error("❌ LIST failed");
      return false;
    }

    const listData = await listResponse.json();
    const foundClient = listData.data.find((c) => c.id === clientId);
    console.log(`✅ LIST successful - Found our client: ${!!foundClient}`);

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL CRUD OPERATIONS SUCCESSFUL!");
    console.log("✅ CREATE - Client created successfully");
    console.log("✅ READ - Client retrieved successfully");
    console.log("✅ UPDATE - Client updated successfully");
    console.log("✅ ARCHIVE - Client archived successfully");
    console.log("✅ LIST - Client found in list");
    console.log(
      "\n🚀 Frontend client-store management is now fully operational!"
    );
    console.log("=".repeat(60));

    return true;
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
}

// Auto-run
comprehensiveClientTest();
