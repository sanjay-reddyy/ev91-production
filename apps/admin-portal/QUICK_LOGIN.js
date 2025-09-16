// ========================================
// QUICK LOGIN SCRIPT - COPY AND PASTE IN BROWSER CONSOLE
// ========================================

async function quickLogin() {
  console.log("🔐 Attempting quick login...");

  try {
    // Clear any existing tokens first
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");

    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@ev91.com",
        password: "SuperAdmin123!",
      }),
    });

    console.log("📡 Login response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Login failed:", response.status, response.statusText);
      console.error("❌ Error details:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("📋 Login response:", data);

    if (data.success && data.data) {
      if (data.data.accessToken) {
        localStorage.setItem("authToken", data.data.accessToken);
        console.log("✅ Auth token stored successfully");
      }
      if (data.data.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
        console.log("✅ Refresh token stored successfully");
      }

      console.log("🎉 LOGIN SUCCESSFUL!");

      // Test the token immediately with the new auth-enabled service
      console.log("🧪 Testing authentication with client-store service...");
      const testResponse = await fetch(
        "http://localhost:8000/api/clients?limit=1",
        {
          headers: {
            Authorization: `Bearer ${data.data.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log("✅ Authentication test SUCCESSFUL!");
        console.log("📊 Sample data:", testData);
        console.log("🔄 Now try your CRUD operations - they should work!");
      } else {
        console.warn("⚠️ Authentication test failed:");
        console.warn("Status:", testResponse.status);
        const errorText = await testResponse.text();
        console.warn("Error:", errorText);
      }

      return true;
    } else {
      console.error("❌ Login failed: Invalid response structure");
      return false;
    }
  } catch (error) {
    console.error("❌ Login failed with error:", error);
    return false;
  }
}

// Also provide a direct test function
async function testCurrentToken() {
  console.log("🧪 Testing current stored token...");

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No token found. Please run quickLogin() first.");
    return false;
  }

  try {
    const response = await fetch("http://localhost:8000/api/clients?limit=1", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Token is valid! CRUD operations should work.");
      console.log("📊 Sample data:", data);
      return true;
    } else {
      console.error("❌ Token test failed:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return false;
    }
  } catch (error) {
    console.error("❌ Token test error:", error);
    return false;
  }
}

console.log("🚀 Authentication functions loaded:");
console.log("- quickLogin() - Login and store tokens");
console.log("- testCurrentToken() - Test existing token");
console.log("");
console.log("🔄 Running quickLogin() automatically...");

// Run the login function immediately
quickLogin();
