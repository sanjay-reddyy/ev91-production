import axios from "axios";

const RIDER_SERVICE_URL =
  import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api";

// Configure axios instance for rider service
// Note: The baseURL already includes /api, so all endpoint paths should NOT include /riders at the beginning
// This is because the API Gateway is already configured to route /api/riders/* to the rider service
const api = axios.create({
  baseURL: `${RIDER_SERVICE_URL}/riders`,
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
  publicRiderId?: string | null; // Human-readable rider ID (e.g., MAA-25-R000001)
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
  selfie?: string | null; // Profile picture/selfie URL
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
  // EV Rental Fields
  needsEvRental?: boolean;
  vehiclePreference?: string | null;
  preferredVehicleModelId?: string | null;
  workType?: "FULL_TIME" | "PART_TIME" | null;
  rentalStatus?: string;
  ownVehicleType?: string | null;
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
  operationalStatus?:
    | "Available"
    | "Assigned"
    | "Under Maintenance"
    | "Retired"
    | "Damaged"; // Matching vehicle's operationalStatus enum
  serviceStatus?: "Active" | "Inactive" | "Scheduled for Service"; // Matching vehicle's serviceStatus enum
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

  // Additional fields for improved display
  documentTypeDisplay?: string; // Human-readable document type
  documentPreviewUrl?: string; // URL for thumbnail/preview
  isValid?: boolean; // Whether document is valid (based on verification)
  expiryDate?: string | null; // Document expiry date if applicable
}

export interface RiderBankDetails {
  id: string;
  riderId: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: "SAVINGS" | "CURRENT";
  ifscCode: string;
  bankName: string;
  branchName: string | null;
  branchAddress: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationDate: string | null;
  verificationNotes: string | null;
  verifiedBy: string | null;
  proofDocumentType: "PASSBOOK" | "CANCELLED_CHEQUE" | "BANK_STATEMENT" | null;
  proofDocumentUrl: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
  addedBy: string | null;
  lastEditedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  rider?: {
    id: string;
    name: string;
    phone: string;
    publicRiderId: string | null;
  };
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
   * Get all riders with filtering and pagination - enhanced with error handling and logging
   */
  async getRiders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    registrationStatus?: string;
    kycStatus?: string;
    isActive?: boolean;
    city?: string;
    storeId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<APIResponse<Rider[]>> {
    console.log("🔄 riderService.getRiders - START", { params });

    try {
      // Double-check token before making request
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token available for getRiders");
        return {
          success: false,
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalItems: 0,
            totalPages: 0,
          },
          message: "Authentication required",
        };
      }

      const queryParams = new URLSearchParams();

      // Ensure page and limit are always included with default values
      queryParams.append("page", params?.page?.toString() || "1");
      queryParams.append("limit", params?.limit?.toString() || "10");

      // Add other optional parameters with improved filter handling
      if (params?.search) {
        console.log(`Adding search filter: ${params.search}`);
        queryParams.append("search", params.search);
      }

      if (params?.registrationStatus) {
        console.log(
          `Adding registrationStatus filter: ${params.registrationStatus}`
        );
        queryParams.append("registrationStatus", params.registrationStatus);
      }

      if (params?.kycStatus) {
        console.log(`Adding kycStatus filter: ${params.kycStatus}`);
        queryParams.append("kycStatus", params.kycStatus);
      }

      if (params?.isActive !== undefined) {
        // Make sure we send a proper boolean string representation
        const isActiveValue = params.isActive === true ? "true" : "false";
        console.log(
          `Adding isActive filter: ${params.isActive} (sending as ${isActiveValue})`
        );
        queryParams.append("isActive", isActiveValue);
      }

      if (params?.city) {
        console.log(`Adding city filter: ${params.city}`);
        queryParams.append("city", params.city);
      }

      if (params?.storeId) {
        console.log(`Adding storeId filter: ${params.storeId}`);
        queryParams.append("storeId", params.storeId);
      }

      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      // Add cache buster to prevent browser caching
      queryParams.append("_", Date.now().toString());

      console.log("🔍 API Request Debug:", {
        url: "/riders",
        params: Object.fromEntries(queryParams.entries()),
        fullUrl: `/?${queryParams.toString()}`,
      });

      // Make the API call with our filters
      const response = await api.get(`/?${queryParams}`);

      // Enhanced response debugging
      console.log("📡 API Response Debug:", {
        dataLength: response.data?.data?.length || 0,
        totalFromPagination: response.data?.pagination?.totalItems,
        responseStructure: Object.keys(response.data || {}),
        success: response.data?.success,
        firstFewRiders: response.data?.data?.slice(0, 2).map((r: Rider) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          isActive: r.isActive,
          registrationStatus: r.registrationStatus,
        })),
      });

      // Enhanced debugging for rider status
      if (response.data?.data?.length > 0) {
        console.log("👥 Riders status summary:", {
          activeCount: response.data.data.filter(
            (r: Rider) => r.isActive === true
          ).length,
          inactiveCount: response.data.data.filter(
            (r: Rider) => r.isActive === false
          ).length,
          unknownCount: response.data.data.filter(
            (r: Rider) => r.isActive === undefined
          ).length,
          // Add vehicle assignment debugging
          withVehicleIdCount: response.data.data.filter(
            (r: Rider) =>
              r.assignedVehicleId !== null && r.assignedVehicleId !== undefined
          ).length,
          withVehicleObjectCount: response.data.data.filter(
            (r: Rider) =>
              r.assignedVehicle !== null && r.assignedVehicle !== undefined
          ).length,
          sampleRider: response.data.data[0]
            ? {
                id: response.data.data[0].id,
                isActive: response.data.data[0].isActive,
                registrationStatus: response.data.data[0].registrationStatus,
                // Add vehicle details to sample
                assignedVehicleId: response.data.data[0].assignedVehicleId,
                hasAssignedVehicle: !!response.data.data[0].assignedVehicle,
              }
            : null,
        });
      }

      console.log("✅ riderService.getRiders - SUCCESS");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn(
          "Authentication required for rider list - returning empty list"
        );
        // Return empty but structured data instead of throwing
        return {
          success: false,
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalItems: 0,
            totalPages: 0,
          },
          message: "Authentication required",
        };
      }
      // For other errors, log and rethrow
      console.error("Error in getRiders:", error);
      throw error;
    }
  }

  /**
   * Get rider by ID with detailed information and cache busting
   */
  async getRiderById(riderId: string): Promise<APIResponse<Rider>> {
    // Add cache buster to prevent browser caching
    const cacheBuster = `_t=${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    console.log(
      `🔍 Fetching rider with ID ${riderId} with cache buster ${cacheBuster}`
    );

    try {
      // Use cache buster in the URL instead of headers to avoid CORS issues
      // Remove leading slash to avoid path issues with baseURL
      const response = await api.get(`${riderId}?${cacheBuster}`);

      // Save the raw response for debugging
      const rawIsActive = response.data?.data?.isActive;
      const rawIsActiveType = typeof rawIsActive;

      // Process the response to ensure boolean values are correctly handled
      if (response.data?.data) {
        // Ensure isActive is a proper boolean by doing an explicit conversion
        // Use === comparison to ensure true Boolean value
        const originalValue = response.data.data.isActive;
        const convertedValue = originalValue === true;

        // Force the value to be a strict boolean
        response.data.data.isActive = convertedValue;

        // Log the conversion details
        console.log(`Boolean conversion for isActive:`, {
          original: originalValue,
          originalType: typeof originalValue,
          originalStringified: JSON.stringify(originalValue),
          converted: convertedValue,
          convertedType: typeof convertedValue,
          convertedStringified: JSON.stringify(convertedValue),
          convertedCheck: convertedValue ? "TRUE" : "FALSE",
        });
      }

      // Enhanced debug logging for rider status and vehicle assignment
      console.log(`✅ Successfully fetched rider ${riderId}:`, {
        rawIsActive: rawIsActive,
        rawIsActiveType: rawIsActiveType,
        rawIsActiveStringified: JSON.stringify(rawIsActive),
        processedIsActive: response.data?.data?.isActive,
        processedIsActiveType: typeof response.data?.data?.isActive,
        registrationStatus: response.data?.data?.registrationStatus,
        assignedVehicleId: response.data?.data?.assignedVehicleId,
        hasAssignedVehicle: !!response.data?.data?.assignedVehicle,
        assignedVehicleDetails: response.data?.data?.assignedVehicle
          ? {
              registrationNumber:
                response.data.data.assignedVehicle.registrationNumber,
              operationalStatus:
                response.data.data.assignedVehicle.operationalStatus,
            }
          : null,
      });

      // Log the entire response data structure to verify all fields
      console.log(
        "Full rider data structure:",
        JSON.stringify(response.data.data, null, 2)
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching rider ${riderId}:`, error);
      throw error;
    }
  }

  /**
   * Create new rider
   */
  async createRider(
    riderData: RiderRegistrationData
  ): Promise<APIResponse<Rider>> {
    const response = await api.post(``, riderData);
    return response.data;
  }

  /**
   * Update rider information
   */
  async updateRider(
    riderId: string,
    riderData: Partial<RiderRegistrationData>
  ): Promise<APIResponse<Rider>> {
    const response = await api.put(`${riderId}`, riderData);
    return response.data;
  }

  /**
   * Delete rider (soft delete)
   */
  async deleteRider(riderId: string): Promise<APIResponse<void>> {
    const response = await api.delete(`${riderId}`);
    return response.data;
  }

  /**
   * Activate/Deactivate rider with cache busting and enhanced error handling
   * Fixed URL construction for proper API path
   * @param riderId The ID of the rider to toggle status
   * @param isActive The new active status (true for active, false for inactive)
   */
  async toggleRiderStatus(
    riderId: string,
    isActive: boolean
  ): Promise<APIResponse<Rider>> {
    try {
      // Add timestamp to URL for cache busting
      const cacheBuster = `_t=${Date.now()}`;

      console.log(
        `[riderService] Toggling rider status: riderId=${riderId}, isActive=${isActive} (${typeof isActive}), cacheBuster=${cacheBuster}`
      );

      // Call the API to update the rider's active status
      // Fixed URL - ensure proper path with /riders/ prefix
      // Convert isActive to strict boolean to ensure proper serialization
      const isActiveBool = isActive === true;

      console.log(
        `[riderService] Sending status update with isActive=${isActiveBool} (${typeof isActiveBool})`
      );

      // Force true/false in the payload to ensure API receives a boolean
      const payload = {
        isActive: isActiveBool,
      };

      console.log(
        "[riderService] Payload for status update:",
        JSON.stringify(payload)
      );

      // Fixed path - we should not include the /riders/ prefix since it's already in the baseURL
      const response = await api.patch(
        `${riderId}/status?${cacheBuster}`,
        payload
      );

      console.log("Rider status API response:", response.data);

      // Always fetch the rider again to get updated data after status change
      if (response.data.success) {
        console.log(
          "[riderService] Status update successful, fetching latest rider data"
        );

        // Add longer delay before fetching updated data to ensure consistency with database
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Add stronger cache busting for the getRiderById call
        const uniqueCacheBuster = `_cb=${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`;

        try {
          // Make direct API call to bypass any caching
          const freshResponse = await api.get(
            `${riderId}?${uniqueCacheBuster}`
          );

          console.log("[riderService] Raw updated rider data:", {
            success: freshResponse.data.success,
            isActive: freshResponse.data.data?.isActive,
            isActiveType: typeof freshResponse.data.data?.isActive,
          });

          // Double check the isActive status in the response
          if (freshResponse.data.success) {
            // Force isActive to be a boolean to ensure consistency
            const actualValue = freshResponse.data.data.isActive;
            const strictBooleanValue = actualValue === true;

            // Update the value in the response to ensure it's a strict boolean
            freshResponse.data.data.isActive = strictBooleanValue;

            console.log("[riderService] Updated rider active status:", {
              expected: isActive,
              actual: actualValue,
              actualType: typeof actualValue,
              strictBoolean: strictBooleanValue,
              match: strictBooleanValue === isActive,
            });
          }

          return freshResponse.data;
        } catch (fetchError) {
          console.error(
            "[riderService] Error fetching updated rider data:",
            fetchError
          );

          // Fall back to returning the original response but ensure isActive is correct
          // This ensures the component will at least show the correct button state
          if (response.data?.data) {
            response.data.data.isActive = isActiveBool;
          }
          return response.data;
        }
      }

      return response.data;
    } catch (error: any) {
      console.error("Error in toggleRiderStatus:", error);

      // Handle business validation errors properly
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
          data: {} as Rider,
        };
      }

      throw error;
    }
  }

  /**
   * Approve rider registration
   */
  async approveRider(riderId: string): Promise<APIResponse<Rider>> {
    const response = await api.patch(`${riderId}/approve`);
    return response.data;
  }

  /**
   * Approve rider registration with option to activate
   */
  async approveRiderWithActivation(
    riderId: string,
    activateImmediately: boolean = true
  ): Promise<APIResponse<Rider>> {
    const response = await api.patch(`${riderId}/approve`, {
      activateImmediately,
    });
    return response.data;
  }

  /**
   * Complete rider registration and verify KYC in one step
   * Use the admin API endpoint to complete registration and optionally activate the rider
   */
  async completeRiderRegistration(
    riderId: string,
    options: {
      kycVerified?: boolean;
      activateRider?: boolean;
    } = {}
  ): Promise<APIResponse<Rider>> {
    try {
      console.log(
        `[riderService] Completing registration for rider ${riderId} with options:`,
        options
      );

      // Path: /{riderId}/complete-registration
      // Combined with baseURL (/api/riders), this becomes: /api/riders/{riderId}/complete-registration
      const response = await api.patch(
        `/${riderId}/complete-registration`,
        options
      );

      console.log(`[riderService] Complete registration response:`, {
        success: response.data.success,
        message: response.data.message,
        riderId: response.data.data?.id,
        isActive: response.data.data?.isActive,
      });

      return response.data;
    } catch (error) {
      console.error(
        `[riderService] Error completing rider registration:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get rider registration status details
   * This returns additional information about the registration progress
   * @param riderId The ID of the rider
   * @param cacheBuster Optional cache busting parameter to prevent browser caching
   */
  async getRiderRegistrationStatus(
    riderId: string,
    cacheBuster?: string
  ): Promise<
    APIResponse<{
      riderId: string;
      phone: string;
      name: string;
      registrationStatus: string;
      isActive: boolean;
      kycStatus: string;
      progress: number;
      completionPercentage: number;
      completedSteps: number;
      totalSteps: number;
      steps: Array<{
        step: string;
        completed: boolean;
        required: boolean;
        status: string;
        details?: string;
      }>;
      canComplete: boolean;
      missingFields: string[];
      nextAction: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    // Based on examining app.ts and completeRegistration.ts:
    // 1. The route for registration status is defined in completeRegistration.ts as "/riders/:riderId/status"
    // 2. In app.ts, completeRegistrationRoutes are mounted at "/api/v1/registration"
    // 3. The API Gateway routes "/api/riders/*" to the rider service
    // 4. The backend path is "/api/v1/registration/riders/:riderId/status"
    // 5. To access this through the API Gateway at /api/riders, we use "/registration/riders/:riderId/status"

    // Since our baseURL is already "http://localhost:8000/api/riders",
    // we can directly access the registration path relative to the riders endpoint
    const url = cacheBuster
      ? `/registration/riders/${riderId}/status?${cacheBuster}`
      : `/registration/riders/${riderId}/status`;

    console.log(
      `[riderService] Fetching registration status for rider ${riderId}`,
      {
        withCacheBuster: !!cacheBuster,
        url,
        fullUrl: `${api.defaults.baseURL}${url}`,
      }
    );

    const response = await api.get(url);

    // Debug the raw response to check isActive type
    const rawIsActive = response.data?.data?.isActive;
    console.log(`[riderService] Raw registration status response:`, {
      isActive: rawIsActive,
      isActiveType: typeof rawIsActive,
      isActiveStrictBoolean: rawIsActive === true,
    });

    return response.data;
  }

  /**
   * Reject rider registration
   */
  async rejectRider(
    riderId: string,
    reason: string
  ): Promise<APIResponse<Rider>> {
    const response = await api.patch(`${riderId}/reject`, { reason });
    return response.data;
  }

  // ==========================================
  // KYC MANAGEMENT
  // ==========================================

  /**
   * Get rider KYC documents with enhanced logging and cache busting
   */
  async getRiderKYC(riderId: string): Promise<APIResponse<RiderKYC[]>> {
    try {
      // Add cache busting to prevent browser caching
      const cacheBuster = `_t=${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      console.log(
        `[riderService] Fetching KYC documents for rider ${riderId} with cache buster ${cacheBuster}`
      );

      // Note: Since baseURL is already ${RIDER_SERVICE_URL}/riders, we should not include an extra /riders/ in the path
      // Remove the leading slash to avoid path issues
      const response = await api.get(`${riderId}/kyc?${cacheBuster}`);

      console.log(`[riderService] KYC documents API response:`, {
        success: response.data?.success,
        count: Array.isArray(response.data?.data)
          ? response.data?.data?.length
          : "unknown",
        documentTypes: Array.isArray(response.data?.data)
          ? response.data?.data?.map((doc: RiderKYC) => doc.documentType)
          : [],
      });

      // Ensure we always have an array for data
      if (response.data?.success && !Array.isArray(response.data.data)) {
        console.warn(
          "[riderService] KYC documents response data is not an array, converting to array"
        );
        response.data.data = response.data.data ? [response.data.data] : [];
      }

      return response.data;
    } catch (error: any) {
      console.error(
        `[riderService] Error fetching KYC documents for rider ${riderId}:`,
        error
      );

      // Return structured error response instead of throwing
      return {
        success: false,
        data: [],
        message: error.message || "Failed to load KYC documents",
      };
    }
  }

  /**
   * Submit KYC document for rider
   */
  async submitKYC(
    riderId: string,
    kycData: RiderKYCSubmission,
    onProgressUpdate?: (progress: number) => void
  ): Promise<APIResponse<RiderKYC>> {
    try {
      console.log(
        `[riderService] Submitting KYC document for rider ${riderId}:`,
        {
          documentType: kycData.documentType,
          documentNumber: kycData.documentNumber,
          hasImage: !!kycData.documentImage,
          imageSize: kycData.documentImage?.size || 0,
          imageType: kycData.documentImage?.type || "unknown",
          imageName: kycData.documentImage?.name || "unknown",
        }
      );

      // If no file is provided, we can't proceed
      if (!kycData.documentImage) {
        throw new Error("No document image provided");
      }

      // Check if we should use the new chunked upload for large files
      const isLargeFile = kycData.documentImage.size > 2 * 1024 * 1024; // Over 2MB

      // For smaller files or if import fails, fall back to the standard upload method
      let response;

      if (isLargeFile) {
        try {
          // Dynamically import the chunked upload utility to avoid blocking initial load
          const { uploadFileInChunks } = await import("../utils/fileUploader");

          console.log(
            `[riderService] Using chunked upload for large file (${(
              kycData.documentImage.size /
              1024 /
              1024
            ).toFixed(1)}MB)`
          );

          // Prepare form fields
          const formFields = {
            documentType: kycData.documentType,
            documentNumber: kycData.documentNumber,
          };

          // Use chunked upload with progress reporting
          const result = await uploadFileInChunks<APIResponse<RiderKYC>>(
            api,
            `${riderId}/kyc`,
            formFields,
            {
              file: kycData.documentImage,
              onProgress: (progress) => {
                console.log(`[riderService] Upload progress: ${progress}%`);
                onProgressUpdate?.(progress);
              },
            }
          );

          return result;
        } catch (importError) {
          console.error(
            "[riderService] Failed to use chunked upload, falling back to standard upload:",
            importError
          );
          // Continue with standard upload if chunked upload fails
        }
      }

      // Standard upload method for smaller files or as fallback
      console.log(`[riderService] Using standard upload method`);

      // Create a properly formatted FormData object
      const formData = new FormData();
      formData.append("documentType", kycData.documentType);
      formData.append("documentNumber", kycData.documentNumber);
      formData.append("file", kycData.documentImage);

      // Configure request with progress tracking
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000, // 3 minutes - increased to allow for S3 upload retries
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`[riderService] Upload progress: ${percentCompleted}%`);
          onProgressUpdate?.(percentCompleted);
        },
      };

      // Remove the leading slash to avoid path issues with baseURL
      // The baseURL is already configured to include /api/riders
      response = await api.post(`${riderId}/kyc`, formData, config);

      console.log(`[riderService] KYC document submission successful:`, {
        success: response.data?.success,
        message: response.data?.message,
        data: response.data?.data,
      });

      return response.data;
    } catch (error: any) {
      console.error(`[riderService] Error submitting KYC document:`, error);
      if (error.response) {
        console.error(
          `Response status: ${error.response.status}`,
          error.response.data
        );
      }
      throw error;
    }
  }

  /**
   * Upload rider selfie
   */
  async uploadSelfie(
    riderId: string,
    selfieImage: File
  ): Promise<APIResponse<RiderKYC>> {
    try {
      const formData = new FormData();
      formData.append("documentType", "selfie");
      formData.append("documentNumber", "selfie-" + Date.now()); // Generate a unique ID for the selfie
      formData.append("documentImage", selfieImage);

      // Remove the leading slash to avoid path issues with baseURL
      const response = await api.post(`${riderId}/kyc`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading selfie:", error);
      throw error;
    }
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
    const response = await api.patch(`${riderId}/kyc/${kycId}/verify`, {
      status,
      notes,
    });
    return response.data;
  }

  /**
   * Get pending KYC submissions for admin review
   */
  async getPendingKYC(): Promise<APIResponse<RiderKYC[]>> {
    const response = await api.get(`admin/kyc/pending`);
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

    const response = await api.get(`${riderId}/orders?${queryParams}`);
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

    const response = await api.get(`${riderId}/earnings?${queryParams}`);
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
    const response = await api.get(`${riderId}/earnings/summary${queryParams}`);
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
    const response = await api.post(`${riderId}/assign-vehicle`, {
      vehicleId,
      hubId,
    });
    return response.data;
  }

  /**
   * Unassign vehicle from rider
   */
  async unassignVehicle(riderId: string): Promise<APIResponse<Rider>> {
    const response = await api.delete(`${riderId}/assign-vehicle`);
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
      // Get user name from localStorage - use only the name field
      let assignedBy = "admin";
      try {
        const userJson = localStorage.getItem("user");
        if (userJson) {
          const userData = JSON.parse(userJson);
          // Only use the name field, not email/username/id
          assignedBy = userData.name || "admin";
        }
      } catch (e) {
        console.warn("Failed to parse user from localStorage:", e);
      }

      // Path: /{riderId}/assign-vehicle
      // Combined with baseURL (/api/riders), this becomes: /api/riders/{riderId}/assign-vehicle
      const response = await api.post(`/${riderId}/assign-vehicle`, {
        ...assignmentData,
        assignedBy,
        updatedBy: assignedBy,
      });
      return response.data;
    } catch (error) {
      console.error("Error assigning vehicle to rider:", error);
      throw error;
    }
  }

  /**
   * Unassign vehicle from rider
   * @param riderId The rider ID
   * @param reason The reason for unassigning the vehicle
   */
  async unassignVehicleFromRider(
    riderId: string,
    reason?: string
  ): Promise<APIResponse<Rider>> {
    try {
      // Path: /{riderId}/assign-vehicle
      // Combined with baseURL (/api/riders), this becomes: /api/riders/{riderId}/assign-vehicle
      // Which the API Gateway routes to rider-service /api/v1/riders/{riderId}/assign-vehicle

      // Get user information from localStorage - use only the name field
      let user = "admin";
      try {
        const userJson = localStorage.getItem("user");
        if (userJson) {
          const userData = JSON.parse(userJson);
          // Only use the name field, not email/username/id
          user = userData.name || "admin";
        }
      } catch (e) {
        console.warn("Failed to parse user from localStorage:", e);
      }

      // Send reason and user info in request body if provided
      // Using multiple field names for backend compatibility
      const requestConfig = reason
        ? {
            data: {
              // Reason fields (different backends may expect different names)
              reason: reason,
              notes: reason,

              // User fields (different backends may expect different names)
              unassignedBy: user,
              returnedBy: user,
              updatedBy: user,

              // Additional metadata
              timestamp: new Date().toISOString(),
            },
          }
        : {};

      console.log(
        "[riderService] Unassigning vehicle with data:",
        requestConfig.data
      );

      const response = await api.delete(
        `/${riderId}/assign-vehicle`,
        requestConfig
      );
      return response.data;
    } catch (error) {
      console.error("Error unassigning vehicle from rider:", error);
      throw error;
    }
  }

  /**
   * Get available vehicles for assignment
   */
  async getAvailableVehicles(
    hubId?: string
  ): Promise<APIResponse<VehicleAssignment[]>> {
    try {
      // Use rider service endpoint which has proper vehicle transformation
      const params = new URLSearchParams();
      if (hubId) {
        params.append("hubId", hubId);
      }

      const url = `/vehicles/available${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      console.log("getAvailableVehicles - calling:", url);

      const response = await api.get(url);

      console.log("getAvailableVehicles - API response:", response.data);
      const vehicles = response.data.data || [];
      console.log("getAvailableVehicles - vehicles received:", vehicles);

      return {
        success: true,
        message: "Available vehicles fetched successfully",
        data: vehicles,
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
      // Use rider service endpoint which transforms hub data with city names
      const response = await api.get("/hubs");

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
    const response = await api.get(`${riderId}/performance?period=${period}`);
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

    const response = await api.get(`performance?${queryParams}`);
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
    const response = await api.get(`export/riders?${queryParams}`, {
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
      // Path: /{riderId}/assign-store
      // Combined with baseURL (/api/riders), this becomes: /api/riders/{riderId}/assign-store
      const response = await api.post(`/${riderId}/assign-store`, storeData);
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
      // Path: /{riderId}/assign-store
      // Combined with baseURL (/api/riders), this becomes: /api/riders/{riderId}/assign-store
      const response = await api.delete(`/${riderId}/assign-store`);
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
    // Using the correct endpoint path which is /stats
    // The baseURL is already set to ${RIDER_SERVICE_URL}/riders
    // We need to make sure we're not adding an extra "riders" segment in the path
    // We'll use "stats" directly
    const response = await api.get(`stats`);
    return response.data;
  }

  // ==========================================
  // BANK DETAILS MANAGEMENT
  // ==========================================

  /**
   * Add bank account details for a rider
   */
  async addBankDetails(
    riderId: string,
    bankData: {
      accountHolderName: string;
      accountNumber: string;
      accountType: "SAVINGS" | "CURRENT";
      ifscCode: string;
      bankName: string;
      branchName?: string;
      branchAddress?: string;
      isPrimary?: boolean;
      notes?: string;
    },
    proofDocument?: File,
    proofType?: "PASSBOOK" | "CANCELLED_CHEQUE" | "BANK_STATEMENT"
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const formData = new FormData();
      formData.append("riderId", riderId);
      formData.append("accountHolderName", bankData.accountHolderName);
      formData.append("accountNumber", bankData.accountNumber);
      formData.append("accountType", bankData.accountType);
      formData.append("ifscCode", bankData.ifscCode);
      formData.append("bankName", bankData.bankName);
      if (bankData.branchName)
        formData.append("branchName", bankData.branchName);
      if (bankData.branchAddress)
        formData.append("branchAddress", bankData.branchAddress);
      if (bankData.isPrimary !== undefined)
        formData.append("isPrimary", String(bankData.isPrimary));
      if (bankData.notes) formData.append("notes", bankData.notes);
      if (proofDocument && proofType) {
        formData.append("proofDocument", proofDocument);
        formData.append("proofType", proofType);
      }

      const response = await api.post(`/bank-details`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error adding bank details:", error);
      throw error;
    }
  }

  /**
   * Update bank account details
   */
  async updateBankDetails(
    bankDetailsId: string,
    updates: Partial<{
      accountHolderName: string;
      accountNumber: string;
      accountType: "SAVINGS" | "CURRENT";
      ifscCode: string;
      bankName: string;
      branchName: string;
      branchAddress: string;
      isPrimary: boolean;
      notes: string;
      verificationStatus: "pending" | "verified" | "rejected";
      verificationNotes: string;
    }>,
    proofDocument?: File,
    proofType?: "PASSBOOK" | "CANCELLED_CHEQUE" | "BANK_STATEMENT"
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const formData = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      if (proofDocument && proofType) {
        formData.append("proofDocument", proofDocument);
        formData.append("proofType", proofType);
      }

      const response = await api.put(
        `/bank-details/${bankDetailsId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating bank details:", error);
      throw error;
    }
  }

  /**
   * Get all bank accounts for a rider
   */
  async getRiderBankDetails(
    riderId: string
  ): Promise<APIResponse<RiderBankDetails[]>> {
    try {
      const response = await api.get(`/bank-details/rider/${riderId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching rider bank details:", error);
      throw error;
    }
  }

  /**
   * Get specific bank account by ID
   */
  async getBankDetailsById(
    bankDetailsId: string
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const response = await api.get(`/bank-details/${bankDetailsId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching bank details:", error);
      throw error;
    }
  }

  /**
   * Delete (deactivate) bank account details
   */
  async deleteBankDetails(bankDetailsId: string): Promise<APIResponse<void>> {
    try {
      const response = await api.delete(`/bank-details/${bankDetailsId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting bank details:", error);
      throw error;
    }
  }

  /**
   * Set a bank account as primary
   */
  async setPrimaryAccount(
    bankDetailsId: string
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const response = await api.patch(
        `/bank-details/${bankDetailsId}/set-primary`
      );
      return response.data;
    } catch (error) {
      console.error("Error setting primary account:", error);
      throw error;
    }
  }

  /**
   * Verify bank account details
   */
  async verifyBankDetails(
    bankDetailsId: string,
    verificationNotes?: string
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const response = await api.patch(
        `/bank-details/${bankDetailsId}/verify`,
        {
          verificationNotes,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying bank details:", error);
      throw error;
    }
  }

  /**
   * Reject bank account details
   */
  async rejectBankDetails(
    bankDetailsId: string,
    verificationNotes: string
  ): Promise<APIResponse<RiderBankDetails>> {
    try {
      const response = await api.patch(
        `/bank-details/${bankDetailsId}/reject`,
        {
          verificationNotes,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting bank details:", error);
      throw error;
    }
  }
}

export const riderService = new RiderService();
export default riderService;
