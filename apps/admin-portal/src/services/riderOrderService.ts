import axios from "axios";

const RIDER_SERVICE_URL =
  import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api";

// Configure axios instance for rider service
const api = axios.create({
  baseURL: RIDER_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export interface RiderOrder {
  id: string;
  orderId: string;
  riderId: string;
  customerName: string;
  createdAt: string;
  status: string;
  amount: number;
  rating: number | null;
}

export interface RiderPayment {
  id: string;
  riderId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Rider Orders and Payments Service
const riderOrderService = {
  // Get orders for a rider
  async getRiderOrders(
    riderId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<APIResponse<RiderOrder[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
      if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const response = await api.get(
        `/riders/${riderId}/orders?${queryParams}`
      );

      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error("Error fetching rider orders:", error);
      return {
        success: false,
        data: [],
        message: error.message || "Error fetching rider orders",
      };
    }
  },

  // Get payments for a rider
  async getRiderPayments(
    riderId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<APIResponse<RiderPayment[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
      if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const response = await api.get(
        `/riders/${riderId}/payments?${queryParams}`
      );

      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error("Error fetching rider payments:", error);
      return {
        success: false,
        data: [],
        message: error.message || "Error fetching rider payments",
      };
    }
  },

  // Get order details
  async getRiderOrderDetails(
    riderId: string,
    orderId: string
  ): Promise<APIResponse<RiderOrder>> {
    try {
      const response = await api.get(`/riders/${riderId}/orders/${orderId}`);

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Error fetching rider order details:", error);
      return {
        success: false,
        data: {} as RiderOrder,
        message: error.message || "Error fetching rider order details",
      };
    }
  },

  // Get payment details
  async getRiderPaymentDetails(
    riderId: string,
    paymentId: string
  ): Promise<APIResponse<RiderPayment>> {
    try {
      const response = await api.get(
        `/riders/${riderId}/payments/${paymentId}`
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Error fetching rider payment details:", error);
      return {
        success: false,
        data: {} as RiderPayment,
        message: error.message || "Error fetching rider payment details",
      };
    }
  },
};

export default riderOrderService;
