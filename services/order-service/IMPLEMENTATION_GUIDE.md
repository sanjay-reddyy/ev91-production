# Order Service Implementation Guide

## Overview

This document provides a guide for implementing and using the Order Service within the EV91 Platform.

## Setup Instructions

1. Install dependencies:

   ```
   npm install
   ```

2. Generate Prisma client:

   ```
   npx prisma generate
   ```

3. Apply database migrations:

   ```
   npx prisma migrate dev
   ```

4. Start the service:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/order_service?schema=public"

# Service URLs
RIDER_SERVICE_URL="http://localhost:3004"
CLIENT_STORE_SERVICE_URL="http://localhost:3006"

# Authentication
JWT_SECRET="your-jwt-secret"

# Server
PORT=4005
NODE_ENV="development"
```

## API Usage Examples

### Creating an Order

```javascript
// POST /api/orders
const orderData = {
  orderNumber: "ORD-2023-0001",
  riderId: "rider-uuid",
  clientId: "client-uuid",
  storeId: "store-uuid",
  orderType: "delivery",
  orderStatus: "pending",
  priority: "medium",
  pickupAddress: "123 Pickup St",
  pickupCity: "Mumbai",
  dropoffAddress: "456 Dropoff Ave",
  dropoffCity: "Mumbai",
  totalAmount: 1500,
  paymentMethod: "cash",
  paymentStatus: "pending",
  items: [
    {
      itemName: "Package 1",
      itemDescription: "Small package",
      quantity: 1,
      unitPrice: 1500,
      totalPrice: 1500,
    },
  ],
};

const response = await fetch("/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN",
  },
  body: JSON.stringify(orderData),
});
```

### Updating Order Status

```javascript
// PATCH /api/orders/:id/status
const statusUpdate = {
  status: "in-transit",
  notes: "Rider has picked up the package",
  location: "Mumbai Central",
};

const response = await fetch(`/api/orders/${orderId}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN",
  },
  body: JSON.stringify(statusUpdate),
});
```

### Adding Payment

```javascript
// POST /api/orders/:id/payments
const paymentData = {
  paymentMethod: "credit-card",
  amount: 1500,
  transactionId: "txn_123456",
  paymentStatus: "completed",
  notes: "Payment received via credit card",
};

const response = await fetch(`/api/orders/${orderId}/payments`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN",
  },
  body: JSON.stringify(paymentData),
});
```

## Order Status Workflow

The typical order status flow is:

1. `pending` - Order created but not yet approved
2. `approved` - Order validated and approved
3. `assigned` - Rider assigned to the order
4. `in-transit` - Rider on the way to pickup
5. `picked-up` - Package picked up by rider
6. `delivered` - Order delivered to destination
7. `completed` - Order fully completed including payment
8. `cancelled` - Order cancelled before delivery
9. `failed` - Order failed during delivery
10. `returned` - Package returned to store

## Cross-Service Integration

### Rider Service Integration

The Order Service validates rider existence and notifies riders about new orders or status changes. Ensure the Rider Service is running and accessible via the configured URL.

### Client Store Service Integration

The Order Service validates client and store existence. Ensure the Client Store Service is running and accessible via the configured URL.

## Common Issues and Troubleshooting

1. **Database Connection Issues**:

   - Verify database credentials in `.env`
   - Ensure PostgreSQL is running

2. **Cross-Service Communication Failures**:

   - Check if Rider and Client Store services are running
   - Verify service URLs in `.env`

3. **Authentication Errors**:
   - Ensure JWT_SECRET matches across services
   - Check token validity and expiration

## Performance Considerations

- The service uses pagination for list endpoints to manage large result sets
- Consider adding caching for frequently accessed data
- For high-volume deployments, consider implementing a message queue for cross-service communication
