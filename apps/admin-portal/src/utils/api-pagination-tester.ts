import axios from "axios";

/**
 * API Pagination Tester
 *
 * This utility script helps test pagination functionality by making API requests
 * to check if the correct page of data is being returned for different page parameters.
 *
 * Run this script in the browser console or as a Node.js script to diagnose pagination issues.
 */

// URL to test pagination against
const RIDER_API_URL = "http://localhost:8000/api/riders"; // Using gateway URL
// Alternative direct service URL
const DIRECT_RIDER_API_URL = "http://localhost:4005/api/v1/riders"; // Using direct service URL

/**
 * Test pagination functionality by making multiple requests with different page parameters
 * @param baseUrl The base URL to test against
 * @param pages Array of page numbers to test
 * @param limit Number of items per page
 */
export async function testPagination(
  baseUrl = RIDER_API_URL,
  pages = [1, 2, 3],
  limit = 10
): Promise<void> {
  console.log("🧪 Testing pagination...");
  console.log(`Base URL: ${baseUrl}`);

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No auth token found in localStorage");
    return;
  }

  try {
    // First, get total count
    const initialResponse = await axios.get(
      `${baseUrl}?page=1&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const totalItems = initialResponse.data.pagination?.totalItems || 0;
    const totalPages = initialResponse.data.pagination?.totalPages || 0;

    console.log(`📊 Total items: ${totalItems}, Total pages: ${totalPages}`);

    if (totalItems === 0) {
      console.warn("⚠️ No items found. Pagination testing cannot continue.");
      return;
    }

    // Test each page
    const results = [];
    for (const page of pages) {
      console.log(`Testing page ${page}...`);

      try {
        const response = await axios.get(
          `${baseUrl}?page=${page}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const pageData = response.data;
        const expectedSkip = (page - 1) * limit;

        results.push({
          page,
          success: pageData.success,
          itemsReturned: pageData.data?.length || 0,
          expectedItemStart: expectedSkip + 1,
          expectedItemEnd: Math.min(expectedSkip + limit, totalItems),
          firstItemId: pageData.data?.[0]?.id,
          pagination: pageData.pagination,
        });

        // If multiple pages return the same first item ID, there's likely a pagination issue
        const duplicateFirstItems = results
          .filter((r) => r.firstItemId === pageData.data?.[0]?.id)
          .map((r) => r.page);

        if (duplicateFirstItems.length > 1) {
          console.warn(
            `⚠️ Pages ${duplicateFirstItems.join(
              ", "
            )} all returned the same first item ID: ${pageData.data[0].id}`
          );
        }
      } catch (error: any) {
        console.error(`❌ Error testing page ${page}:`, error.message);
        results.push({
          page,
          success: false,
          error: error.message,
          response: error.response?.data,
        });
      }
    }

    console.log("📝 Pagination Test Results:");
    console.table(results);

    // Analysis
    const allFirstItemIds = results.map((r) => r.firstItemId);
    const uniqueFirstItemIds = new Set(allFirstItemIds);

    if (uniqueFirstItemIds.size < results.length) {
      console.error(
        "❌ PAGINATION ISSUE DETECTED: Some pages are returning duplicate first items"
      );
    } else {
      console.log("✅ All tested pages returned different first items");
    }
  } catch (error: any) {
    console.error("❌ Error during pagination test:", error.message);
  }
}

/**
 * Compare data between gateway and direct service calls to check for any discrepancies
 */
export async function compareGatewayVsDirect(
  page = 1,
  limit = 10
): Promise<void> {
  console.log("🔄 Comparing gateway vs direct service calls...");

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ No auth token found in localStorage");
    return;
  }

  try {
    // Get data from gateway
    const gatewayResponse = await axios.get(
      `${RIDER_API_URL}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Get data from direct service
    const directResponse = await axios.get(
      `${DIRECT_RIDER_API_URL}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Compare responses
    const gateway = {
      success: gatewayResponse.data.success,
      itemCount: gatewayResponse.data.data?.length || 0,
      pagination: gatewayResponse.data.pagination,
      firstItemId: gatewayResponse.data.data?.[0]?.id,
    };

    const direct = {
      success: directResponse.data.success,
      itemCount: directResponse.data.data?.length || 0,
      pagination: directResponse.data.pagination,
      firstItemId: directResponse.data.data?.[0]?.id,
    };

    console.log("Gateway response:", gateway);
    console.log("Direct service response:", direct);

    // Check if the responses match
    const itemCountMatch = gateway.itemCount === direct.itemCount;
    const firstItemMatch = gateway.firstItemId === direct.firstItemId;
    const paginationMatch =
      JSON.stringify(gateway.pagination) === JSON.stringify(direct.pagination);

    if (itemCountMatch && firstItemMatch && paginationMatch) {
      console.log("✅ Gateway and direct service responses match");
    } else {
      console.warn(
        "⚠️ Discrepancies detected between gateway and direct service responses"
      );
      if (!itemCountMatch)
        console.warn(
          `- Item count: gateway=${gateway.itemCount}, direct=${direct.itemCount}`
        );
      if (!firstItemMatch)
        console.warn(
          `- First item ID: gateway=${gateway.firstItemId}, direct=${direct.firstItemId}`
        );
      if (!paginationMatch) console.warn("- Pagination data mismatch");
    }
  } catch (error: any) {
    console.error("❌ Error during comparison:", error.message);
  }
}

// Export functions for console use
export const paginationTester = {
  testPagination,
  compareGatewayVsDirect,
  RIDER_API_URL,
  DIRECT_RIDER_API_URL,
};

// Add to window for browser console access
if (typeof window !== "undefined") {
  (window as any).paginationTester = paginationTester;
}
