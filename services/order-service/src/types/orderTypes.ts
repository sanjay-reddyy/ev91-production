// Order types
export type OrderType =
  | "delivery"
  | "pickup"
  | "return"
  | "exchange"
  | "service"
  | "other";

// Order status types
export type OrderStatus =
  | "pending"
  | "approved"
  | "assigned"
  | "in-transit"
  | "picked-up"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed"
  | "returned";

// Priority levels
export type PriorityLevel = "low" | "medium" | "high" | "urgent";

// Payment methods
export type PaymentMethod =
  | "cash"
  | "credit-card"
  | "debit-card"
  | "upi"
  | "net-banking"
  | "wallet"
  | "other";

// Payment status
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "partially-paid";

// Event types
export type OrderEventType =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "STATUS_UPDATED"
  | "ITEM_ADDED"
  | "ITEM_REMOVED"
  | "PAYMENT_ADDED"
  | "RIDER_ASSIGNED"
  | "RIDER_CHANGED"
  | "DELIVERY_FAILED"
  | "CUSTOMER_NOTIFIED"
  | "RIDER_NOTIFIED"
  | "STORE_NOTIFIED";

// Order with relationships
export interface OrderWithRelationships {
  id: string;
  orderNumber: string;
  riderId: string;
  clientId: string;
  storeId: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  priority: PriorityLevel;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupPinCode?: string;
  dropoffAddress?: string;
  dropoffCity?: string;
  dropoffState?: string;
  dropoffPinCode?: string;
  pickupDate?: Date;
  pickupTime?: string;
  expectedDeliveryDate?: Date;
  expectedDeliveryTime?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  items: OrderItem[];
  statusUpdates: OrderStatusUpdate[];
  tracking?: OrderTracking;
  payments: OrderPayment[];
  events: OrderEvent[];
}

// Order item
export interface OrderItem {
  id: string;
  orderId: string;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order status update
export interface OrderStatusUpdate {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
  notes?: string;
}

// Order tracking
export interface OrderTracking {
  id: string;
  orderId: string;
  currentStatus: OrderStatus;
  currentLocation?: string;
  lastUpdated: Date;
}

// Order payment
export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionId?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  timestamp: Date;
}

// Order event
export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: OrderEventType;
  timestamp: Date;
  details: string;
}
