import axios from "axios";

const VEHICLE_SERVICE_URL =
  import.meta.env.VITE_VEHICLE_API_URL || "http://localhost:8000/api/vehicles";
const VEHICLE_ANALYTICS_URL =
  import.meta.env.VITE_VEHICLE_ANALYTICS_URL ||
  "http://localhost:4004/api/v1/analytics";

// Configure axios instance for general vehicle service
const vehicleApi = axios.create({
  baseURL: VEHICLE_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure axios instance for analytics
const analyticsApi = axios.create({
  baseURL: VEHICLE_ANALYTICS_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
vehicleApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  // Debug token existence
  if (!token) {
    console.warn(
      "No auth token found in localStorage when making vehicle API request"
    );
  } else {
    console.log("Auth token found and will be used for vehicle API request");
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Request interceptor for analytics API
analyticsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn(
      "No auth token found in localStorage when making analytics API request"
    );
  } else {
    console.log("Auth token found and will be used for analytics API request");
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
vehicleApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Get the full request URL for better debugging
    const requestUrl = error.config?.url || "unknown endpoint";
    console.error(`Vehicle API Error (${requestUrl}):`, error);

    // Track consecutive 401 errors to detect persistent auth issues
    const unauthorizedCounter = parseInt(
      sessionStorage.getItem("vehicle_api_401_count") || "0"
    );

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Check if token exists
      const token = localStorage.getItem("authToken");
      if (token) {
        console.warn(
          `Auth token exists but request to ${requestUrl} was unauthorized. Token may be invalid or expired.`
        );

        // Increment the 401 counter
        sessionStorage.setItem(
          "vehicle_api_401_count",
          (unauthorizedCounter + 1).toString()
        );

        // If we get many consecutive 401s, clear token and redirect (possible session expiration)
        if (unauthorizedCounter >= 5) {
          console.warn(
            "Multiple consecutive 401 errors detected. Session likely expired."
          );
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");

          // Show alert before redirecting
          alert("Your session has expired. You will be redirected to login.");
          window.location.href = "/login";
          return Promise.reject(new Error("Session expired"));
        }
      } else {
        console.warn(
          `Auth token missing for request to ${requestUrl}. User may not be logged in.`
        );
      }
    } else {
      // Reset counter for non-401 errors
      sessionStorage.setItem("vehicle_api_401_count", "0");
    }

    return Promise.reject(error);
  }
);

// Types
export interface City {
  id: string;
  name: string;
  displayName: string;
  code: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isOperational: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hub {
  id: string;
  name: string;
  hubName?: string; // Backend also provides this
  code: string;
  hubCode?: string; // Backend also provides this
  cityId: string;
  cityName?: string; // Direct city name from backend
  address: string;
  pinCode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  hubType: string;
  hubCategory: string;
  vehicleCapacity?: number;
  chargingPoints: number;
  serviceCapacity: number;
  operatingHours?: string;
  is24x7: boolean;
  managerName?: string;
  contactNumber?: string;
  status: string;
  hasChargingStation: boolean;
  hasServiceCenter: boolean;
  createdAt: Date;
  updatedAt: Date;
  city?: City; // Nested city object (when populated)
}

export interface OEM {
  id: string;
  name: string;
  displayName: string;
  code: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  isPreferred: boolean;
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  oemId: string;
  name: string;
  displayName: string;
  modelCode: string;
  category: string;
  segment: string;
  vehicleType: string;
  fuelType: string;
  engineCapacity?: string;
  batteryCapacity?: string;
  maxSpeed?: number;
  range?: number;
  chargingTime?: string;
  seatingCapacity: number;
  availableVariants?: string;
  availableColors?: string;
  basePrice?: number;
  serviceInterval?: number;
  warrantyPeriod?: number;
  isActive: boolean;
  isPopular: boolean;
  oem?: OEM;
}

export interface Vehicle {
  id: string;
  modelId: string;
  hubId: string;
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  variant?: string;
  color: string;
  year?: number;
  vehicleType?: string;
  batteryType?: string;
  batteryCapacity?: number;
  maxRange?: number;
  maxSpeed?: number;
  purchaseDate?: Date;
  registrationDate: Date;
  purchasePrice?: number;
  currentValue?: number;
  ageInMonths?: number;
  fleetOperatorId?: string;
  currentRiderId?: string;
  assignmentDate?: Date;
  operationalStatus:
    | "Available"
    | "Assigned"
    | "Under Maintenance"
    | "Retired"
    | "Damaged";
  serviceStatus: "Active" | "Inactive" | "Scheduled for Service";
  location?: string;
  mileage: number;
  model?: VehicleModel;
  hub?: Hub;
  rcDetails?: {
    rcNumber: string;
    validUpto?: Date;
  };
  insuranceDetails?: Array<{
    id: string;
    insuranceType: string;
    providerName: string;
    policyNumber: string;
    policyStartDate: Date;
    policyEndDate: Date;
    premiumAmount: number;
    coverageAmount: number;
    isActive: boolean;
    renewalReminder: boolean;
    policyPhotoUrl?: string;
    policyUploadDate?: Date;
    verificationStatus: string;
  }>;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  createdAt: Date;
  updatedAt: Date;
  mediaFiles?: MediaFile[];
  serviceHistory?: ServiceRecord[];
  damageRecords?: DamageRecord[];
}

export interface MediaFile {
  id: string;
  vehicleId: string;
  fileName: string;
  fileUrl: string;
  s3Key?: string;
  fileType: string; // MIME type
  fileSize: number;
  mediaType: string; // RC Document, Vehicle Photo, Insurance Document, etc.
  mediaCategory: string; // Document, Photo, Video
  description?: string;
  uploadedBy: string;
  uploadDate: Date;
  source: string; // mobile_app, web_admin, api
  isActive: boolean;
  tags?: string;
  url?: string; // Generated view URL
  viewUrl?: string; // API endpoint for viewing
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: "Preventive" | "Corrective" | "Emergency";
  serviceDate: Date;
  description: string;
  issueReported?: string;
  workPerformed?: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  serviceStatus: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  partsReplaced?: string;
  nextServiceDue?: Date;
  mileageAtService?: number;
  serviceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  mediaFiles?: MediaFile[];
}

export interface DamageRecord {
  id: string;
  vehicleId: string;
  damageType: "Cosmetic" | "Mechanical" | "Electrical" | "Structural";
  severity: "Minor" | "Moderate" | "Major";
  location: string;
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  reportedDate: Date;
  reportedBy: string;
  resolvedDate?: Date;
  resolutionNotes?: string;
  damageStatus:
    | "Reported"
    | "Under Review"
    | "Approved for Repair"
    | "In Repair"
    | "Resolved"
    | "Rejected";
  assignedTechnician?: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  mediaFiles?: MediaFile[];
}

export interface VehicleStats {
  totalVehicles: number;
  vehiclesByStatus: Record<string, number>;
  vehiclesByServiceStatus: Record<string, number>;
  topModels: Array<{
    modelId: string;
    count: number;
    modelName: string;
    oemName: string;
  }>;
  ageDistribution: {
    new: number;
    moderate: number;
    old: number;
    vintage: number;
  };
  mileageStats: {
    average: number;
    maximum: number;
    minimum: number;
  };
}

export interface VehicleFilters {
  oemType?: string;
  vehicleModel?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  location?: string;
  minMileage?: number;
  maxMileage?: number;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// API Functions
export const vehicleService = {
  // Vehicle CRUD operations
  async getVehicles(
    filters: VehicleFilters = {},
    pagination: PaginationParams = {}
  ) {
    try {
      // Double-check token before making request
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token available for getVehicles");
        return {
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: pagination.page || 1,
          },
          message: "Authentication required",
        };
      }

      const params = { ...filters, ...pagination };
      console.log("🔍 API Request Debug:", {
        filters,
        pagination,
        combinedParams: params,
        url: "/vehicles",
      });
      const response = await vehicleApi.get("/vehicles", { params });
      console.log("📡 API Response Debug:", {
        dataLength:
          response.data?.vehicles?.length || response.data?.data?.length || 0,
        totalFromPagination: response.data?.pagination?.totalItems,
        responseStructure: Object.keys(response.data || {}),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn(
          "Authentication required for vehicle list - returning empty list"
        );
        // Return empty but structured data instead of throwing
        return {
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: pagination.page || 1,
          },
          message: "Authentication required",
        };
      }
      // For other errors, log and rethrow
      console.error("Error in getVehicles:", error);
      throw error;
    }
  },

  async getVehicle(id: string) {
    const response = await vehicleApi.get(`/vehicles/${id}`);
    return response.data;
  },

  async createVehicle(vehicleData: Partial<Vehicle>) {
    const response = await vehicleApi.post("/vehicles", vehicleData);
    return response.data;
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>) {
    const response = await vehicleApi.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  async deleteVehicle(id: string) {
    const response = await vehicleApi.delete(`/vehicles/${id}`);
    return response.data;
  },

  async updateVehicleStatus(id: string, status: string, reason?: string) {
    const response = await vehicleApi.patch(`/vehicles/${id}/status`, {
      operationalStatus: status,
      reason,
    });
    return response.data;
  },

  // Service operations
  async getServiceRecords(
    filters: any = {},
    pagination: PaginationParams = {}
  ) {
    const params = { ...filters, ...pagination };
    const response = await vehicleApi.get("/service", { params });
    return response.data;
  },

  async getServiceRecord(id: string) {
    const response = await vehicleApi.get(`/service/${id}`);
    return response.data;
  },

  async createServiceRecord(serviceData: Partial<ServiceRecord>) {
    const response = await vehicleApi.post("/service", serviceData);
    return response.data;
  },

  async updateServiceRecord(id: string, serviceData: Partial<ServiceRecord>) {
    const response = await vehicleApi.put(`/service/${id}`, serviceData);
    return response.data;
  },

  async scheduleService(serviceData: any) {
    const response = await vehicleApi.post("/service/schedule", serviceData);
    return response.data;
  },

  async getUpcomingServices(days: number = 30) {
    const response = await vehicleApi.get(`/service/upcoming?days=${days}`);
    return response.data;
  },

  async getServiceAnalytics(period: string = "month") {
    const response = await analyticsApi.get(`/services?period=${period}`);
    return response.data;
  },

  // Damage operations
  async getDamageRecords(filters: any = {}, pagination: PaginationParams = {}) {
    const params = { ...filters, ...pagination };
    const response = await vehicleApi.get("/damage", { params });
    return response.data;
  },

  async getDamageRecord(id: string) {
    const response = await vehicleApi.get(`/damage/${id}`);
    return response.data;
  },

  async createDamageRecord(damageData: Partial<DamageRecord>) {
    const response = await vehicleApi.post("/damage", damageData);
    return response.data;
  },

  async updateDamageRecord(id: string, damageData: Partial<DamageRecord>) {
    const response = await vehicleApi.put(`/damage/${id}`, damageData);
    return response.data;
  },

  async updateDamageStatus(id: string, status: string, notes?: string) {
    const response = await vehicleApi.patch(`/damage/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Document operations
  async uploadVehicleDocument(
    vehicleId: string,
    file: File,
    documentType: string,
    description?: string
  ) {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    if (description) formData.append("description", description);

    const response = await vehicleApi.post(
      `/documents/vehicles/${vehicleId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Upload multiple documents for a vehicle
  async uploadMultipleDocuments(
    vehicleId: string,
    files: File[],
    documentMappings: Record<string, string>
  ) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    formData.append("documentMappings", JSON.stringify(documentMappings));

    const response = await vehicleApi.post(
      `/documents/vehicles/${vehicleId}/documents/batch`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Get vehicle documents
  async getVehicleDocuments(vehicleId: string, documentType?: string) {
    const params = documentType ? { documentType } : {};
    const response = await vehicleApi.get(
      `/documents/vehicles/${vehicleId}/documents`,
      { params }
    );
    return response.data;
  },

  // Delete vehicle document
  async deleteVehicleDocument(documentId: string) {
    const response = await vehicleApi.delete(
      `/documents/documents/${documentId}`
    );
    return response.data;
  },

  // Update document verification status
  async updateDocumentVerification(
    documentId: string,
    verificationStatus: string,
    notes?: string
  ) {
    const response = await vehicleApi.patch(
      `/documents/documents/${documentId}/verification`,
      {
        verificationStatus,
        notes,
      }
    );
    return response.data;
  },

  // Legacy uploadMedia method for backward compatibility
  async uploadMedia(
    vehicleId: string,
    files: FileList,
    fileType: string,
    tags?: string
  ) {
    const filesArray = Array.from(files);

    if (filesArray.length === 1) {
      // Single file upload
      return this.uploadVehicleDocument(
        vehicleId,
        filesArray[0],
        fileType,
        tags
      );
    } else {
      // Multiple files upload
      const documentMappings: Record<string, string> = {};
      filesArray.forEach((file) => {
        documentMappings[file.name] = fileType;
      });
      return this.uploadMultipleDocuments(
        vehicleId,
        filesArray,
        documentMappings
      );
    }
  },

  async getMediaFiles(vehicleId: string, fileType?: string) {
    const params = fileType ? { mediaType: fileType } : {}; // Changed from fileType to mediaType
    const response = await vehicleApi.get(`/media/vehicle/${vehicleId}`, {
      params,
    });
    return response.data;
  },

  async deleteMedia(id: string) {
    const response = await vehicleApi.delete(`/media/${id}`);
    return response.data;
  },

  // Delete document by ID (wrapper for deleteMedia)
  async deleteDocument(_vehicleId: string, documentId: string) {
    return this.deleteMedia(documentId);
  },

  // Get media file view URL (returns presigned URL for S3 files)
  getMediaViewUrl(mediaId: string, redirect: boolean = true) {
    const baseUrl =
      vehicleApi.defaults.baseURL || "http://localhost:4004/api/vehicles";
    return `${baseUrl}/media/view/${mediaId}${
      redirect ? "" : "?redirect=false"
    }`;
  },

  // Analytics and stats
  async getVehicleStats() {
    try {
      // Double-check token before making request
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token available for getVehicleStats");
        return {
          success: true,
          data: {
            totalVehicles: 0,
            availableVehicles: 0,
            assignedVehicles: 0,
            underMaintenance: 0,
            retired: 0,
            activeVehicles: 0,
            inactiveVehicles: 0,
            vehiclesByStatus: {
              Available: 0,
              Assigned: 0,
              "Under Maintenance": 0,
              Retired: 0,
            },
            vehiclesByServiceStatus: {
              Active: 0,
              Inactive: 0,
              "Scheduled for Service": 0,
            },
          },
          message: "Authentication required",
        };
      }

      const response = await vehicleApi.get("/analytics");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn(
          "Authentication required for vehicle statistics - returning empty stats"
        );
        // Return empty but structured data instead of throwing
        return {
          success: true,
          data: {
            totalVehicles: 0,
            availableVehicles: 0,
            assignedVehicles: 0,
            underMaintenance: 0,
            retired: 0,
            activeVehicles: 0,
            inactiveVehicles: 0,
            vehiclesByStatus: {
              Available: 0,
              Assigned: 0,
              "Under Maintenance": 0,
              Retired: 0,
            },
            vehiclesByServiceStatus: {
              Active: 0,
              Inactive: 0,
              "Scheduled for Service": 0,
            },
          },
          message: "Authentication required",
        };
      }
      // For other errors, still return a safe default
      console.error("Error in getVehicleStats:", error);
      return {
        success: false,
        data: {
          totalVehicles: 0,
          availableVehicles: 0,
          assignedVehicles: 0,
          underMaintenance: 0,
          retired: 0,
          activeVehicles: 0,
          inactiveVehicles: 0,
          vehiclesByStatus: {
            Available: 0,
            Assigned: 0,
            "Under Maintenance": 0,
            Retired: 0,
          },
          vehiclesByServiceStatus: {
            Active: 0,
            Inactive: 0,
            "Scheduled for Service": 0,
          },
        },
        message: error.message || "Error fetching statistics",
      };
    }
  },

  async getIndividualVehicleStats(vehicleId: string) {
    const response = await vehicleApi.get(`/${vehicleId}/stats`);
    return response.data;
  },

  async getVehicleAnalytics(period: string = "month", hubId?: string) {
    const params: any = { period };
    if (hubId) params.hubId = hubId;
    const response = await analyticsApi.get("/vehicles", { params });
    return response.data;
  },

  async getDamageAnalytics(period: string = "month") {
    const response = await analyticsApi.get(`/damages?period=${period}`);
    return response.data;
  },

  async getFleetPerformance(period: string = "month") {
    const response = await analyticsApi.get(
      `/fleet-performance?period=${period}`
    );
    return response.data;
  },

  // OEM operations
  async getOEMs(filters: { active?: boolean; preferred?: boolean } = {}) {
    try {
      // Double-check token before making request
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token available for getOEMs");
        return { data: [], message: "Authentication required" };
      }

      const response = await vehicleApi.get("/oems", { params: filters });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn("Authentication required for OEMs data");
        // Return empty data structure to prevent UI errors
        return { data: [], message: "Authentication required" };
      }
      // For other errors, still return a safe default
      console.error("Error in getOEMs:", error);
      return { data: [], message: error.message || "Error fetching OEMs" };
    }
  },

  async getOEM(id: string) {
    const response = await vehicleApi.get(`/oems/${id}`);
    return response.data;
  },

  async createOEM(oemData: Partial<OEM>) {
    const response = await vehicleApi.post("/oems", oemData);
    return response.data;
  },

  async updateOEM(id: string, oemData: Partial<OEM>) {
    const response = await vehicleApi.put(`/oems/${id}`, oemData);
    return response.data;
  },

  async deleteOEM(id: string, hard: boolean = false) {
    const response = await vehicleApi.delete(`/oems/${id}`, {
      params: { hard },
    });
    return response.data;
  },

  async getOEMStats() {
    const response = await vehicleApi.get("/oems/stats");
    return response.data;
  },

  // Vehicle Model operations
  async getVehicleModels(
    filters: {
      oemId?: string;
      active?: boolean;
      popular?: boolean;
      category?: string;
      segment?: string;
    } = {}
  ) {
    const response = await vehicleApi.get("/vehicle-models", {
      params: filters,
    });
    return response.data;
  },

  async getVehicleModelsByOEM(
    oemId: string,
    filters: { active?: boolean; popular?: boolean } = {}
  ) {
    const response = await vehicleApi.get(`/vehicle-models/oem/${oemId}`, {
      params: filters,
    });
    return response.data;
  },

  async getVehicleModel(id: string) {
    const response = await vehicleApi.get(`/vehicle-models/${id}`);
    return response.data;
  },

  async getVehicleModelSpecs(id: string) {
    const response = await vehicleApi.get(`/vehicle-models/${id}/specs`);
    return response.data;
  },

  async createVehicleModel(modelData: Partial<VehicleModel>) {
    const response = await vehicleApi.post("/vehicle-models", modelData);
    return response.data;
  },

  async updateVehicleModel(id: string, modelData: Partial<VehicleModel>) {
    const response = await vehicleApi.put(`/vehicle-models/${id}`, modelData);
    return response.data;
  },

  async deleteVehicleModel(id: string, hard: boolean = false) {
    const response = await vehicleApi.delete(`/vehicle-models/${id}`, {
      params: { hard },
    });
    return response.data;
  },

  async getModelMetadata() {
    const response = await vehicleApi.get("/vehicle-models/metadata");
    return response.data;
  },

  // Additional Analytics methods
  async getMileageAnalytics(period: string = "month") {
    // Mileage data is included in getVehicleAnalytics
    const response = await analyticsApi.get(`/vehicles?period=${period}`);
    return response.data;
  },

  async getMaintenanceAnalytics(period: string = "month") {
    // Service analytics covers maintenance data
    const response = await analyticsApi.get(`/services?period=${period}`);
    return response.data;
  },

  async getUtilizationAnalytics(period: string = "month") {
    // Utilization data is included in getVehicleAnalytics
    const response = await analyticsApi.get(`/vehicles?period=${period}`);
    return response.data;
  },

  async getEfficiencyAnalytics(period: string = "month") {
    // Fleet performance covers efficiency
    const response = await analyticsApi.get(
      `/fleet-performance?period=${period}`
    );
    return response.data;
  },

  async getCostAnalytics(period: string = "month") {
    // Cost data is included in damage analytics
    const response = await analyticsApi.get(`/damages?period=${period}`);
    return response.data;
  },

  async getAssignmentAnalytics(period: string = "month") {
    // Assignment data is included in getVehicleAnalytics
    const response = await analyticsApi.get(`/vehicles?period=${period}`);
    return response.data;
  },

  // Hub operations
  async getHubs(
    filters: {
      cityId?: string;
      status?: string;
      hasServiceCenter?: boolean;
      isActive?: boolean;
    } = {}
  ) {
    try {
      const response = await vehicleApi.get("/hubs", { params: filters });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching hubs:", error);
      return { data: [], message: error.message || "Error fetching hubs" };
    }
  },

  async getOperationalHubs() {
    try {
      const response = await vehicleApi.get("/hubs/operational");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching operational hubs:", error);
      return {
        data: [],
        message: error.message || "Error fetching operational hubs",
      };
    }
  },

  async getHubById(id: string) {
    try {
      const response = await vehicleApi.get(`/hubs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching hub:", error);
      throw error;
    }
  },

  async getHubsByCity(cityId: string) {
    try {
      const response = await vehicleApi.get(`/hubs/city/${cityId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching hubs by city:", error);
      return {
        data: [],
        message: error.message || "Error fetching hubs by city",
      };
    }
  },

  // City operations
  async getCities(
    filters: {
      isActive?: boolean;
      isOperational?: boolean;
    } = {}
  ) {
    try {
      const response = await vehicleApi.get("/cities", { params: filters });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching cities:", error);
      return { data: [], message: error.message || "Error fetching cities" };
    }
  },

  async getCityById(id: string) {
    try {
      const response = await vehicleApi.get(`/cities/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching city:", error);
      throw error;
    }
  },

  async createCity(cityData: any) {
    try {
      const response = await vehicleApi.post("/cities", cityData);
      return response.data;
    } catch (error: any) {
      console.error("Error creating city:", error);
      throw error;
    }
  },

  async updateCity(id: string, cityData: any) {
    try {
      const response = await vehicleApi.put(`/cities/${id}`, cityData);
      return response.data;
    } catch (error: any) {
      console.error("Error updating city:", error);
      throw error;
    }
  },

  async deleteCity(id: string) {
    try {
      const response = await vehicleApi.delete(`/cities/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting city:", error);
      throw error;
    }
  },

  async getOperationalCities() {
    try {
      const response = await vehicleApi.get("/cities/operational");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching operational cities:", error);
      return {
        data: [],
        message: error.message || "Error fetching operational cities",
      };
    }
  },

  async getCitiesWithCounts() {
    try {
      const response = await vehicleApi.get("/cities/with-counts");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching cities with counts:", error);
      return {
        data: [],
        message: error.message || "Error fetching cities with counts",
      };
    }
  },

  // Service History operations
  async getVehicleServiceHistory(vehicleId: string) {
    try {
      const response = await vehicleApi.get(
        `/services/vehicles/${vehicleId}/history`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching vehicle service history:", error);
      return {
        data: { serviceHistory: [] },
        message: error.message || "Error fetching service history",
      };
    }
  },

  async getRiderById(riderId: string) {
    try {
      // This would need to call the rider service through API gateway
      const response = await axios.get(
        `http://localhost:8000/api/v1/riders/${riderId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching rider:", error);
      return {
        data: null,
        message: error.message || "Error fetching rider",
      };
    }
  },
};

export default vehicleService;
