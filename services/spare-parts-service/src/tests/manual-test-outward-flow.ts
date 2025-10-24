/**
 * Manual API Testing Script for Outward Flow
 *
 * This script provides manual testing functions for the outward flow APIs
 * Run this after starting the service to test all endpoints
 */

const API_BASE_URL = "http://localhost:3000/api/v1";

// Test data
const testData = {
  serviceRequestId: "SRV001",
  sparePartId: "PART001",
  technicianId: "TECH001",
  storeId: "STORE001",
  approverId: "SUPERVISOR001",
};

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(
  endpoint: string,
  method: string = "GET",
  body?: any,
  headers?: any
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token", // Replace with actual token
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🔄 ${method} ${url}`);
    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    console.log("---");

    return { status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Error:`, error);
    return { status: 500, error };
  }
}

/**
 * Test 1: Create Part Request
 */
export async function testCreatePartRequest() {
  console.log("🧪 Testing: Create Part Request");

  const requestData = {
    serviceRequestId: testData.serviceRequestId,
    sparePartId: testData.sparePartId,
    technicianId: testData.technicianId,
    requestedQuantity: 2,
    urgency: "NORMAL",
    justification: "Required for engine maintenance",
  };

  return await makeRequest("/outward/request", "POST", requestData);
}

/**
 * Test 2: Get Part Requests
 */
export async function testGetPartRequests() {
  console.log("🧪 Testing: Get Part Requests");

  const filters = new URLSearchParams({
    page: "1",
    limit: "10",
    status: "Pending",
  });

  return await makeRequest(`/outward/requests?${filters}`);
}

/**
 * Test 3: Check Stock Availability
 */
export async function testCheckStockAvailability() {
  console.log("🧪 Testing: Check Stock Availability");

  return await makeRequest(
    `/outward/stock-availability/${testData.sparePartId}/${testData.storeId}?quantity=2`
  );
}

/**
 * Test 4: Approve Part Request
 */
export async function testApprovePartRequest(requestId: string) {
  console.log("🧪 Testing: Approve Part Request");

  const approvalData = {
    approverId: testData.approverId,
    comments: "Approved for maintenance work",
    conditions: "Return unused parts",
  };

  return await makeRequest(
    `/outward/requests/${requestId}/approve`,
    "POST",
    approvalData
  );
}

/**
 * Test 5: Issue Parts to Technician
 */
export async function testIssuePartsToTechnician(requestId: string) {
  console.log("🧪 Testing: Issue Parts to Technician");

  return await makeRequest(`/outward/requests/${requestId}/issue`, "POST");
}

/**
 * Test 6: Install Spare Part
 */
export async function testInstallSparePart() {
  console.log("🧪 Testing: Install Spare Part");

  const installationData = {
    serviceRequestId: testData.serviceRequestId,
    sparePartId: testData.sparePartId,
    technicianId: testData.technicianId,
    quantity: 1,
    unitCost: 50.0,
    serialNumber: "SN12345",
    installationNotes: "Installed successfully on engine block",
  };

  return await makeRequest("/outward/install", "POST", installationData);
}

/**
 * Test 7: Return Unused Parts
 */
export async function testReturnUnusedParts() {
  console.log("🧪 Testing: Return Unused Parts");

  const returnData = {
    serviceRequestId: testData.serviceRequestId,
    returns: [
      {
        sparePartId: testData.sparePartId,
        quantity: 1,
        condition: "Good",
        returnReason: "Not needed for this service",
        technicianId: testData.technicianId,
        unitCost: 50.0,
      },
    ],
  };

  return await makeRequest("/outward/return", "POST", returnData);
}

/**
 * Test 8: Calculate Service Cost
 */
export async function testCalculateServiceCost() {
  console.log("🧪 Testing: Calculate Service Cost");

  return await makeRequest(`/outward/cost/${testData.serviceRequestId}`);
}

/**
 * Test 9: Get Installed Parts
 */
export async function testGetInstalledParts() {
  console.log("🧪 Testing: Get Installed Parts");

  return await makeRequest(`/outward/installed/${testData.serviceRequestId}`);
}

/**
 * Test 10: Get Approval History
 */
export async function testGetApprovalHistory(requestId: string) {
  console.log("🧪 Testing: Get Approval History");

  return await makeRequest(`/outward/requests/${requestId}/approval-history`);
}

/**
 * Test 11: Get Outward Analytics
 */
export async function testGetOutwardAnalytics() {
  console.log("🧪 Testing: Get Outward Analytics");

  const filters = new URLSearchParams({
    storeId: testData.storeId,
    dateFrom: "2025-01-01",
    dateTo: "2025-12-31",
  });

  return await makeRequest(`/outward/analytics?${filters}`);
}

/**
 * Run all tests in sequence
 */
export async function runAllTests() {
  console.log("🚀 Starting Outward Flow API Tests\n");

  try {
    // Test 1: Create request
    const createResult = await testCreatePartRequest();
    const requestId = (createResult.data as any)?.data?.id;

    // Test 2: Get requests
    await testGetPartRequests();

    // Test 3: Check stock
    await testCheckStockAvailability();

    if (requestId) {
      // Test 4: Approve request
      await testApprovePartRequest(requestId);

      // Test 5: Issue parts
      await testIssuePartsToTechnician(requestId);

      // Test 10: Get approval history
      await testGetApprovalHistory(requestId);
    }

    // Test 6: Install part
    await testInstallSparePart();

    // Test 7: Return parts
    await testReturnUnusedParts();

    // Test 8: Calculate cost
    await testCalculateServiceCost();

    // Test 9: Get installed parts
    await testGetInstalledParts();

    // Test 11: Get analytics
    await testGetOutwardAnalytics();

    console.log("✅ All tests completed!");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

// Export individual test functions for manual testing
export const manualTests = {
  createPartRequest: testCreatePartRequest,
  getPartRequests: testGetPartRequests,
  checkStockAvailability: testCheckStockAvailability,
  approvePartRequest: testApprovePartRequest,
  issuePartsToTechnician: testIssuePartsToTechnician,
  installSparePart: testInstallSparePart,
  returnUnusedParts: testReturnUnusedParts,
  calculateServiceCost: testCalculateServiceCost,
  getInstalledParts: testGetInstalledParts,
  getApprovalHistory: testGetApprovalHistory,
  getOutwardAnalytics: testGetOutwardAnalytics,
  runAll: runAllTests,
};

// Usage instructions
console.log(`
📋 Manual Testing Instructions:

1. Start the spare parts service:
   npm run dev

2. In browser console or Node.js, run:
   import { manualTests } from './manual-test-outward-flow.js';

3. Run individual tests:
   manualTests.createPartRequest()
   manualTests.checkStockAvailability()

4. Run all tests:
   manualTests.runAll()

🔧 Update testData object above with actual IDs from your database.
`);

export default manualTests;
