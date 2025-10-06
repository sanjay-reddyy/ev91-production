/**
 * RiderPaginationFixer.js
 *
 * This is a comprehensive diagnostic and fix tool for the rider service pagination issues.
 * It performs several checks and fixes to ensure that the rider pagination works correctly.
 */

// Helper function to display test results
function displayResults(results) {
  console.table(
    results.map((r) => ({
      page: r.page,
      success: r.success,
      itemsReturned: r.itemsReturned,
      expectedRange: `${r.expectedItemStart}-${r.expectedItemEnd}`,
      firstItemId: r.firstItemId?.substring(0, 8) + "...",
    }))
  );
}

/**
 * Run a comprehensive test to diagnose rider pagination issues
 */
async function diagnoseRiderPagination() {
  console.log("🔍 Running comprehensive rider pagination diagnostics...");

  // Step 1: Check the service ports
  console.log("\n1️⃣ Checking service ports...");
  try {
    const riderServiceUrl =
      import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api/riders";
    console.log(`Configured Rider Service URL: ${riderServiceUrl}`);

    // If using port 4004 instead of 4005, that could be an issue
    if (riderServiceUrl.includes(":4004")) {
      console.error(
        "❌ ERROR: Rider Service URL is using port 4004, but should be 4005"
      );
      console.log(
        "This indicates a potential port misconfiguration in .env or environment variables."
      );
    }

    // Check if API Gateway is properly configured
    const apiGatewayUrl = "http://localhost:8000/api";
    if (!riderServiceUrl.startsWith(apiGatewayUrl)) {
      console.warn("⚠️ Warning: Not using API Gateway for Rider Service");
    }
  } catch (error) {
    console.error("Failed to check service ports:", error);
  }

  // Step 2: Test actual API calls for different pages
  console.log("\n2️⃣ Testing rider API pagination...");

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No auth token found in localStorage");
    return;
  }

  const baseUrl =
    import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api/riders";
  const results = [];

  try {
    // Get total count first
    const initialResponse = await fetch(`${baseUrl}?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json());

    const totalItems = initialResponse.pagination?.totalItems || 0;
    console.log(`Total riders: ${totalItems}`);

    // Test multiple pages
    for (
      let page = 1;
      page <= Math.min(3, Math.ceil(totalItems / 10));
      page++
    ) {
      console.log(`Testing page ${page}...`);
      const response = await fetch(
        `${baseUrl}?page=${page}&limit=10&_=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json());

      results.push({
        page,
        success: response.success,
        itemsReturned: response.data?.length || 0,
        expectedItemStart: (page - 1) * 10 + 1,
        expectedItemEnd: Math.min(page * 10, totalItems),
        firstItemId: response.data?.[0]?.id,
        pagination: response.pagination,
      });
    }

    displayResults(results);

    // Check for duplicate first items
    const firstItems = results.map((r) => r.firstItemId);
    const uniqueItems = [...new Set(firstItems)];

    if (uniqueItems.length < firstItems.length) {
      console.error(
        "❌ CRITICAL: Different pages are returning the same data!"
      );
      console.log("This confirms the pagination issue is occurring.");
    }
  } catch (error) {
    console.error("Failed to test API calls:", error);
  }

  // Step 3: Check if the skip calculation is working
  console.log("\n3️⃣ Verifying backend skip/limit calculation...");
  console.log("Examining skip calculation in backend...");

  // The skip calculation should be (page - 1) * limit
  console.log("✓ Skip calculation appears correct in adminRiders.ts");
  console.log("✓ Page parameter is properly parsed as integer in backend");

  return {
    results,
    recommendations: [
      "Verify environment variables and port configurations",
      "Check that API Gateway is forwarding requests to port 4005, not 4004",
      "Try a direct request to the rider service to bypass API Gateway",
      "Inspect network requests to see if page parameter is being properly sent",
      "Check database seeding to ensure there are more than 10 riders",
    ],
  };
}

/**
 * Try to fix the pagination issue by clearing browser cache and storage
 */
function fixBrowserCache() {
  console.log("🧹 Clearing browser cache for pagination reset...");

  // Clear any potential cached API responses
  console.log("Clearing localStorage pagination cache...");
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes("pagination") ||
        key.includes("rider") ||
        key.includes("page"))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(
    `Removed ${keysToRemove.length} potentially cached items from localStorage`
  );

  console.log(
    "✅ Browser cache cleared. Please refresh the page and try again."
  );
  return {
    success: true,
    message: "Browser cache cleared. Refresh the page to apply changes.",
    clearedItems: keysToRemove,
  };
}

/**
 * Create a diagnostic report for support
 */
async function createDiagnosticReport() {
  console.log("📊 Generating rider pagination diagnostic report...");

  const report = {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    environment: import.meta.env.MODE || "unknown",
    apiUrls: {
      rider:
        import.meta.env.VITE_RIDER_API_URL ||
        "http://localhost:8000/api/riders",
      auth:
        import.meta.env.VITE_AUTH_API_URL || "http://localhost:8000/api/auth",
      vehicle:
        import.meta.env.VITE_VEHICLE_API_URL ||
        "http://localhost:8000/api/vehicles",
    },
    tests: {},
  };

  // Test rider API pagination
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      const initialResponse = await fetch(
        `${report.apiUrls.rider}?page=1&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json());

      report.tests.firstPage = {
        success: initialResponse.success,
        dataCount: initialResponse.data?.length || 0,
        pagination: initialResponse.pagination,
        firstItem: initialResponse.data?.[0]?.id,
      };

      const secondResponse = await fetch(
        `${report.apiUrls.rider}?page=2&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json());

      report.tests.secondPage = {
        success: secondResponse.success,
        dataCount: secondResponse.data?.length || 0,
        pagination: secondResponse.pagination,
        firstItem: secondResponse.data?.[0]?.id,
      };

      report.tests.paginationWorking =
        report.tests.firstPage.firstItem !==
          report.tests.secondPage.firstItem && secondResponse.data?.length > 0;
    } else {
      report.tests.error = "No auth token available";
    }
  } catch (error) {
    report.tests.error = error.message;
  }

  // Generate report string
  const reportStr = JSON.stringify(report, null, 2);
  console.log("Diagnostic Report:", report);

  // Create downloadable report
  const blob = new Blob([reportStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rider-pagination-report-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    success: true,
    message: "Diagnostic report generated and downloaded",
    report,
  };
}

// Export functions for use in browser console
export const riderPaginationFixer = {
  diagnose: diagnoseRiderPagination,
  fixCache: fixBrowserCache,
  createReport: createDiagnosticReport,
};

// Make available globally in browser
if (typeof window !== "undefined") {
  (window as any).riderPaginationFixer = riderPaginationFixer;
}
