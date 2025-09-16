# Event-Driven City Synchronization

## Overview

This implementation provides a robust, event-driven solution for maintaining unified city data across all services in the EV91 Platform. The vehicle-service acts as the **master source** for city data, and changes are automatically synchronized to other services via HTTP events.

## Architecture

### Master Service: Vehicle Service

- **Primary Source**: All city CRUD operations happen in vehicle-service
- **Event Publisher**: Publishes city events to all registered services
- **Schema**: Enhanced with event sourcing fields (version, eventSequence, lastSyncAt)

### Consuming Services

- **Client Store Service**: Maintains city table for store location validation
- **Rider Service**: Maintains city table for rider assignment and operations
- **Auth Service**: Can be added for user location preferences

## Event Types

```typescript
enum CityEventType {
  CITY_CREATED = "city.created",
  CITY_UPDATED = "city.updated",
  CITY_DELETED = "city.deleted",
  CITY_ACTIVATED = "city.activated",
  CITY_DEACTIVATED = "city.deactivated",
}
```

## Implementation Status

### ✅ Completed

1. **Event Type Definitions**

   - `vehicle-service/src/events/cityEvents.ts`
   - `client-store-service/src/types/cityEvents.ts`

2. **Event Publisher**

   - `vehicle-service/src/events/cityEventPublisher.ts`
   - HTTP-based event distribution to all services
   - Error handling and retry logic
   - Event logging for audit trail

3. **Vehicle Service Controller Updates**

   - `vehicle-service/src/controllers/cityController.ts`
   - Event publishing on create/update/delete operations
   - Non-blocking event publishing (doesn't fail main operation)

4. **Client Store Service Sync**

   - `client-store-service/src/controllers/citySyncController.ts`
   - `client-store-service/src/services/citySyncService.ts`
   - `client-store-service/src/routes/citySyncRoutes.ts`
   - Endpoint: `POST /internal/city-sync`

5. **Database Schema Updates**
   - Added City model to client-store-service and rider-service
   - Event sourcing fields (version, eventSequence, lastSyncAt)

### 🚧 In Progress

1. **Rider Service Sync Implementation**

   - Need to create sync controller, service, and routes
   - Similar to client-store-service implementation

2. **Database Migrations**
   - Need to run `prisma migrate dev` for all services
   - Add City table to client-store and rider services

### 📋 Pending

1. **Auth Service Integration**

   - Add City model and sync endpoints if needed

2. **Manual Sync Features**

   - Full city resync from vehicle-service API
   - Sync status dashboard
   - Conflict resolution

3. **Production Enhancements**
   - Event queue (Redis/RabbitMQ) for reliability
   - Database event log table
   - Monitoring and alerting
   - Dead letter queue for failed events

## Service Endpoints

### Vehicle Service (Publisher)

- **City CRUD**: `http://localhost:3002/api/v1/cities`
- **Events**: Automatically published on city changes

### Client Store Service (Consumer)

- **Sync Endpoint**: `http://localhost:3004/internal/city-sync`
- **Sync Status**: `http://localhost:3004/internal/city-sync/status`
- **Manual Sync**: `http://localhost:3004/internal/city-sync/manual/:cityId`

### Rider Service (Consumer)

- **Sync Endpoint**: `http://localhost:8000/internal/city-sync` (To be implemented)
- **Sync Status**: `http://localhost:8000/internal/city-sync/status` (To be implemented)

## Event Flow

```
1. City Created/Updated/Deleted in Vehicle Service
   ↓
2. Vehicle Service Controller publishes event
   ↓
3. Event Publisher sends HTTP POST to all services
   ↓
4. Each service receives event at /internal/city-sync
   ↓
5. Service processes event and updates local city table
   ↓
6. Success/failure response sent back to publisher
```

## Configuration

### Environment Variables

**Vehicle Service:**

```env
CLIENT_STORE_SERVICE_URL=http://localhost:3004
RIDER_SERVICE_URL=http://localhost:8000
AUTH_SERVICE_URL=http://localhost:3001
```

**All Services:**

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database
```

## Testing the Implementation

### 1. Start All Services

```bash
# Terminal 1: Vehicle Service
cd services/vehicle-service && npm run dev

# Terminal 2: Client Store Service
cd services/client-store-service && npm run dev

# Terminal 3: Rider Service
cd services/rider-service && npm run dev
```

### 2. Create a City in Vehicle Service

```bash
curl -X POST http://localhost:3002/api/v1/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test City",
    "displayName": "Test City Display",
    "code": "TST",
    "state": "Test State",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

### 3. Verify Sync in Client Store Service

```bash
curl http://localhost:3004/internal/city-sync/status
```

### 4. Check Logs

- Vehicle service logs should show event publishing
- Client store service logs should show event processing

## Error Handling

1. **Non-blocking**: Event publishing failures don't affect main operations
2. **Logging**: All events and failures are logged with details
3. **Idempotent**: Duplicate events are handled gracefully
4. **Resilient**: Services continue working if sync fails

## Next Steps

1. **Complete Rider Service Sync**
2. **Run Database Migrations**
3. **Test End-to-End Flow**
4. **Add Monitoring Dashboard**
5. **Production Deployment**

## Benefits Achieved

1. **Single Source of Truth**: Vehicle service as master
2. **Real-time Sync**: Immediate propagation of changes
3. **Fault Tolerant**: Services work independently if sync fails
4. **Audit Trail**: Complete event log for debugging
5. **Scalable**: Easy to add new consuming services
6. **Decoupled**: Services don't need direct database access to vehicle service
