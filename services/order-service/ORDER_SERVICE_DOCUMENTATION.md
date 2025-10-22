# Order Service Documentation

## Overview

The Order Service is responsible for managing order lifecycle within the EV91 Platform. It provides functionality to create, update, and track orders, including relationships with riders, clients, and stores.

## Architecture

The Order Service follows a microservice architecture and integrates with other services in the platform:

- **Rider Service**: For rider validation and assignment
- **Client Store Service**: For client and store validation
- **API Gateway**: For external access and authentication

The service uses a Prisma ORM for database operations and Express.js for the API layer.

## Data Model

The Order Service manages the following entities:

### Order

Main entity that represents a delivery or service order:

- `id`: Unique identifier
- `orderNumber`: Human-readable order number
- `riderId`: Reference to the assigned rider
- `clientId`: Reference to the client
- `storeId`: Reference to the store
- `orderType`: Type of order (delivery, pickup, return, etc.)
- `orderStatus`: Current status of the order
- `priority`: Order priority level
- `pickupAddress`, `pickupCity`, `pickupState`, `pickupPinCode`: Pickup location details
- `dropoffAddress`, `dropoffCity`, `dropoffState`, `dropoffPinCode`: Dropoff location details
- `pickupDate`, `pickupTime`: Scheduled pickup time
- `expectedDeliveryDate`, `expectedDeliveryTime`: Expected delivery time
- `totalAmount`: Total order amount
- `paymentMethod`: Method of payment
- `paymentStatus`: Payment status
- `notes`: Additional notes
- `createdAt`, `updatedAt`: Timestamps

### Order Item

Items included in an order:

- `id`: Unique identifier
- `orderId`: Reference to the parent order
- `itemName`: Name of the item
- `itemDescription`: Description of the item
- `quantity`: Quantity of the item
- `unitPrice`: Price per unit
- `totalPrice`: Total price for this item
- `createdAt`, `updatedAt`: Timestamps

### Order Status Update

Tracks status changes in the order lifecycle:

- `id`: Unique identifier
- `orderId`: Reference to the parent order
- `status`: Status value
- `timestamp`: When the status was updated
- `notes`: Optional notes about the status change

### Order Tracking

Represents the current tracking state of an order:

- `id`: Unique identifier
- `orderId`: Reference to the parent order
- `currentStatus`: Current order status
- `currentLocation`: Current location of the order/rider
- `lastUpdated`: Last update timestamp

### Order Payment

Payment information for an order:

- `id`: Unique identifier
- `orderId`: Reference to the parent order
- `paymentMethod`: Method of payment
- `amount`: Payment amount
- `transactionId`: External payment transaction ID
- `paymentStatus`: Status of the payment
- `notes`: Additional notes
- `timestamp`: Payment timestamp

### Order Event

Event log for order-related activities:

- `id`: Unique identifier
- `orderId`: Reference to the parent order
- `eventType`: Type of event
- `timestamp`: When the event occurred
- `details`: JSON string with event details

## API Endpoints

### Order Management

- `GET /api/orders`: Get all orders with filtering and pagination
- `GET /api/orders/:id`: Get order by ID
- `POST /api/orders`: Create a new order
- `PUT /api/orders/:id`: Update an existing order
- `PATCH /api/orders/:id/status`: Update order status

### Order Items

- `POST /api/orders/:id/items`: Add item to order
- `PUT /api/orders/:id/items/:itemId`: Update order item
- `DELETE /api/orders/:id/items/:itemId`: Delete order item

### Order Payments

- `POST /api/orders/:id/payments`: Add payment to order

### Order Statistics

- `GET /api/orders/stats`: Get order statistics

### Filtering

Orders can be filtered by:

- Rider ID
- Client ID
- Store ID
- Order status
- Order type
- Date range

## Integration Points

### Rider Service

- Validates rider existence
- Gets rider details
- Notifies riders about orders

### Client Store Service

- Validates client existence
- Validates store existence
- Gets client and store details

## Authentication & Authorization

All endpoints are protected and require authentication. Specific endpoints require appropriate role-based permissions:

- Creating orders: Requires `Admin`, `Super Admin`, or `Manager` role
- Updating orders: Requires `Admin`, `Super Admin`, or `Manager` role
- Updating status: Available to all authenticated users (including riders)
