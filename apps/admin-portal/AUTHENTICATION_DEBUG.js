// ========================================
// COMPREHENSIVE AUTHENTICATION DEBUG SCRIPT
// ========================================
// Run this in your browser's console (F12 -> Console)
// Copy and paste the entire script at once

console.log("🔧 Starting comprehensive authentication debug...");

// Function to check current auth state
function checkAuthState() {
  const authToken = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  console.log("📊 Current Auth State:", {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    authTokenLength: authToken ? authToken.length : 0,
    refreshTokenLength: refreshToken ? refreshToken.length : 0,
  });

  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      const currentTime = Date.now() / 1000;
      const expiresIn = payload.exp - currentTime;
      console.log("🔍 Token Details:", {
        userId: payload.sub || payload.userId,
        role: payload.role,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresInMinutes: Math.round(expiresIn / 60),
        isExpired: payload.exp < currentTime,
      });

      if (payload.exp < currentTime) {
        console.warn("⚠️ Token is expired!");
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ Error parsing auth token:", error);
      return false;
    }
  }
  return false;
}

// Function to login and get fresh tokens
async function performLogin() {
  console.log("🔐 Attempting fresh login...");

  try {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📋 Login response:", data);

    if (data.success && data.data) {
      if (data.data.accessToken) {
        localStorage.setItem("authToken", data.data.accessToken);
        console.log("✅ Auth token stored");
      }
      if (data.data.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
        console.log("✅ Refresh token stored");
      }

      console.log("🎉 Login successful! Fresh tokens stored.");
      return true;
    } else {
      console.error("❌ Login failed: Invalid response structure");
      return false;
    }
  } catch (error) {
    console.error("❌ Login failed:", error);
    return false;
  }
}

// Function to test token refresh
async function testTokenRefresh() {
  console.log("🔄 Testing token refresh...");

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.error("❌ No refresh token available");
    return false;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/auth/refresh-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("📋 Refresh response:", result);

    if (result.success && result.data && result.data.accessToken) {
      localStorage.setItem("authToken", result.data.accessToken);
      if (result.data.refreshToken) {
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }
      console.log("✅ Token refresh successful");
      return true;
    } else {
      console.error("❌ Token refresh failed: Invalid response");
      return false;
    }
  } catch (error) {
    console.error("❌ Token refresh failed:", error);
    return false;
  }
}

// Function to test API call
async function testApiCall() {
  console.log("🧪 Testing API call...");

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No auth token for API test");
    return false;
  }

  try {
    const response = await fetch("http://localhost:8000/api/clients?limit=1", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📋 API test response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API call successful:", data);
      return true;
    } else {
      console.error(
        "❌ API call failed:",
        response.status,
        response.statusText
      );
      return false;
    }
  } catch (error) {
    console.error("❌ API call error:", error);
    return false;
  }
}

// Main execution function
async function main() {
  console.log("🚀 Starting comprehensive authentication fix...");

  // Step 1: Check current state
  console.log("\n=== Step 1: Checking current auth state ===");
  const hasValidToken = checkAuthState();

  if (hasValidToken) {
    console.log("✅ Valid token found, testing API call...");
    const apiWorking = await testApiCall();
    if (apiWorking) {
      console.log("🎉 Authentication is working perfectly!");
      return;
    }
  }

  // Step 2: Try token refresh if we have a refresh token
  console.log("\n=== Step 2: Attempting token refresh ===");
  const refreshWorked = await testTokenRefresh();
  if (refreshWorked) {
    const apiWorking = await testApiCall();
    if (apiWorking) {
      console.log("🎉 Token refresh successful, authentication working!");
      return;
    }
  }

  // Step 3: Perform fresh login
  console.log("\n=== Step 3: Performing fresh login ===");
  const loginWorked = await performLogin();
  if (loginWorked) {
    const apiWorking = await testApiCall();
    if (apiWorking) {
      console.log("🎉 Fresh login successful, authentication working!");
      console.log("🔄 Please try your CRUD operations again.");
      return;
    }
  }

  console.error("🚨 All authentication attempts failed. Please check:");
  console.error("1. Is the API Gateway running on port 8000?");
  console.error("2. Is the Auth Service running?");
  console.error("3. Are there any network issues?");
}

// Run the main function
main().catch((error) => {
  console.error("🚨 Script execution failed:", error);
});

console.log("📝 Authentication debug script loaded. Check results above.");
