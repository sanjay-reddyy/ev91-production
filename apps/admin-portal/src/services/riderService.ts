import axios from "axios";

const RIDER_SERVICE_URL =
  import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api/v1";

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

  if (!token) {
    console.warn(
      "No auth token found in localStorage when making rider API request"
    );
  } else {
    console.log("Auth token found and will be used for rider API request");
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized request to rider service:", error.config?.url);
      // Handle auth errors if needed
    }
    return Promise.reject(error);
  }
);

// Types for Rider Management
export interface Rider {
  id: string;
  phone: string;
  phoneVerified: boolean;
  name: string | null;
  email: string | null;
  dob: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  aadharNumber: string | null;
  panNumber: string | null;
  drivingLicenseNumber: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  registrationStatus: "pending" | "completed" | "rejected" | "incomplete";
  kycStatus: "pending" | "verified" | "rejected" | "incomplete";
  agreementSigned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Vehicle Assignment
  assignedVehicleId: string | null;
  assignedVehicle?: VehicleAssignment;
  // Store Assignment
  assignedStoreId: string | null;
  assignedClientId: string | null;
  storeAssignmentDate: string | null;
  storeAssignmentNotes: string | null;
  assignedStore?: StoreAssignment;
  assignedClient?: ClientAssignment;
  // Rider Performance Metrics
  totalOrders?: number;
  averageRating?: number;
  totalEarnings?: number;
  completionRate?: number;
}

export interface VehicleAssignment {
  id: string;
  make: string;
  model: string;
  registrationNumber: string;
  vehicleType: string;
  fuelType: string;
  assignedDate: string;
  status?: string;
  operationalStatus?: string;
  hubId?: string;
  hubName?: string;
}

export interface StoreAssignment {
  id: string;
  storeName: string;
  storeCode: string;
  storeType: string;
  city: string;
  state: string;
  completeAddress: string;
  assignedDate: string;
}

export interface ClientAssignment {
  id: string;
  name: string;
  clientCode: string;
  clientType: string;
  city?: string;
  state?: string;
}

export interface RiderKYC {
  id: string;
  riderId: string;
  documentType: string;
  documentNumber: string;
  documentImageUrl: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationDate: string | null;
  verificationNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiderOrder {
  id: string;
  riderId: string;
  orderId: string;
  clientId: string;
  storeId: string;
  orderValue: number;
  deliveryStatus: "pending" | "picked_up" | "delivered" | "cancelled";
  orderDate: string;
  deliveryStartTime: string | null;
  deliveryEndTime: string | null;
  customerRating: number | null;
  distance: number | null;
  earnings: number;
  bonuses: number;
  penalties: number;
  totalEarning: number;
}

export interface RiderEarning {
  id: string;
  riderId: string;
  clientId: string;
  storeId: string;
  orderId: string | null;
  baseRate: number;
  storeOfferRate: number;
  totalRate: number;
  bulkOrderBonus: number;
  performanceBonus: number;
  weeklyTargetBonus: number;
  specialEventBonus: number;
  finalEarning: number;
  orderDate: string;
  deliveryTime: number | null;
  riderRating: number | null;
  distance: number | null;
  paymentStatus: "pending" | "paid" | "processing" | "failed" | "cancelled";
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  store?: {
    id: string;
    storeName: string;
    client: {
      name: string;
    };
  };
}

export interface RiderEarningsSummary {
  totalEarnings: number;
  totalOrders: number;
  averageEarningPerOrder: number;
  totalDistance: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

export interface RiderRegistrationData {
  phone: string;
  name: string;
  email?: string;
  dob?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadharNumber?: string;
  panNumber?: string;
  drivingLicenseNumber?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

export interface RiderKYCSubmission {
  documentType: string;
  documentNumber: string;
  documentImage?: File;
}

export interface RiderPerformanceMetrics {
  riderId: string;
  period: "weekly" | "monthly" | "yearly";
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  averageDeliveryTime: number;
  averageRating: number;
  totalEarnings: number;
  totalDistance: number;
  onTimeDeliveries: number;
  onTimePercentage: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// Rider Service Class
class RiderService {
  // ==========================================
  // RIDER MANAGEMENT
  // ==========================================

  /**
   * Get all riders with filtering and pagination
   */
  async getRiders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    registrationStatus?: string;
    kycStatus?: string;
    isActive?: boolean;
    city?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<APIResponse<Rider[]>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.registrationStatus)
      queryParams.append("registrationStatus", params.registrationStatus);
    if (params?.kycStatus) queryParams.append("kycStatus", params.kycStatus);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.city) queryParams.append("city", params.city);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(`/riders?${queryParams}`);
    return response.data;
  }

  /**
   * Get rider by ID with detailed information
   */
  async getRiderById(riderId: string): Promise<APIResponse<Rider>> {
    const response = await api.get(`/riders/${riderId}`);
    return response.data;
  }

  /**
   * Create new rider
   */
  async createRider(
    riderData: RiderRegistrationData
  ): Promise<APIResponse<Rider>> {
    const response = await api.post(`/riders`, riderData);
    return response.data;
  }

  /**
   * Update rider information
   */
  async updateRider(
    riderId: string,
    riderData: Partial<RiderRegistrationData>
  ): Promise<APIResponse<Rider>> {
    const response = await api.put(`/riders/${riderId}`, riderData);
    return response.data;
  }

  /**
   * Delete rider (soft delete)
   */
  async deleteRider(riderId: string): Promise<APIResponse<void>> {
    const response = await api.delete(`/riders/${riderId}`);
    return response.data;
  }

  /**
   * Activate/Deactivate rider
   */
  async toggleRiderStatus(
    riderId: string,
    isActive: boolean
  ): Promise<APIResponse<Rider>> {
    const response = await api.patch(`/riders/${riderId}/status`, { isActive });
    return response.data;
  }

  /**
   * Approve rider registration
   */
  async approveRider(riderId: string): Promise<APIResponse<Rider>> {
    const response = await api.patch(`/riders/${riderId}/approve`);
    return response.data;
  }

  /**
   * Reject rider registration
   */
  async rejectRider(
    riderId: string,
    reason: string
  ): Promise<APIResponse<Rider>> {
    const response = await api.patch(`/riders/${riderId}/reject`, { reason });
    return response.data;
  }

  // ==========================================
  // KYC MANAGEMENT
  // ==========================================

  /**
   * Get rider KYC documents
   */
  async getRiderKYC(riderId: string): Promise<APIResponse<RiderKYC[]>> {
    const response = await api.get(`/riders/${riderId}/kyc`);
    return response.data;
  }

  /**
   * Submit KYC document for rider
   */
  async submitKYC(
    riderId: string,
    kycData: RiderKYCSubmission
  ): Promise<APIResponse<RiderKYC>> {
    const formData = new FormData();
    formData.append("documentType", kycData.documentType);
    formData.append("documentNumber", kycData.documentNumber);
    if (kycData.documentImage) {
      formData.append("documentImage", kycData.documentImage);
    }

    const response = await api.post(`/riders/${riderId}/kyc`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Verify rider KYC
   */
  async verifyKYC(
    riderId: string,
    kycId: string,
    status: "verified" | "rejected",
    notes?: string
  ): Promise<APIResponse<RiderKYC>> {
    const response = await api.patch(`/riders/${riderId}/kyc/${kycId}/verify`, {
      status,
      notes,
    });
    return response.data;
  }

  /**
   * Get pending KYC submissions for admin review
   */
  async getPendingKYC(): Promise<APIResponse<RiderKYC[]>> {
    const response = await api.get(`/admin/kyc/pending`);
    return response.data;
  }

  // ==========================================
  // RIDER ORDERS
  // ==========================================

  /**
   * Get rider orders with filtering
   */
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
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(`/riders/${riderId}/orders?${queryParams}`);
    return response.data;
  }

  // ==========================================
  // RIDER EARNINGS
  // ==========================================

  /**
   * Get rider earnings with filtering
   */
  async getRiderEarnings(
    riderId: string,
    params?: {
      page?: number;
      limit?: number;
      period?: "weekly" | "monthly" | "yearly";
      dateFrom?: string;
      dateTo?: string;
      paymentStatus?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<APIResponse<RiderEarning[]>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.period) queryParams.append("period", params.period);
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params?.paymentStatus)
      queryParams.append("paymentStatus", params.paymentStatus);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(
      `/riders/${riderId}/earnings?${queryParams}`
    );
    return response.data;
  }

  /**
   * Get rider earnings summary
   */
  async getRiderEarningsSummary(
    riderId: string,
    period?: "weekly" | "monthly" | "yearly"
  ): Promise<APIResponse<RiderEarningsSummary>> {
    const queryParams = period ? `?period=${period}` : "";
    const response = await api.get(
      `/riders/${riderId}/earnings/summary${queryParams}`
    );
    return response.data;
  }

  // ==========================================
  // VEHICLE ASSIGNMENT
  // ==========================================

  /**
   * Assign vehicle to rider
   */
  async assignVehicle(
    riderId: string,
    vehicleId: string,
    hubId?: string
  ): Promise<APIResponse<Rider>> {
    const response = await api.post(`/riders/${riderId}/assign-vehicle`, {
      vehicleId,
      hubId,
    });
    return response.data;
  }

  /**
   * Unassign vehicle from rider
   */
  async unassignVehicle(riderId: string): Promise<APIResponse<Rider>> {
    const response = await api.delete(`/riders/${riderId}/assign-vehicle`);
    return response.data;
  }

  /**
   * Assign vehicle to rider
   */
  async assignVehicleToRider(
    riderId: string,
    assignmentData: { vehicleId: string; hubId?: string }
  ): Promise<APIResponse<Rider>> {
    try {
      const response = await api.post(
        `/admin/riders/${riderId}/assign-vehicle`,
        assignmentData
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning vehicle to rider:", error);
      throw error;
    }
  }

  /**
   * Unassign vehicle from rider
   */
  async unassignVehicleFromRider(riderId: string): Promise<APIResponse<Rider>> {
    try {
      const response = await api.delete(
        `/admin/riders/${riderId}/assign-vehicle`
      );
      return response.data;
    } catch (error) {
      console.error("Error unassigning vehicle from rider:", error);
      throw error;
    }
  }

  /**
   * Get available vehicles (existing method - keeping for reference)
   */
  async getAvailableVehicles(
    hubId?: string
  ): Promise<APIResponse<VehicleAssignment[]>> {
    try {
      // Call vehicle service directly
      const vehicleServiceUrl = "http://localhost:4004/api/v1/vehicles";
      const params = new URLSearchParams();

      // Filter by operational status
      params.append("operationalStatus", "Available");

      // Filter by hub if provided
      if (hubId) {
        params.append("hubId", hubId);
      }

      const response = await axios.get(
        `${vehicleServiceUrl}?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Transform the response to match VehicleAssignment interface
      console.log("getAvailableVehicles - API response:", response.data);
      const vehicles = response.data.data || [];
      console.log("getAvailableVehicles - vehicles to transform:", vehicles);
      const transformedVehicles = vehicles.map((vehicle: any) => ({
        id: vehicle.id,
        make: vehicle.model?.oem?.name || "Unknown",
        model: vehicle.model?.name || "Unknown",
        registrationNumber: vehicle.registrationNumber,
        vehicleType: vehicle.vehicleType || "Unknown",
        fuelType: vehicle.model?.fuelType || "Unknown",
        assignedDate: vehicle.assignedDate || "",
        status: vehicle.serviceStatus,
        operationalStatus: vehicle.operationalStatus,
        hubId: vehicle.hubId,
        hubName: vehicle.hub?.name,
      }));

      console.log(
        "getAvailableVehicles - transformed vehicles:",
        transformedVehicles
      );

      return {
        success: true,
        message: "Available vehicles fetched successfully",
        data: transformedVehicles,
      };
    } catch (error: any) {
      console.error("Error fetching available vehicles:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch available vehicles",
        data: [],
      };
    }
  }

  /**
   * Get available hubs for dropdown
   */
  async getHubs(): Promise<APIResponse<any[]>> {
    try {
      // Call vehicle service directly since it has optionalAuth
      const vehicleServiceUrl = "http://localhost:4004/api/v1/hubs";

      const response = await axios.get(vehicleServiceUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Raw hub response:", response.data);
      const hubsData = response.data.data || [];
      console.log("Processed hubs data:", hubsData);

      return {
        success: true,
        message: "Hubs fetched successfully",
        data: hubsData,
      };
    } catch (error: any) {
      console.error("Error fetching hubs:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch hubs",
        data: [],
      };
    }
  }

  // ==========================================
  // PERFORMANCE METRICS
  // ==========================================

  /**
   * Get rider performance metrics
   */
  async getRiderPerformance(
    riderId: string,
    period: "weekly" | "monthly" | "yearly"
  ): Promise<APIResponse<RiderPerformanceMetrics>> {
    const response = await api.get(
      `/riders/${riderId}/performance?period=${period}`
    );
    return response.data;
  }

  /**
   * Get all riders performance summary
   */
  async getAllRidersPerformance(params?: {
    period?: "weekly" | "monthly" | "yearly";
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<APIResponse<RiderPerformanceMetrics[]>> {
    const queryParams = new URLSearchParams();

    if (params?.period) queryParams.append("period", params.period);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(`/performance?${queryParams}`);
    return response.data;
  }

  // ==========================================
  // REPORTING AND ANALYTICS
  // ==========================================

  /**
   * Export rider data to CSV
   */
  async exportRiders(filters?: any): Promise<Blob> {
    const queryParams = new URLSearchParams(filters);
    const response = await api.get(`/export/riders?${queryParams}`, {
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Assign store to rider
   */
  async assignStoreToRider(
    riderId: string,
    storeData: {
      storeId: string;
      clientId: string;
      notes?: string;
    }
  ): Promise<APIResponse<Rider>> {
    try {
      const response = await api.post(
        `/admin/riders/${riderId}/assign-store`,
        storeData
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning store to rider:", error);
      throw error;
    }
  }

  /**
   * Unassign store from rider
   */
  async unassignStoreFromRider(riderId: string): Promise<APIResponse<Rider>> {
    try {
      const response = await api.delete(
        `/admin/riders/${riderId}/assign-store`
      );
      return response.data;
    } catch (error) {
      console.error("Error unassigning store from rider:", error);
      throw error;
    }
  }

  /**
   * Get rider statistics for dashboard
   */
  async getRiderStats(): Promise<
    APIResponse<{
      totalRiders: number;
      activeRiders: number;
      pendingRegistrations: number;
      pendingKYC: number;
      verifiedRiders: number;
      totalEarnings: number;
      averageRating: number;
      completionRate: number;
    }>
  > {
    const response = await api.get(`/stats`);
    return response.data;
  }
}

export const riderService = new RiderService();
export default riderService;
