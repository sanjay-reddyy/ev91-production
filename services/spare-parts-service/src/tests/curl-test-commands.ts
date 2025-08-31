/**
 * Postman/curl Test Commands for Outward Flow API Testing
 *
 * Copy and paste these commands into Postman or run them with curl
 * Make sure the service is running on http://localhost:3000
 */

// Base URL
const BASE_URL = "http://localhost:3000/api/v1";

/**
 * Test 1: Health Check
 */
console.log(`
=== HEALTH CHECK ===
curl -X GET ${BASE_URL.replace("/api/v1", "")}/health
`);

/**
 * Test 2: Check Stock Availability
 */
console.log(`
=== CHECK STOCK AVAILABILITY ===
curl -X GET "${BASE_URL}/outward/stock-availability/PART001/STORE001?quantity=2" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 3: Create Part Request
 */
console.log(`
=== CREATE PART REQUEST ===
curl -X POST "${BASE_URL}/outward/request" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{
    "serviceRequestId": "SRV001",
    "sparePartId": "PART001",
    "technicianId": "TECH001",
    "requestedQuantity": 2,
    "urgency": "NORMAL",
    "justification": "Required for engine maintenance"
  }'
`);

/**
 * Test 4: Get Part Requests
 */
console.log(`
=== GET PART REQUESTS ===
curl -X GET "${BASE_URL}/outward/requests?page=1&limit=10&status=Pending" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 5: Approve Part Request (replace {requestId} with actual ID)
 */
console.log(`
=== APPROVE PART REQUEST ===
curl -X POST "${BASE_URL}/outward/requests/{requestId}/approve" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{
    "approverId": "SUPERVISOR001",
    "comments": "Approved for maintenance work",
    "conditions": "Return unused parts"
  }'
`);

/**
 * Test 6: Issue Parts to Technician (replace {requestId} with actual ID)
 */
console.log(`
=== ISSUE PARTS TO TECHNICIAN ===
curl -X POST "${BASE_URL}/outward/requests/{requestId}/issue" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 7: Install Spare Part
 */
console.log(`
=== INSTALL SPARE PART ===
curl -X POST "${BASE_URL}/outward/install" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{
    "serviceRequestId": "SRV001",
    "sparePartId": "PART001",
    "technicianId": "TECH001",
    "quantity": 1,
    "unitCost": 50.00,
    "serialNumber": "SN12345",
    "installationNotes": "Installed successfully on engine block"
  }'
`);

/**
 * Test 8: Return Unused Parts
 */
console.log(`
=== RETURN UNUSED PARTS ===
curl -X POST "${BASE_URL}/outward/return" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{
    "serviceRequestId": "SRV001",
    "returns": [
      {
        "sparePartId": "PART001",
        "quantity": 1,
        "condition": "Good",
        "returnReason": "Not needed for this service",
        "technicianId": "TECH001",
        "unitCost": 50.00
      }
    ]
  }'
`);

/**
 * Test 9: Calculate Service Cost
 */
console.log(`
=== CALCULATE SERVICE COST ===
curl -X GET "${BASE_URL}/outward/cost/SRV001" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 10: Get Installed Parts
 */
console.log(`
=== GET INSTALLED PARTS ===
curl -X GET "${BASE_URL}/outward/installed/SRV001" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 11: Get Approval History (replace {requestId} with actual ID)
 */
console.log(`
=== GET APPROVAL HISTORY ===
curl -X GET "${BASE_URL}/outward/requests/{requestId}/approval-history" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

/**
 * Test 12: Get Outward Analytics
 */
console.log(`
=== GET OUTWARD ANALYTICS ===
curl -X GET "${BASE_URL}/outward/analytics?storeId=STORE001&dateFrom=2025-01-01&dateTo=2025-12-31" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token"
`);

console.log(`
📋 TESTING INSTRUCTIONS:

1. Start the spare parts service:
   cd c:\\voice_project\\EV91-Platform\\services\\spare-parts-service
   npm run dev

2. The service should be running on http://localhost:3000

3. Copy each curl command above and run them in order

4. Replace placeholder values:
   - {requestId}: Use actual request ID from create request response
   - PART001, SRV001, etc.: Use actual IDs from your database

5. Expected flow:
   ✅ Health check should return 200
   ✅ Stock availability should return current stock levels
   ✅ Create request should return 201 with request details
   ✅ Get requests should list the created request
   ✅ Approve should update request status
   ✅ Issue should deduct from inventory
   ✅ Install should record installation
   ✅ Return should add back to inventory
   ✅ Cost calculation should return breakdown
   ✅ Analytics should return summary data

📝 NOTES:
- If you get 404 errors, check if the route is properly mounted
- If you get 500 errors, check the terminal for error details
- If you get auth errors, check the auth middleware configuration
- If you get database errors, check the Prisma client generation
`);

export {};
