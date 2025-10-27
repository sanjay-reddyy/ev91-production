/**
 * EV Rental API Service
 *
 * Handles communication with:
 * - Vehicle Service (port 4004) - for vehicle models and availability
 * - Rider Service (port 4005) - for rental management and payments
 */

import axios, { AxiosError } from "axios";
import {
  VehicleModel,
  AvailableRentalModelsResponse,
  RentalCostResponse,
  AvailableVehiclesResponse,
  RiderVehicleRental,
  RiderRentalPayment,
  CurrentRentalResponse,
  RentalHistoryResponse,
  RentalPaymentsResponse,
  CostCalculatorResponse,
  CreateRentalRequest,
  UpdateRentalRequest,
  UpdateVehiclePreferenceRequest,
  UpdatePaymentRequest,
  RentalCategory,
  VehicleRentalStatus,
} from "../types/evRental";

// API Base URLs
const VEHICLE_SERVICE_URL =
  import.meta.env.VITE_VEHICLE_SERVICE_URL || "";
const RIDER_SERVICE_URL =
  import.meta.env.VITE_RIDER_SERVICE_URL || "";
const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "";

// Determine if we should use API Gateway or direct service calls
// Default to TRUE to use API Gateway (which handles auth properly)
const USE_API_GATEWAY = import.meta.env.VITE_USE_API_GATEWAY !== "false";

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn("[EV Rental Service] No auth token found in localStorage");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Handle API errors consistently
 */
const handleApiError = (error: AxiosError, context: string) => {
  console.error(`[EV Rental API Error - ${context}]:`, error);

  if (error.response) {
    const data = error.response.data as any;
    throw new Error(data?.message || data?.error || `${context} failed`);
  } else if (error.request) {
    throw new Error(`${context}: No response from server`);
  } else {
    throw new Error(`${context}: ${error.message}`);
  }
};

// ============================================
// Vehicle Service APIs
// ============================================

/**
 * Get all available rental models
 * GET /api/v1/vehicle-models/available-for-rent (direct)
 * GET /api/vehicles/vehicle-models/available-for-rent (via gateway)
 */
export const getAvailableRentalModels = async (
  category?: RentalCategory
): Promise<VehicleModel[]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : VEHICLE_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? "/api/vehicles/vehicle-models/available-for-rent"
      : "/api/v1/vehicle-models/available-for-rent";
    const url = `${baseUrl}${path}`;

    const response = await axios.get<AvailableRentalModelsResponse>(url, {
      headers: getAuthHeaders(),
      params: category ? { category } : {},
    });

    return response.data?.data?.models || [];
  } catch (error) {
    handleApiError(error as AxiosError, "Get Available Rental Models");
    return [];
  }
};

/**
 * Calculate rental cost for a specific vehicle age
 * GET /api/v1/vehicle-models/:modelId/rental-cost (direct)
 * GET /api/vehicles/vehicle-models/:modelId/rental-cost (via gateway)
 */
export const calculateRentalCost = async (
  modelId: string,
  vehicleAge: number
): Promise<RentalCostResponse["data"]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : VEHICLE_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/vehicles/vehicle-models/${modelId}/rental-cost`
      : `/api/v1/vehicle-models/${modelId}/rental-cost`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<RentalCostResponse>(url, {
      headers: getAuthHeaders(),
      params: { vehicleAge },
    });

    if (!response.data?.data) {
      throw new Error("Invalid response from rental cost calculation");
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, "Calculate Rental Cost");
    throw error;
  }
};

/**
 * Get available vehicles for a specific model
 * GET /api/v1/vehicle-models/:modelId/available-vehicles (direct)
 * GET /api/vehicles/vehicle-models/:modelId/available-vehicles (via gateway)
 */
export const getAvailableVehicles = async (
  modelId: string,
  hubId?: string,
  cityId?: string
): Promise<AvailableVehiclesResponse["data"]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : VEHICLE_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/vehicles/vehicle-models/${modelId}/available-vehicles`
      : `/api/v1/vehicle-models/${modelId}/available-vehicles`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<AvailableVehiclesResponse>(url, {
      headers: getAuthHeaders(),
      params: { hubId, cityId },
    });

    if (!response.data?.data) {
      throw new Error("Invalid response from available vehicles");
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, "Get Available Vehicles");
    throw error;
  }
};

/**
 * Get a specific vehicle model by ID
 * GET /api/v1/vehicle-models/:modelId (direct)
 * GET /api/vehicles/vehicle-models/:modelId (via gateway)
 */
export const getVehicleModel = async (
  modelId: string
): Promise<VehicleModel> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : VEHICLE_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/vehicles/vehicle-models/${modelId}`
      : `/api/v1/vehicle-models/${modelId}`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    if (!response.data?.data) {
      throw new Error("Invalid response from vehicle model");
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, "Get Vehicle Model");
    throw error;
  }
};

// ============================================
// Rider Service - Rental Management APIs
// ============================================

/**
 * Get current active rental for a rider
 * GET /api/v1/riders/:riderId/rental (direct)
 * GET /api/riders/:riderId/rental (via gateway)
 */
export const getCurrentRental = async (
  riderId: string
): Promise<RiderVehicleRental | null> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental`
      : `/api/v1/riders/${riderId}/rental`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<CurrentRentalResponse>(url, {
      headers: getAuthHeaders(),
    });

    // Safely access nested rental property
    return response.data?.data?.rental || null;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null; // No active rental
    }
    handleApiError(axiosError, "Get Current Rental");
    return null;
  }
};

/**
 * Create a new rental for a rider
 * POST /api/v1/riders/:riderId/rental (direct)
 * POST /api/riders/:riderId/rental (via gateway)
 */
export const createRental = async (
  riderId: string,
  rentalData: CreateRentalRequest
): Promise<RiderVehicleRental> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental`
      : `/api/v1/riders/${riderId}/rental`;
    const url = `${baseUrl}${path}`;

    const response = await axios.post(url, rentalData, {
      headers: getAuthHeaders(),
    });

    return response.data?.data?.rental;
  } catch (error) {
    handleApiError(error as AxiosError, "Create Rental");
    throw error;
  }
};

/**
 * Update an existing rental
 * PATCH /api/v1/riders/:riderId/rental/:rentalId (direct)
 * PATCH /api/riders/:riderId/rental/:rentalId (via gateway)
 */
export const updateRental = async (
  riderId: string,
  rentalId: string,
  updates: UpdateRentalRequest
): Promise<RiderVehicleRental> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental/${rentalId}`
      : `/api/v1/riders/${riderId}/rental/${rentalId}`;
    const url = `${baseUrl}${path}`;

    const response = await axios.patch(url, updates, {
      headers: getAuthHeaders(),
    });

    return response.data?.data?.rental;
  } catch (error) {
    handleApiError(error as AxiosError, "Update Rental");
    throw error;
  }
};

/**
 * Get rental history for a rider
 * GET /api/v1/riders/:riderId/rental/history (direct)
 * GET /api/riders/:riderId/rental/history (via gateway)
 */
export const getRentalHistory = async (
  riderId: string,
  status?: VehicleRentalStatus
): Promise<RiderVehicleRental[]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental/history`
      : `/api/v1/riders/${riderId}/rental/history`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<RentalHistoryResponse>(url, {
      headers: getAuthHeaders(),
      params: status ? { status } : {},
    });

    return response.data?.data?.rentals || [];
  } catch (error) {
    handleApiError(error as AxiosError, "Get Rental History");
    return [];
  }
};

// ============================================
// Rider Service - Vehicle Preference APIs
// ============================================

/**
 * Update rider's vehicle preference
 * PATCH /api/v1/riders/:riderId/vehicle-preference (direct)
 * PATCH /api/riders/:riderId/vehicle-preference (via gateway)
 */
export const updateVehiclePreference = async (
  riderId: string,
  preference: UpdateVehiclePreferenceRequest
): Promise<void> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/vehicle-preference`
      : `/api/v1/riders/${riderId}/vehicle-preference`;
    const url = `${baseUrl}${path}`;

    console.log("[updateVehiclePreference] Sending request:", {
      url,
      riderId,
      payload: preference,
    });

    await axios.patch(url, preference, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("[updateVehiclePreference] Error details:", {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      payload: preference,
      payloadStringified: JSON.stringify(preference, null, 2),
    });

    // Log detailed validation errors if present
    if (
      axiosError.response?.data &&
      typeof axiosError.response.data === "object"
    ) {
      const errorData = axiosError.response.data as any;
      if (errorData.errors) {
        console.error(
          "[updateVehiclePreference] Validation errors:",
          errorData.errors
        );
      }
      if (errorData.message) {
        console.error(
          "[updateVehiclePreference] Error message:",
          errorData.message
        );
      }
    }

    handleApiError(axiosError, "Update Vehicle Preference");
    throw error;
  }
};

// ============================================
// Rider Service - Payment Management APIs
// ============================================

/**
 * Get rental payments for a rider
 * GET /api/v1/riders/:riderId/rental/payments (direct)
 * GET /api/riders/:riderId/rental/payments (via gateway)
 */
export const getRentalPayments = async (
  riderId: string,
  rentalId?: string
): Promise<RentalPaymentsResponse["data"]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental/payments`
      : `/api/v1/riders/${riderId}/rental/payments`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<RentalPaymentsResponse>(url, {
      headers: getAuthHeaders(),
      params: rentalId ? { rentalId } : {},
    });

    if (!response.data?.data) {
      throw new Error("Invalid response from rental payments");
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, "Get Rental Payments");
    throw error;
  }
};

/**
 * Update a rental payment
 * PATCH /api/v1/riders/:riderId/rental/payments/:paymentId (direct)
 * PATCH /api/riders/:riderId/rental/payments/:paymentId (via gateway)
 */
export const updateRentalPayment = async (
  riderId: string,
  paymentId: string,
  updates: UpdatePaymentRequest
): Promise<RiderRentalPayment> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental/payments/${paymentId}`
      : `/api/v1/riders/${riderId}/rental/payments/${paymentId}`;
    const url = `${baseUrl}${path}`;

    const response = await axios.patch(url, updates, {
      headers: getAuthHeaders(),
    });

    return response.data?.data?.payment;
  } catch (error) {
    handleApiError(error as AxiosError, "Update Rental Payment");
    throw error;
  }
};

// ============================================
// Rider Service - Cost Calculator API
// ============================================

/**
 * Calculate rental cost for a specific model and vehicle age
 * GET /api/v1/riders/:riderId/rental/cost-calculator (direct)
 * GET /api/riders/:riderId/rental/cost-calculator (via gateway)
 */
export const calculateRentalCostForRider = async (
  riderId: string,
  modelId: string,
  vehicleAge: number
): Promise<CostCalculatorResponse["data"]> => {
  try {
    const baseUrl = USE_API_GATEWAY ? API_GATEWAY_URL : RIDER_SERVICE_URL;
    const path = USE_API_GATEWAY
      ? `/api/riders/${riderId}/rental/cost-calculator`
      : `/api/v1/riders/${riderId}/rental/cost-calculator`;
    const url = `${baseUrl}${path}`;

    const response = await axios.get<CostCalculatorResponse>(url, {
      headers: getAuthHeaders(),
      params: { modelId, vehicleAge },
    });

    if (!response.data?.data) {
      throw new Error("Invalid response from cost calculator");
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, "Calculate Rental Cost for Rider");
    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate total amount paid from payments array
 */
export const calculateTotalPaid = (payments: RiderRentalPayment[]): number => {
  return payments.reduce((total, payment) => total + payment.amountPaid, 0);
};

/**
 * Calculate outstanding balance from payments array
 */
export const calculateOutstanding = (
  payments: RiderRentalPayment[]
): number => {
  return payments.reduce((total, payment) => {
    if (payment.status === "PENDING" || payment.status === "OVERDUE") {
      return total + (payment.amountDue - payment.amountPaid);
    }
    return total;
  }, 0);
};

/**
 * Get payment status color for UI
 */
export const getPaymentStatusColor = (
  status: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
      return "warning";
    case "OVERDUE":
      return "error";
    case "WAIVED":
      return "default";
    default:
      return "default";
  }
};

/**
 * Get rental status color for UI
 */
export const getRentalStatusColor = (
  status: string
): "success" | "info" | "warning" | "error" | "default" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "info";
    case "COMPLETED":
      return "default";
    case "CANCELLED":
    case "TERMINATED":
      return "error";
    default:
      return "default";
  }
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Check if payment is overdue
 */
export const isPaymentOverdue = (payment: RiderRentalPayment): boolean => {
  if (payment.status === "PAID" || payment.status === "WAIVED") {
    return false;
  }
  const dueDate = new Date(payment.dueDate);
  const today = new Date();
  return today > dueDate;
};

export default {
  // Vehicle Service
  getAvailableRentalModels,
  calculateRentalCost,
  getAvailableVehicles,
  getVehicleModel,

  // Rental Management
  getCurrentRental,
  createRental,
  updateRental,
  getRentalHistory,

  // Vehicle Preference
  updateVehiclePreference,

  // Payment Management
  getRentalPayments,
  updateRentalPayment,

  // Cost Calculator
  calculateRentalCostForRider,

  // Utilities
  formatCurrency,
  calculateTotalPaid,
  calculateOutstanding,
  getPaymentStatusColor,
  getRentalStatusColor,
  formatDate,
  isPaymentOverdue,
};
