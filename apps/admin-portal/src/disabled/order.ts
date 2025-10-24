// Order Types for frontend integration with order-service
import { User } from "./auth";

// Basic type for order items
export interface OrderItem {
  id: string;
  orderId: string;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Order status types - aligned with backend
export enum OrderStatus {
  CREATED = "created",
  PENDING = "pending",
  APPROVED = "approved",
  ASSIGNED = "assigned",
  IN_TRANSIT = "in-transit",
  PICKED_UP = "picked-up",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
  RETURNED = "returned",
}

// Order payment status
export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  PARTIALLY_PAID = "partially-paid",
}

// Payment methods - aligned with backend
export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit-card",
  DEBIT_CARD = "debit-card",
  UPI = "upi",
  NET_BANKING = "net-banking",
  WALLET = "wallet",
  OTHER = "other",
}

// Order type - aligned with backend schema
export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  client_code: string;
  store_id: string;
  store_name: string;
  store_code: string;
  store_address?: string;
  city_id: string;
  city_name: string;
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  order_type: string;
  order_source: string;
  priority: string;
  status: string; // Using OrderStatus for typed values
  status_reason?: string;
  status_history?: string;
  payment_method: string; // Using PaymentMethod for typed values
  payment_status: string; // Using PaymentStatus for typed values
  order_value: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  notes?: string;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  distance?: number;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  scheduled_for?: string;
  picked_at?: string;
  delivered_at?: string;
  assigned_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_id?: string;
  vehicle_type?: string;
  battery_level?: number;
  battery_consumed?: number;
  item_count: number;
  item_summary?: string;
  special_instructions?: string;
  cancelled_by?: string;
  failure_reason?: string;
  rider_rating?: number;
  customer_rating?: number;
  rider_feedback?: string;
  customer_feedback?: string;
  tags?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  items: OrderItem[];
  order_status_updates?: OrderStatusUpdate[];
  order_tracking?: OrderTracking;
  order_payments?: OrderPayment;
}

// Order status update - aligned with backend schema
export interface OrderStatusUpdate {
  id: string;
  order_id: string;
  from_status: string;
  to_status: string;
  reason?: string;
  notes?: string;
  updated_by?: string;
  updated_by_name?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Order tracking - aligned with backend schema
export interface OrderTracking {
  id: string;
  order_id: string;
  current_location?: string;
  current_latitude?: number;
  current_longitude?: number;
  last_updated_at: string;
  estimated_arrival?: string;
  delay_minutes?: number;
  delay_reason?: string;
  location_history?: string;
  checkpoints?: string;
  public_tracking_id?: string;
  public_tracking_url?: string;
}

// Order payment - aligned with backend schema
export interface OrderPayment {
  id: string;
  order_id: string;
  payment_method: string;
  payment_status: string;
  amount: number;
  currency: string;
  transaction_id?: string;
  payment_gateway?: string;
  payment_url?: string;
  gateway_response?: string;
  paid_at?: string;
  payment_due_by?: string;
  payer_name?: string;
  payer_phone?: string;
  payer_email?: string;
  is_refunded: boolean;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  refund_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// Order analytics type
export interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  averageDeliveryTime: number; // in minutes
  averageOrderValue: number;
  totalRevenue: number;
  ordersByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  ordersByDay: {
    date: string;
    count: number;
    revenue: number;
  }[];
  topClients: {
    clientId: string;
    clientName: string;
    orderCount: number;
    totalSpent: number;
  }[];
  topStores: {
    storeId: string;
    storeName: string;
    orderCount: number;
    totalSpent: number;
  }[];
}

// Order filters for list view - aligned with backend API
export interface OrderFilters {
  search?: string;
  status?: string;
  client_id?: string;
  store_id?: string;
  rider_id?: string;
  startDate?: string;
  endDate?: string;
  order_type?: string;
  payment_status?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Form data for creating/updating orders - aligned with backend API
export interface OrderFormData {
  orderNumber?: string; // Generated by backend if not provided
  clientId: string;
  clientName?: string;
  clientCode?: string;
  storeId: string;
  storeName?: string;
  storeCode?: string;
  storeAddress?: string;
  cityId?: string;
  cityName?: string;
  riderId?: string;
  orderType: string;
  orderSource?: string;
  priority?: string;
  status?: string;
  paymentMethod: string;
  paymentStatus?: string;
  orderValue?: number; // Calculated from items
  deliveryFee: number;
  totalAmount?: number; // Calculated
  currency?: string;
  notes?: string;
  pickupAddress: string;
  pickupLatitude?: number | undefined;
  pickupLongitude?: number | undefined;
  deliveryAddress: string;
  deliveryLatitude?: number | undefined;
  deliveryLongitude?: number | undefined;
  distance?: number;
  estimatedPickupTime?: Date | string | null;
  estimatedDeliveryTime?: Date | string | null;
  scheduledFor?: Date | string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  items: OrderItemFormData[];
}

// Form data for order items - aligned with backend API
export interface OrderItemFormData {
  id?: string; // Optional for new items
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status?: string;
  notes?: string;
  isNew?: boolean; // UI helper, not sent to API
}

// API types for creating and updating orders
export interface CreateOrderData {
  orderNumber?: string;
  clientId: string;
  clientName?: string;
  storeId: string;
  storeName?: string;
  cityId?: string;
  orderType: string;
  priority?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  paymentMethod: string;
  orderValue?: number;
  deliveryFee: number;
  totalAmount: number;
  specialInstructions?: string;
  notes?: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  scheduledFor?: string;
  items: {
    name: string;
    description?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }[];
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  id: string;
}

// API Response types
export interface OrderApiResponse {
  success: boolean;
  message?: string;
  data?: Order | Order[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  error?: string;
}

export interface OrderAnalyticsApiResponse {
  success: boolean;
  message?: string;
  data?: OrderAnalytics;
  error?: string;
}

// Default values for new orders
export const DEFAULT_ORDER_VALUES: OrderFormData = {
  clientId: "",
  storeId: "",
  riderId: undefined,
  orderType: "delivery",
  orderSource: "admin",
  priority: "normal",
  status: OrderStatus.PENDING,
  paymentMethod: PaymentMethod.CASH,
  paymentStatus: PaymentStatus.PENDING,
  deliveryFee: 0,
  notes: "",
  pickupAddress: "",
  deliveryAddress: "",
  estimatedPickupTime: null,
  estimatedDeliveryTime: null,
  scheduledFor: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  items: [],
};

// Constants for use in UI
export const ORDER_STATUSES = Object.values(OrderStatus);

export const PAYMENT_STATUSES = Object.values(PaymentStatus);

export const PAYMENT_METHODS = Object.values(PaymentMethod);

// Order types for UI selection
export const ORDER_TYPES = [
  "delivery",
  "pickup",
  "return",
  "exchange",
  "service",
  "other",
];

// Priority levels for UI selection
export const PRIORITY_LEVELS = ["low", "medium", "high", "urgent"];

// Status display helpers
export const getStatusColor = (
  status: string
): "primary" | "secondary" | "success" | "error" | "warning" | "info" => {
  switch (status.toLowerCase()) {
    case "created":
    case "pending":
      return "info";
    case "approved":
      return "primary";
    case "assigned":
      return "secondary";
    case "picked-up":
    case "picked_up":
      return "secondary";
    case "in-transit":
    case "in_transit":
      return "info";
    case "delivered":
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    case "returned":
      return "warning";
    case "failed":
      return "error";
    default:
      return "info";
  }
};

export const getPaymentStatusColor = (
  status: string
): "primary" | "success" | "error" | "warning" | "info" => {
  switch (status.toLowerCase()) {
    case "pending":
      return "warning";
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "refunded":
      return "info";
    case "partially-paid":
    case "partially_paid":
      return "primary";
    default:
      return "warning";
  }
};
