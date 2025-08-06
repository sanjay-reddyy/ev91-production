# Spare Parts Inventory Service

A comprehensive, enterprise-grade microservice for managing vehicle spare parts inventory, suppliers, purchase orders, and analytics for the EV91 Platform.

## 🚀 Features

### Core Functionality
- **Spare Parts Management**: Complete CRUD operations with compatibility tracking
- **Multi-Store Inventory**: Real-time stock levels across multiple locations
- **Supplier Management**: Comprehensive supplier relationships and performance tracking
- **Purchase Orders**: Full purchase order lifecycle management
- **Stock Movements**: Detailed tracking of all inventory movements
- **Analytics & Reporting**: Comprehensive business intelligence and KPIs

### Advanced Features
- **Automated Reordering**: Smart inventory level management
- **Profit Margin Analysis**: Cost and pricing optimization
- **Integration Ready**: Service-to-service communication with vehicle and finance modules
- **Real-time Alerts**: Low stock and operational notifications
- **Audit Trail**: Complete transaction history
- **Performance Metrics**: Inventory turnover and supplier performance

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (optional)
- **Authentication**: JWT-based auth middleware
- **Documentation**: Auto-generated API docs

### Project Structure
```
src/
├── config/           # Configuration management
├── controllers/      # Request handlers
├── services/         # Business logic layer
├── routes/          # API route definitions
├── middleware/      # Auth, error handling, validation
├── types/           # TypeScript type definitions
├── utils/           # Helper functions and utilities
├── scripts/         # Database initialization scripts
└── server.ts        # Main application entry point
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (optional)

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd services/spare-parts-service
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Initialize with sample data
   npm run init-db
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/spare_parts_db"

# Server
PORT=4006
NODE_ENV=development

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Redis (optional)
REDIS_URL=redis://localhost:6379

# External Services
API_GATEWAY_URL=http://localhost:8000
VEHICLE_SERVICE_URL=http://localhost:4004
FINANCE_SERVICE_URL=http://localhost:4005

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📚 API Documentation

### Core Endpoints

#### Spare Parts
- `GET /api/spare-parts` - List spare parts with filtering
- `POST /api/spare-parts` - Create new spare part
- `GET /api/spare-parts/:id` - Get spare part details
- `PUT /api/spare-parts/:id` - Update spare part
- `DELETE /api/spare-parts/:id` - Delete spare part
- `POST /api/spare-parts/bulk` - Bulk operations

#### Inventory Management
- `GET /api/inventory/levels` - Get stock levels
- `POST /api/inventory/initialize` - Initialize stock for new part
- `POST /api/inventory/movement` - Create stock movement
- `POST /api/inventory/reserve` - Reserve stock
- `POST /api/inventory/release` - Release reserved stock
- `GET /api/inventory/alerts` - Get low stock alerts
- `POST /api/inventory/count` - Perform stock count

#### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

#### Purchase Orders
- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders/:id` - Get purchase order details
- `PUT /api/purchase-orders/:id/status` - Update order status
- `POST /api/purchase-orders/:id/receive` - Receive order items

#### Analytics
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/purchases` - Purchase analytics
- `GET /api/analytics/costs` - Cost analysis
- `GET /api/analytics/dashboard` - Dashboard data

### Request/Response Examples

#### Create Spare Part
```http
POST /api/spare-parts
Content-Type: application/json
Authorization: Bearer <token>

{
  "partNumber": "BAT-LI-001",
  "name": "Lithium Battery Cell 18650",
  "description": "High-capacity lithium-ion battery cell",
  "category": "BATTERY",
  "compatibleVehicles": ["Tesla Model S", "Tesla Model 3"],
  "manufacturer": "Panasonic",
  "currentPrice": 25.99,
  "costPrice": 18.50,
  "weight": 0.048,
  "dimensions": "65mm x 18mm",
  "warranty": 24
}
```

#### Stock Movement
```http
POST /api/inventory/movement
Content-Type: application/json
Authorization: Bearer <token>

{
  "sparePartId": "uuid-here",
  "storeId": "store-main",
  "movementType": "OUT",
  "quantity": 5,
  "referenceType": "SERVICE_REQUEST",
  "referenceId": "SR-2024-001",
  "notes": "Used in vehicle repair"
}
```

## 🔄 Integration

### With Vehicle Service
- Automatic parts consumption tracking
- Compatibility verification
- Service history integration

### With Finance Module
- Cost tracking and profitability analysis
- Purchase order financial integration
- Automated invoice matching

### With API Gateway
All external requests should be routed through the API Gateway:
```
External Request → API Gateway (8000) → Spare Parts Service (4006)
```

## 📊 Business Logic

### Inventory Management
- **Automatic Reordering**: Triggers when stock falls below reorder level
- **Multi-Store Support**: Track inventory across multiple locations
- **Reserved Stock**: Handle pending allocations
- **Stock Movements**: Complete audit trail of all inventory changes

### Pricing & Profitability
- **Dynamic Pricing**: Support for price updates and history
- **Profit Margins**: Calculate and track margins per part
- **Cost Analysis**: Supplier cost comparison and optimization

### Analytics & KPIs
- **Inventory Turnover**: Track how quickly inventory moves
- **Supplier Performance**: Delivery times, quality, pricing
- **Cost Trends**: Historical cost analysis and forecasting
- **Stock Health**: Low stock, overstock, and obsolete inventory

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### API Testing
Use the provided test scripts:
```bash
# Test all endpoints
npm run test:api

# Test specific modules
npm run test:inventory
npm run test:analytics
```

## 🚀 Deployment

### Production Setup
1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Configure production PostgreSQL
3. **Security**: Enable all security middleware
4. **Monitoring**: Configure logging and metrics
5. **Scaling**: Use PM2 or Docker for process management

### Docker Support
```bash
# Build image
docker build -t spare-parts-service .

# Run container
docker run -p 4006:4006 spare-parts-service
```

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API rate limiting
- Request validation

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## 📈 Performance

### Optimization Features
- Database indexing on key fields
- Redis caching for frequently accessed data
- Pagination for large datasets
- Bulk operations support
- Connection pooling

### Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Request logging

## 🛠️ Maintenance

### Database Maintenance
```bash
# Run migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

### Regular Tasks
- Monitor inventory levels
- Review supplier performance
- Analyze cost trends
- Update pricing data
- Clean up old audit logs

## 📞 Support

For technical support or questions:
- Check the logs: `npm run logs`
- Database issues: Review Prisma documentation
- API issues: Check middleware configuration
- Performance: Review caching and indexing

## 🚀 Future Enhancements

### Planned Features
- AI-powered demand forecasting
- Advanced supplier recommendation engine
- Mobile app integration
- Barcode/QR code support
- Advanced reporting dashboard
- Automated procurement workflows

### Integration Roadmap
- ERP system connectivity
- Third-party logistics integration
- Payment gateway integration
- Advanced analytics with ML
- Real-time notification system
