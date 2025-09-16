// DEBUG 500 ERROR - Test the exact failing request
async function debug500Error() {
  console.log("🔍 Debugging 500 error...");

  try {
    // Step 1: Login first
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
    console.log("✅ Login successful, token:", token.substring(0, 50) + "...");

    // Step 2: Test the exact failing request
    const clientId = "cmfb14fp50000j4doe6m16cx0"; // Using the ID from your error
    console.log(`📡 Step 2: Testing PUT request for client ID: ${clientId}`);

    const updateData = {
      clientStatus: "archived",
      name: "Test Client",
      clientType: "Enterprise",
      clientCode: "TEST_ABC",
      baseOrderRate: 50.0,
    };

    console.log("📊 Request data:", JSON.stringify(updateData, null, 2));
    console.log(
      "📊 Request URL:",
      `http://localhost:8000/api/clients/${clientId}`
    );

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

    console.log("📊 Response status:", updateResponse.status);
    console.log(
      "📊 Response headers:",
      Object.fromEntries(updateResponse.headers.entries())
    );

    if (updateResponse.ok) {
      const responseData = await updateResponse.json();
      console.log("✅ Success response:", responseData);
    } else {
      const errorText = await updateResponse.text();
      console.log("❌ Error response:", errorText);

      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.log("❌ Parsed error:", JSON.stringify(errorJson, null, 2));
      } catch {
        console.log("❌ Raw error text:", errorText);
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

// Auto-run
debug500Error();
