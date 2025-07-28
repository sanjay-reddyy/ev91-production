# 2-Wheeler EV Vehicle Inventory Management System

## 🚀 Quick Start

This comprehensive vehicle inventory management module is designed for EV fleet operators like Zypp, providing complete lifecycle management for 2-wheeler electric vehicles.

### Installation

1. **Install Dependencies**
```bash
cd services/vehicle-service
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Start Development Server**
```bash
npm run dev
```

The service will be available at `http://localhost:4003`

## 📋 API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:4003/docs
- **Health Check**: http://localhost:4003/health

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vehicle Service (Port 4003)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Vehicle   │  │   Service   │  │   Damage    │       │
│  │ Management  │  │ Tracking    │  │ Reporting   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Media     │  │  Handover   │  │  Analytics  │       │
│  │  Upload     │  │  Management │  │ & Reports   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                   SQLite Database                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Vehicles | Service | Damage | Media | Analytics        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Features

### 1. Vehicle Inventory Management
- **Complete Vehicle Profiles**: OEM type, model, registration details
- **Battery & Range Specifications**: Capacity, range, charging details
- **Status Tracking**: Available, Assigned, Under Maintenance, Retired
- **Assignment Management**: Rider allocation and tracking

### 2. Service & Maintenance
- **Service History**: Complete maintenance records
- **Preventive Scheduling**: Automated service reminders
- **Cost Tracking**: Parts, labor, and total service costs
- **Mechanic Management**: Service provider tracking

### 3. Damage Management
- **Incident Reporting**: Comprehensive damage documentation
- **Photo Evidence**: Image upload and storage
- **Insurance Claims**: Claim tracking and management
- **Resolution Workflow**: Status-based damage resolution

### 4. Document Management
- **RC Details**: Registration certificate management
- **Insurance Tracking**: Policy details and expiry monitoring
- **Photo Documentation**: Vehicle condition photos
- **Audit Trail**: Complete change history

## 📊 API Endpoints

### Vehicle Management
```http
GET    /api/v1/vehicles           # List vehicles with filters
POST   /api/v1/vehicles           # Create new vehicle
GET    /api/v1/vehicles/{id}      # Get vehicle details
PUT    /api/v1/vehicles/{id}      # Update vehicle
DELETE /api/v1/vehicles/{id}      # Delete vehicle (soft)

# Status Management
GET    /api/v1/vehicles/{id}/status      # Get status
PATCH  /api/v1/vehicles/{id}/status      # Update status
POST   /api/v1/vehicles/{id}/assign      # Assign to rider
POST   /api/v1/vehicles/{id}/unassign    # Unassign from rider
GET    /api/v1/vehicles/{id}/history     # Get history
```

### Service Management
```http
GET    /api/v1/service            # List service records
POST   /api/v1/service            # Create service record
GET    /api/v1/service/{id}       # Get service details
PUT    /api/v1/service/{id}       # Update service record

POST   /api/v1/service/schedule   # Schedule upcoming service
GET    /api/v1/service/upcoming   # Get upcoming services
GET    /api/v1/service/analytics  # Service analytics
```

### Damage Management
```http
GET    /api/v1/damage             # List damage records
POST   /api/v1/damage             # Report new damage
GET    /api/v1/damage/{id}        # Get damage details
PUT    /api/v1/damage/{id}        # Update damage record
POST   /api/v1/damage/{id}/resolve # Mark damage resolved
```

### Media & File Upload
```http
POST   /api/v1/media/upload       # Upload photos/documents
GET    /api/v1/media/{id}         # Get media file
DELETE /api/v1/media/{id}         # Delete media file
```

## 📱 Sample API Requests

### Create Vehicle
```json
POST /api/v1/vehicles
{
  "oemType": "Hero Electric",
  "vehicleModel": "Optima CX",
  "registrationNumber": "DL8CAE1234",
  "registrationDate": "2023-06-15",
  "batteryType": "Li-ion",
  "batteryCapacity": 2.5,
  "maxRange": 85,
  "maxSpeed": 45,
  "fleetOperatorId": "client_123"
}
```

### Report Damage
```json
POST /api/v1/damage
{
  "vehicleId": "vehicle_123",
  "damageType": "Accident",
  "severity": "Moderate",
  "description": "Front panel dent from minor collision",
  "damageLocation": "Front panel",
  "incidentLocation": "Delhi, CP area",
  "reportedBy": "rider_456"
}
```

### Schedule Service
```json
POST /api/v1/service/schedule
{
  "vehicleId": "vehicle_123",
  "serviceType": "Preventive",
  "scheduledDate": "2024-08-15T10:00:00Z",
  "description": "Monthly preventive maintenance"
}
```

## 🔐 Authentication & Authorization

The service integrates with your existing auth service:

```javascript
// Headers required for authenticated requests
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Role-based Access:**
- **Admin**: Full access to all operations
- **Fleet Manager**: Vehicle and service management
- **Mechanic**: Service record management
- **Rider**: Limited read access and handover operations

## 🗄️ Database Schema

### Core Entities
- **Vehicle**: Main vehicle information and status
- **RCDetails**: Registration certificate details
- **InsuranceDetails**: Insurance policy information
- **ServiceRecord**: Maintenance and service history
- **DamageRecord**: Damage incidents and resolution
- **HandoverRecord**: Vehicle pickup/drop documentation
- **VehicleMedia**: Photos and document storage
- **VehicleStatusHistory**: Complete audit trail

### Key Relationships
```
Vehicle (1) ──── (1) RCDetails
Vehicle (1) ──── (n) InsuranceDetails
Vehicle (1) ──── (n) ServiceRecord
Vehicle (1) ──── (n) DamageRecord
Vehicle (1) ──── (n) HandoverRecord
Vehicle (1) ──── (n) VehicleMedia
```

## 📈 Analytics & Reporting

The system provides comprehensive analytics:

- **Fleet Utilization**: Vehicle usage patterns
- **Maintenance Costs**: Service cost analysis
- **Damage Trends**: Incident pattern analysis
- **Performance Metrics**: Vehicle efficiency tracking

## 🔧 Integration Points

### With Existing Services
- **Auth Service**: User authentication and authorization
- **Rider Service**: Rider assignment and tracking
- **Client Service**: Fleet operator management
- **Order Service**: Delivery order integration

### External Integrations
- **AWS S3**: Media file storage
- **Insurance APIs**: Policy verification
- **SMS/Email**: Notification services

## 🚀 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
AWS_S3_BUCKET=production-vehicle-media
JWT_SECRET=your-production-secret
```

### Docker Support
```bash
docker build -t vehicle-service .
docker run -p 4003:4003 vehicle-service
```

### Monitoring & Logging
- Structured logging with request IDs
- Health check endpoints
- Performance metrics
- Error tracking

## 📋 Next Steps

1. **Run the service**: `npm run dev`
2. **Test the APIs**: Visit http://localhost:4003/docs
3. **Create test vehicles**: Use the API to add sample data
4. **Integrate with frontend**: Use the API endpoints in your admin dashboard
5. **Set up media storage**: Configure AWS S3 for production

## 🤝 Support

For questions or issues:
- Check the API documentation at `/docs`
- Review the health check at `/health`
- Examine logs for debugging information

The system is designed to scale with your fleet operations and provides a solid foundation for comprehensive vehicle lifecycle management.