import axios from "axios";
import {
  OrderApiResponse,
  OrderAnalyticsApiResponse,
  OrderFilters,
  OrderStatus,
  CreateOrderData,
  UpdateOrderData,
  OrderFormData,
} from "../types/order";

// API Gateway URL for order endpoints
const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Configure axios instance for order service through API Gateway
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`🔍 Order Service: Making request to: ${config.url}`);

    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No auth token found for order service request");
    }

    return config;
  },
  (error) => {
    console.error("❌ Order Service: Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ Order Service: Successful response from: ${response.config?.url}`
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(`❌ Order Service: Request failed: ${originalRequest?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(
        "🚨 401 Unauthorized - Authentication issue with order service"
      );

      // Instead of trying to refresh token here, let the main API service
      // handle auth issues to keep the logic centralized
      const authError = new Error(
        "Authentication failed for order service request. Please check your login status."
      );
      authError.name = "AuthenticationError";
      return Promise.reject(authError);
    }

    return Promise.reject(error);
  }
);

/**
 * Get all orders with filtering and pagination
 */
export const getOrders = async (
  filters: OrderFilters
): Promise<OrderApiResponse> => {
  try {
    // Use filter names that match the backend API directly
    const apiFilters = {
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      status: filters.status,
      client_id: filters.client_id,
      store_id: filters.store_id,
      rider_id: filters.rider_id,
      startDate: filters.startDate,
      endDate: filters.endDate,
      order_type: filters.order_type,
      payment_status: filters.payment_status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    console.log("Fetching orders with filters:", apiFilters);
    const response = await api.get("/orders", { params: apiFilters });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch orders",
    };
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (
  orderId: string
): Promise<OrderApiResponse> => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching order ${orderId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error || error.message || "Failed to fetch order",
    };
  }
};

/**
 * Create new order
 */
export const createOrder = async (
  orderFormData: OrderFormData
): Promise<OrderApiResponse> => {
  try {
    // Transform frontend form data to match backend API expectations
    const orderData: CreateOrderData = {
      orderNumber: generateOrderNumber(), // Helper function to generate a unique number
      clientId: orderFormData.clientId,
      clientName: orderFormData.clientName,
      storeId: orderFormData.storeId,
      storeName: orderFormData.storeName,
      cityId: orderFormData.cityId,
      orderType: orderFormData.orderType || "delivery",
      priority: orderFormData.priority || "normal",
      customerName: orderFormData.customerName,
      customerPhone: orderFormData.customerPhone,
      customerEmail: orderFormData.customerEmail,
      pickupAddress: orderFormData.pickupAddress,
      pickupLatitude: orderFormData.pickupLatitude,
      pickupLongitude: orderFormData.pickupLongitude,
      deliveryAddress: orderFormData.deliveryAddress,
      deliveryLatitude: orderFormData.deliveryLatitude,
      deliveryLongitude: orderFormData.deliveryLongitude,
      paymentMethod: orderFormData.paymentMethod,
      // Calculate order value from items
      orderValue: orderFormData.items.reduce(
        (sum: number, item: any) => sum + item.totalPrice,
        0
      ),
      deliveryFee: orderFormData.deliveryFee,
      // Calculate total including delivery fee
      totalAmount:
        orderFormData.items.reduce(
          (sum: number, item: any) => sum + item.totalPrice,
          0
        ) + orderFormData.deliveryFee,
      notes: orderFormData.notes,
      specialInstructions: orderFormData.specialInstructions,
      estimatedPickupTime: orderFormData.estimatedPickupTime
        ? new Date(orderFormData.estimatedPickupTime).toISOString()
        : undefined,
      estimatedDeliveryTime: orderFormData.estimatedDeliveryTime
        ? new Date(orderFormData.estimatedDeliveryTime).toISOString()
        : undefined,
      scheduledFor: orderFormData.scheduledFor
        ? new Date(orderFormData.scheduledFor).toISOString()
        : undefined,
      // Transform items to match backend expectations
      items: orderFormData.items.map((item: any) => ({
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      })),
    };

    console.log("Creating order with data:", orderData);
    const response = await api.post("/orders", orderData);
    return response.data;
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to create order",
    };
  }
};

/**
 * Generate a simple order number (in a real app this would be more sophisticated)
 */
const generateOrderNumber = (): string => {
  const prefix = "ORD";
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Update existing order
 */
export const updateOrder = async (
  orderId: string,
  orderFormData: Partial<OrderFormData>
): Promise<OrderApiResponse> => {
  try {
    // Transform frontend form data to match backend API expectations
    const orderData: Partial<UpdateOrderData> = {
      id: orderId,
    };

    // Only include fields that were provided in the update
    if (orderFormData.clientId) orderData.clientId = orderFormData.clientId;
    if (orderFormData.storeId) orderData.storeId = orderFormData.storeId;
    if (orderFormData.orderType) orderData.orderType = orderFormData.orderType;
    if (orderFormData.priority) orderData.priority = orderFormData.priority;
    if (orderFormData.customerName)
      orderData.customerName = orderFormData.customerName;
    if (orderFormData.customerPhone)
      orderData.customerPhone = orderFormData.customerPhone;
    if (orderFormData.customerEmail)
      orderData.customerEmail = orderFormData.customerEmail;
    if (orderFormData.pickupAddress)
      orderData.pickupAddress = orderFormData.pickupAddress;
    if (orderFormData.pickupLatitude)
      orderData.pickupLatitude = orderFormData.pickupLatitude;
    if (orderFormData.pickupLongitude)
      orderData.pickupLongitude = orderFormData.pickupLongitude;
    if (orderFormData.deliveryAddress)
      orderData.deliveryAddress = orderFormData.deliveryAddress;
    if (orderFormData.deliveryLatitude)
      orderData.deliveryLatitude = orderFormData.deliveryLatitude;
    if (orderFormData.deliveryLongitude)
      orderData.deliveryLongitude = orderFormData.deliveryLongitude;
    if (orderFormData.paymentMethod)
      orderData.paymentMethod = orderFormData.paymentMethod;
    if (orderFormData.deliveryFee)
      orderData.deliveryFee = orderFormData.deliveryFee;
    if (orderFormData.notes) orderData.notes = orderFormData.notes;
    if (orderFormData.specialInstructions)
      orderData.specialInstructions = orderFormData.specialInstructions;

    if (orderFormData.estimatedPickupTime) {
      orderData.estimatedPickupTime = new Date(
        orderFormData.estimatedPickupTime
      ).toISOString();
    }

    if (orderFormData.estimatedDeliveryTime) {
      orderData.estimatedDeliveryTime = new Date(
        orderFormData.estimatedDeliveryTime
      ).toISOString();
    }

    if (orderFormData.scheduledFor) {
      orderData.scheduledFor = new Date(
        orderFormData.scheduledFor
      ).toISOString();
    }

    // If items are provided, include them in the update
    if (orderFormData.items) {
      orderData.items = orderFormData.items.map((item: any) => ({
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      }));

      // Calculate order value from items
      orderData.orderValue = orderFormData.items.reduce(
        (sum: number, item: any) => sum + item.totalPrice,
        0
      );

      // Calculate total including delivery fee
      if (orderFormData.deliveryFee !== undefined) {
        orderData.totalAmount =
          orderData.orderValue + orderFormData.deliveryFee;
      }
    }

    console.log(`Updating order ${orderId} with data:`, orderData);
    const response = await api.put(`/orders/${orderId}`, orderData);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating order ${orderId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to update order",
    };
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<OrderApiResponse> => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error updating order ${orderId} status:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to update order status",
    };
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  reason: string
): Promise<OrderApiResponse> => {
  try {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  } catch (error: any) {
    console.error(`Error cancelling order ${orderId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to cancel order",
    };
  }
};

/**
 * Assign rider to order
 */
export const assignRider = async (
  orderId: string,
  riderId: string,
  vehicleId?: string
): Promise<OrderApiResponse> => {
  try {
    const response = await api.post(`/orders/${orderId}/assign`, {
      riderId,
      vehicleId,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error assigning rider to order ${orderId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to assign rider",
    };
  }
};

/**
 * Get order status history
 */
export const getOrderStatusHistory = async (
  orderId: string
): Promise<OrderApiResponse> => {
  try {
    const response = await api.get(`/orders/${orderId}/history`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching order ${orderId} history:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch order history",
    };
  }
};

/**
 * Get order analytics
 */
export const getOrderAnalytics = async (
  startDate?: string,
  endDate?: string
): Promise<OrderAnalyticsApiResponse> => {
  try {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get("/orders/analytics", { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching order analytics:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch order analytics",
    };
  }
};

/**
 * Get client's orders
 */
export const getClientOrders = async (
  clientId: string,
  filters?: Omit<OrderFilters, "clientId">
): Promise<OrderApiResponse> => {
  try {
    const params = { ...filters, clientId };
    const response = await api.get("/orders", { params });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching orders for client ${clientId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch client orders",
    };
  }
};

/**
 * Get store's orders
 */
export const getStoreOrders = async (
  storeId: string,
  filters?: Omit<OrderFilters, "storeId">
): Promise<OrderApiResponse> => {
  try {
    const params = { ...filters, storeId };
    const response = await api.get("/orders", { params });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching orders for store ${storeId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch store orders",
    };
  }
};

/**
 * Get rider's orders
 */
export const getRiderOrders = async (
  riderId: string,
  filters?: Omit<OrderFilters, "riderId">
): Promise<OrderApiResponse> => {
  try {
    const params = { ...filters, riderId };
    const response = await api.get("/orders", { params });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching orders for rider ${riderId}:`, error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch rider orders",
    };
  }
};

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  assignRider,
  getOrderStatusHistory,
  getOrderAnalytics,
  getClientOrders,
  getStoreOrders,
  getRiderOrders,
};
