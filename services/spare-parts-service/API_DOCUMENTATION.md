# EV91 Platform - Spare Parts API Documentation

## Overview

This document provides comprehensive API documentation for the EV91 Platform Spare Parts Inventory Management Service. The API is designed using RESTful principles and provides complete functionality for managing vehicle spare parts, inventory, suppliers, and analytics.

## 📊 API Specification

The API follows the **OpenAPI 3.0.3** specification and is fully documented in the `openapi.yaml` file.

### Access Documentation

| Format | Endpoint | Description |
|--------|----------|-------------|
| **Interactive UI** | `/docs` | Swagger UI interface for testing APIs |
| **YAML Spec** | `/api-docs/yaml` | Raw OpenAPI specification in YAML format |
| **JSON Info** | `/api-docs/json` | API information and links |

### Live Documentation URLs

- **Primary (API Gateway)**: http://localhost:8000/docs
- **Direct Service**: http://localhost:4006/docs
- **Production**: https://api.ev91platform.com/docs

## 🔐 Authentication

All API endpoints (except health checks) require JWT authentication:

```bash
Authorization: Bearer <your_jwt_token>
```

### Required Permissions

Different endpoints require specific permissions:

- `spare_parts:read` - Read spare parts data
- `spare_parts:create` - Create new spare parts
- `spare_parts:update` - Update spare parts
- `spare_parts:delete` - Delete spare parts
- `inventory:read` - Read inventory data
- `inventory:update` - Modify inventory levels
- `analytics:read` - Access analytics data

## 📋 API Categories

### 1. Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed service health

### 2. Spare Parts Management
- `GET /api/spare-parts` - List all spare parts with filtering
- `POST /api/spare-parts` - Create new spare part
- `GET /api/spare-parts/{id}` - Get spare part details
- `PUT /api/spare-parts/{id}` - Update spare part
- `DELETE /api/spare-parts/{id}` - Delete spare part
- `GET /api/spare-parts/vehicle-model/{modelId}` - Get compatible parts
- `PATCH /api/spare-parts/{id}/pricing` - Update pricing
- `POST /api/spare-parts/bulk-update` - Bulk operations
- `GET /api/spare-parts/{id}/price-history` - Price history
- `GET /api/spare-parts/{id}/usage-analytics` - Usage analytics

### 3. Inventory Management
- `GET /api/inventory/stock-levels` - Get all stock levels
- `GET /api/inventory/stock-levels/{storeId}/{sparePartId}` - Specific stock level
- `POST /api/inventory/initialize-stock` - Initialize stock for new part
- `POST /api/inventory/stock-movement` - Record stock movements
- `POST /api/inventory/reserve-stock` - Reserve stock
- `POST /api/inventory/release-stock` - Release reserved stock
- `GET /api/inventory/low-stock-alerts` - Low stock alerts
- `POST /api/inventory/stock-count` - Physical stock count

### 4. Suppliers (Planned)
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/{id}` - Supplier details
- `PUT /api/suppliers/{id}` - Update supplier

### 5. Purchase Orders (Planned)
- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders/{id}` - PO details
- `PUT /api/purchase-orders/{id}/status` - Update PO status

### 6. Analytics (Planned)
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/inventory-turnover` - Inventory metrics
- `GET /api/analytics/supplier-performance` - Supplier analytics
- `GET /api/analytics/cost-analysis` - Cost analysis

## 🔄 Request/Response Format

### Standard Response Structure

All API responses follow a consistent structure:

```json
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "error": string,
  "errors": object,
  "pagination": object,
  "timestamp": "2025-08-06T10:30:00.000Z"
}
```

### Pagination

List endpoints support pagination:

```bash
GET /api/spare-parts?page=1&limit=20&sortBy=name&sortOrder=asc
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: 'asc' or 'desc'

**Response includes pagination info:**
```json
{
  "pagination": {
    "totalItems": 150,
    "totalPages": 8,
    "currentPage": 1,
    "pageSize": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering

List endpoints support various filters:

#### Spare Parts Filters
```bash
GET /api/spare-parts?search=brake&categoryId=cat123&supplierId=sup456&isActive=true&minPrice=100&maxPrice=1000&compatibility=model123&inStock=true&lowStock=false
```

#### Inventory Filters
```bash
GET /api/inventory/stock-levels?storeId=store123&sparePartId=part456&lowStock=true&outOfStock=false
```

## 📝 Data Models

### Spare Part Object

```json
{
  "id": "clp1234567890",
  "name": "Brake Pad Set - Front",
  "displayName": "Front Brake Pad Set - Premium",
  "partNumber": "BP-FRONT-001",
  "oemPartNumber": "OEM-BP-F-001",
  "internalCode": "EV91-BP-001",
  "description": "High-performance ceramic brake pads",
  "categoryId": "cat123",
  "supplierId": "sup456",
  "compatibility": ["model1", "model2"],
  "specifications": {
    "friction_coefficient": 0.45,
    "operating_temp": "300-600°C"
  },
  "dimensions": "120mm x 80mm x 15mm",
  "weight": 0.8,
  "material": "Ceramic Composite",
  "warranty": 12,
  "costPrice": 450.00,
  "sellingPrice": 540.00,
  "mrp": 650.00,
  "markupPercent": 20.0,
  "unitOfMeasure": "PCS",
  "minimumStock": 10,
  "maximumStock": 100,
  "reorderLevel": 20,
  "reorderQuantity": 50,
  "leadTimeDays": 7,
  "qualityGrade": "A",
  "isOemApproved": true,
  "isActive": true,
  "createdAt": "2025-08-06T10:30:00.000Z",
  "updatedAt": "2025-08-06T10:30:00.000Z"
}
```

### Inventory Level Object

```json
{
  "id": "inv123",
  "sparePartId": "part456",
  "storeId": "store789",
  "storeName": "Mumbai Central Store",
  "currentStock": 45,
  "reservedStock": 5,
  "availableStock": 40,
  "damagedStock": 2,
  "minimumStock": 10,
  "maximumStock": 100,
  "reorderLevel": 20,
  "rackNumber": "R-A-01",
  "shelfNumber": "S-3",
  "binLocation": "B-12",
  "lastCountDate": "2025-08-01T10:00:00.000Z",
  "isActive": true
}
```

### Stock Movement Object

```json
{
  "id": "mov123",
  "sparePartId": "part456",
  "storeId": "store789",
  "movementType": "IN",
  "quantity": 10,
  "previousStock": 35,
  "newStock": 45,
  "unitCost": 450.00,
  "totalValue": 4500.00,
  "referenceType": "PURCHASE",
  "referenceId": "PO-001",
  "reason": "Purchase order receipt",
  "createdBy": "user123",
  "movementDate": "2025-08-06T10:30:00.000Z"
}
```

## 🧪 Testing the API

### Using curl

```bash
# Get all spare parts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4006/api/spare-parts?page=1&limit=10"

# Create a new spare part
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brake Pad",
    "partNumber": "TEST-001",
    "internalCode": "EV91-TEST-001",
    "categoryId": "cat123",
    "supplierId": "sup456",
    "costPrice": 100.00,
    "sellingPrice": 120.00,
    "mrp": 150.00
  }' \
  "http://localhost:4006/api/spare-parts"

# Get stock levels
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4006/api/inventory/stock-levels?storeId=store123"

# Record stock movement
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sparePartId": "part456",
    "storeId": "store789",
    "movementType": "IN",
    "quantity": 10,
    "unitCost": 450.00,
    "reason": "Stock replenishment"
  }' \
  "http://localhost:4006/api/inventory/stock-movement"
```

### Using Postman

1. Import the OpenAPI specification from `/api-docs/yaml`
2. Set up environment variables:
   - `base_url`: http://localhost:4006
   - `auth_token`: Your JWT token
3. Use the collection to test all endpoints

### Using the Interactive Documentation

1. Navigate to http://localhost:4006/docs
2. Click "Authorize" and enter your JWT token
3. Test any endpoint directly from the interface

## 🚨 Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Invalid request data",
  "errors": {
    "partNumber": ["Part number is required"],
    "costPrice": ["Cost price must be greater than 0"]
  },
  "timestamp": "2025-08-06T10:30:00.000Z"
}
```

## 🔄 Rate Limiting

- **Limit**: 100 requests per 15-minute window per IP
- **Headers**: Rate limit info included in response headers
- **429 Response**: When limit exceeded

## 📊 Monitoring & Analytics

### Health Endpoints

```bash
# Basic health check
GET /health

# Detailed health with metrics
GET /health/detailed
```

### Metrics Integration

- Prometheus metrics available at `/metrics` (when configured)
- Request timing and error rates tracked
- Business metrics for inventory and sales

## 🔧 Development

### Local Setup

1. **Start the service**:
   ```bash
   cd services/spare-parts-service
   npm run dev
   ```

2. **Access documentation**:
   - Interactive UI: http://localhost:4006/docs
   - OpenAPI YAML: http://localhost:4006/api-docs/yaml

### Updating API Documentation

1. **Edit the OpenAPI specification**:
   ```bash
   # Edit the file
   vi openapi.yaml
   ```

2. **Restart the service** to load changes:
   ```bash
   npm run dev
   ```

3. **Validate the specification**:
   - Check the interactive docs at `/docs`
   - Verify all endpoints are documented
   - Test with real requests

### Adding New Endpoints

1. **Update the OpenAPI specification** in `openapi.yaml`
2. **Add the endpoint** to the appropriate route file
3. **Implement the controller** method
4. **Add request/response schemas** to the OpenAPI spec
5. **Test the endpoint** using the interactive documentation

## 🔮 Future Enhancements

### Planned Features

1. **Webhooks**: Real-time notifications for stock events
2. **Bulk Import/Export**: CSV/Excel file handling
3. **Advanced Analytics**: Machine learning insights
4. **Multi-language Support**: Internationalization
5. **Mobile API**: Optimized endpoints for mobile apps

### OpenAPI Extensions

1. **Code Generation**: Auto-generate client SDKs
2. **API Testing**: Automated testing from specification
3. **Mock Server**: Generate mock responses for development
4. **Documentation Portal**: Branded documentation site

## 📞 Support

For API support and questions:

- **Email**: dev@ev91platform.com
- **Documentation**: Always check `/docs` for the latest API reference
- **Issues**: Report bugs or request features through the development team

---

**Last Updated**: August 6, 2025  
**API Version**: 1.0.0  
**OpenAPI Version**: 3.0.3
