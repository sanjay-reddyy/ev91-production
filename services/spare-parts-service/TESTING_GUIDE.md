# 🧪 Testing Guide for Spare Parts Outward Flow

## Pre-Testing Setup

### 1. Service Startup Test

```bash
# Navigate to service directory
cd c:\voice_project\EV91-Platform\services\spare-parts-service

# Install dependencies (if not done)
npm install

# Build the service
npm run build

# Start the service
npm run dev
```

**Expected Output:**

```
🚀 Spare Parts Service running on port 3000
📊 Environment: development
🔗 API Version: v1
🏥 Health Check: http://localhost:3000/health
📖 API Base URL: http://localhost:3000/api/v1
```

### 2. Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Spare Parts Service is running",
  "timestamp": "2025-08-27T...",
  "version": "1.0.0",
  "environment": "development"
}
```

## 🔍 API Testing Scenarios

### Scenario 1: Basic Request Flow

#### Step 1: Check Stock Availability

```bash
curl -X GET "http://localhost:3000/api/v1/outward/stock-availability/PART001/STORE001?quantity=2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Outcomes:**

- ✅ 200: Returns stock availability data
- ❌ 404: Part or store not found
- ❌ 500: Database connection issues

#### Step 2: Create Part Request

```bash
curl -X POST "http://localhost:3000/api/v1/outward/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "serviceRequestId": "SRV001",
    "sparePartId": "PART001",
    "technicianId": "TECH001",
    "requestedQuantity": 2,
    "urgency": "NORMAL",
    "justification": "Required for engine maintenance"
  }'
```

**Expected Outcomes:**

- ✅ 201: Request created successfully
- ❌ 400: Missing required fields
- ❌ 404: Service request or spare part not found
- ❌ 500: Database or business logic errors

#### Step 3: Get Part Requests

```bash
curl -X GET "http://localhost:3000/api/v1/outward/requests?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Outcomes:**

- ✅ 200: Returns paginated list of requests
- ❌ 500: Database query issues

### Scenario 2: Approval Workflow

#### Step 4: Approve Request (use actual request ID from Step 2)

```bash
curl -X POST "http://localhost:3000/api/v1/outward/requests/{REQUEST_ID}/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "approverId": "SUPERVISOR001",
    "comments": "Approved for maintenance work",
    "conditions": "Return unused parts"
  }'
```

**Expected Outcomes:**

- ✅ 200: Request approved successfully
- ❌ 400: Request not in pending status or insufficient stock
- ❌ 404: Request not found

#### Step 5: Issue Parts to Technician

```bash
curl -X POST "http://localhost:3000/api/v1/outward/requests/{REQUEST_ID}/issue" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Outcomes:**

- ✅ 200: Parts issued successfully
- ❌ 400: Request not approved or insufficient stock
- ❌ 500: FIFO stock allocation errors

### Scenario 3: Installation and Cost Tracking

#### Step 6: Install Spare Part

```bash
curl -X POST "http://localhost:3000/api/v1/outward/install" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "serviceRequestId": "SRV001",
    "sparePartId": "PART001",
    "technicianId": "TECH001",
    "quantity": 1,
    "unitCost": 50.00,
    "serialNumber": "SN12345",
    "installationNotes": "Installed successfully"
  }'
```

**Expected Outcomes:**

- ✅ 201: Installation recorded successfully
- ❌ 400: Part not issued or quantity exceeds issued amount
- ❌ 404: Service request or part not found

#### Step 7: Calculate Service Cost

```bash
curl -X GET "http://localhost:3000/api/v1/outward/cost/SRV001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Outcomes:**

- ✅ 200: Returns detailed cost breakdown
- ❌ 404: Service request not found
- ❌ 500: Cost calculation errors

### Scenario 4: Returns and Analytics

#### Step 8: Return Unused Parts

```bash
curl -X POST "http://localhost:3000/api/v1/outward/return" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "serviceRequestId": "SRV001",
    "returns": [
      {
        "sparePartId": "PART001",
        "quantity": 1,
        "condition": "Good",
        "returnReason": "Not needed",
        "technicianId": "TECH001",
        "unitCost": 50.00
      }
    ]
  }'
```

**Expected Outcomes:**

- ✅ 200: Parts returned successfully
- ❌ 400: Invalid return data or parts not issued
- ❌ 500: Inventory update errors

#### Step 9: Get Analytics

```bash
curl -X GET "http://localhost:3000/api/v1/outward/analytics?storeId=STORE001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Outcomes:**

- ✅ 200: Returns analytics data
- ❌ 500: Analytics calculation errors

## 🚨 Common Issues and Solutions

### Issue 1: Prisma Client Errors

**Error:** `Property 'serviceRequest' does not exist on type 'PrismaClient'`

**Solution:**

```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript language server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Issue 2: Database Migration Needed

**Error:** `P3014 Prisma Migrate could not create the shadow database`

**Solution:**

```bash
# Check database connection
npx prisma db ping

# Run migrations (if permissions allow)
npx prisma migrate dev --name add-outward-flow

# Alternative: Run SQL manually
# Copy the schema from prisma/schema.prisma and execute in database
```

### Issue 3: Authentication Errors

**Error:** `401 Unauthorized`

**Solution:**

- Check if auth middleware is properly configured
- Use valid JWT token or skip auth for testing
- Update middleware to allow test tokens

### Issue 4: Compilation Errors

**Error:** TypeScript compilation failures

**Solution:**

```bash
# Check for syntax errors
npm run build

# Fix import/export issues
# Ensure all types are properly exported
```

## 📊 Test Data Requirements

Before testing, ensure your database has:

### Required Data:

1. **Category**: At least one active category
2. **Supplier**: At least one active supplier
3. **Spare Part**: At least one part with inventory
4. **Inventory Level**: Stock available for testing
5. **Service Request**: Active service request for testing

### Sample Data Creation:

```sql
-- Create test category
INSERT INTO spare_parts.categories (id, name, display_name, code, is_active)
VALUES ('CAT001', 'Engine Parts', 'Engine Parts', 'ENG', true);

-- Create test supplier
INSERT INTO spare_parts.suppliers (id, name, display_name, code, supplier_type, is_active)
VALUES ('SUP001', 'Test Supplier', 'Test Supplier', 'TS001', 'OEM', true);

-- Create test spare part
INSERT INTO spare_parts.spare_parts (id, name, part_number, category_id, supplier_id, cost_price, selling_price, is_active)
VALUES ('PART001', 'Test Filter', 'TF001', 'CAT001', 'SUP001', 50.00, 75.00, true);

-- Create inventory level
INSERT INTO spare_parts.inventory_levels (id, spare_part_id, store_id, store_name, current_stock, available_stock, is_active)
VALUES ('INV001', 'PART001', 'STORE001', 'Main Store', 100, 95, true);

-- Create service request
INSERT INTO spare_parts.service_requests (id, ticket_number, vehicle_id, store_id, technician_id, service_type, status)
VALUES ('SRV001', 'SR001', 'VEH001', 'STORE001', 'TECH001', 'MAINTENANCE', 'In Progress');
```

## ✅ Success Criteria

### All Tests Pass When:

1. ✅ Service starts without errors
2. ✅ Health check returns 200
3. ✅ All API endpoints respond correctly
4. ✅ Database operations complete successfully
5. ✅ Business logic works as expected
6. ✅ Error handling works properly
7. ✅ Response formats are consistent

### Performance Benchmarks:

- API response time: < 500ms
- Database queries: < 100ms
- Transaction completion: < 200ms

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Frontend Integration**: APIs are ready for frontend consumption
2. **Security Review**: Add proper authentication and authorization
3. **Performance Testing**: Load testing with multiple concurrent requests
4. **Documentation**: Update API documentation with actual examples
5. **Production Deployment**: Configure environment variables and deploy

## 📞 Troubleshooting Support

If you encounter issues:

1. Check service logs in terminal
2. Verify database connectivity
3. Confirm Prisma client generation
4. Test with simplified data
5. Check network connectivity
6. Validate request formats

The outward flow implementation is ready for testing! 🚀
