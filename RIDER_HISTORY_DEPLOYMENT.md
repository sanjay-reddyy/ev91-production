# Rider History Timeline Feature Deployment Guide

This guide provides instructions for deploying the Rider History Timeline feature to production.

## Components Modified

### Backend

1. **Vehicle Service**:

   - `vehicleController.ts`: Added `getVehicleRiderHistory` endpoint
   - `vehicleService.ts`: Added `getVehicleRiderHistory` implementation
   - `vehicles.ts` (routes): Added `/vehicles/:id/rider-history` route

2. **Rider Service**:
   - `riderVehicleHistoryController.ts`: Enhanced for vehicle history
   - `riderVehicleHistoryService.ts`: Added methods for vehicle history
   - Added route to expose enhanced vehicle history

### Frontend

1. **Admin Portal**:
   - Added `RiderHistoryTimeline.tsx` component
   - Updated `VehicleProfile.tsx` to include rider history tab
   - Added `getVehicleRiderHistory` method to `vehicleService.ts`
   - Installed `@mui/lab` package for timeline components

## Deployment Steps

### 1. Backend Deployment

#### Vehicle Service:

```bash
cd services/vehicle-service

# Pull latest code
git pull

# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Restart the service
pm2 restart vehicle-service
```

#### Rider Service:

```bash
cd services/rider-service

# Pull latest code
git pull

# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Restart the service
pm2 restart rider-service
```

### 2. API Gateway Deployment

```bash
cd apps/api-gateway

# Pull latest code
git pull

# Install dependencies (if needed)
npm install

# Build the application (if applicable)
npm run build

# Restart the gateway
pm2 restart api-gateway
```

### 3. Admin Portal Deployment

```bash
cd apps/admin-portal

# Pull latest code
git pull

# Install dependencies including new package
npm install

# Build the application
npm run build

# Deploy the built files to your web server
# (This depends on your hosting solution)
```

## Verification After Deployment

1. **API Endpoints**:

   - Verify the vehicle rider history endpoint is accessible
   - Check that data is returned correctly
   - Use the test script: `node test-rider-history-api.js <vehicleId>`

2. **Admin Portal**:
   - Navigate to a vehicle profile
   - Check that the "Rider History" tab appears
   - Verify the timeline displays correctly
   - Test all interactions: timeline view, table view, detail modal, media gallery

## Rollback Plan

If issues are encountered, follow these steps:

1. **Identify the Problem**:

   - Check logs to determine if the issue is in the frontend or backend

2. **Frontend Rollback**:

   - Revert to the previous build
   - Deploy the previous version

3. **Backend Rollback**:
   - Revert the services to their previous versions
   - Restart the affected services

## Database Considerations

- This feature does not require any database schema changes
- It utilizes existing HandoverRecord and HandoverMedia tables

## Monitoring

After deployment, monitor:

- API response times for the new endpoint
- Any errors in the logs related to rider history
- User feedback on the new feature
