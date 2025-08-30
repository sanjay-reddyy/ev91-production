import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Configure axios instance for outward flow
const outwardFlowApi = axios.create({
  baseURL: `${API_BASE_URL}/spare-parts/outward`,
  timeout: 30000,
});

// Add auth interceptor
outwardFlowApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
outwardFlowApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Types for Outward Flow
export interface ServiceRequest {
  id: string;
  requestNumber: string;
  vehicleId: string;
  vehicleNumber?: string;
  riderId?: string;
  riderName?: string;
  hubId?: string;
  hubName?: string;
  requestType: "MAINTENANCE" | "REPAIR" | "INSPECTION" | "EMERGENCY";
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedCost?: number;
  actualCost?: number;
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  partRequests?: SparePartRequest[];
  installedParts?: InstalledPart[];
  costBreakdowns?: ServiceCostBreakdown[];
  createdAt: string;
  updatedAt: string;
}

export interface SparePartRequest {
  id: string;
  serviceRequestId: string;
  sparePartId: string;
  sparePart?: {
    id: string;
    name: string;
    displayName: string;
    partNumber: string;
    category?: {
      name: string;
      displayName: string;
    };
  };
  quantity: number;
  estimatedCost: number;
  actualCost?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status:
    | "PENDING"
    | "APPROVED"
    | "ISSUED"
    | "INSTALLED"
    | "REJECTED"
    | "CANCELLED";
  justification?: string;
  approvalLevel: number;
  currentApprovalLevel: number;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedByName?: string;
  issuedAt?: string;
  notes?: string;
  serviceRequest?: ServiceRequest;
  approvalHistory?: ApprovalHistory[];
  stockReservation?: StockReservation;
  installedPart?: InstalledPart;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  requestId: string;
  level: number;
  approverId: string;
  approverName?: string;
  approverRole?: string;
  decision: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";
  comments?: string;
  conditions?: string;
  assignedAt: string;
  processedAt?: string;
  escalatedAt?: string;
  requestValue?: number;
  isActive: boolean;
}

export interface StockReservation {
  id: string;
  sparePartRequestId: string;
  sparePartId: string;
  storeId: string;
  storeName?: string;
  quantity: number;
  reservedBy: string;
  reservedByName?: string;
  reservedAt: string;
  expiresAt?: string;
  isActive: boolean;
  notes?: string;
}

export interface InstalledPart {
  id: string;
  sparePartRequestId: string;
  serviceRequestId: string;
  sparePartId: string;
  sparePart?: {
    name: string;
    displayName: string;
    partNumber: string;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  serviceCost?: number;
  laborCost?: number;
  installedBy: string;
  installedByName?: string;
  installedAt: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  notes?: string;
  isWarrantyActive: boolean;
  mileageAtInstallation?: number;
  nextServiceMileage?: number;
}

export interface ServiceCostBreakdown {
  id: string;
  serviceRequestId: string;
  costType: "PARTS" | "LABOR" | "OVERHEAD" | "MARKUP" | "TAX" | "DISCOUNT";
  description: string;
  amount: number;
  percentage?: number;
  isPercentageBased: boolean;
  calculatedFrom?: string;
  notes?: string;
}

export interface OutwardFlowAnalytics {
  summary: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    issuedRequests: number;
    installedParts: number;
    totalPartsValue: number;
    avgApprovalTime: number;
  };
  trends: {
    requestTrend: "increasing" | "decreasing" | "stable";
    approvalRate: number;
    installationRate: number;
  };
  departmentBreakdown?: Array<{
    department: string;
    requestCount: number;
    totalValue: number;
    avgApprovalTime: number;
  }>;
  categoryBreakdown?: Array<{
    category: string;
    requestCount: number;
    totalValue: number;
    usageRate: number;
  }>;
}

export interface TechnicianLimit {
  id: string;
  technicianId: string;
  technicianName?: string;
  limitType: "PART" | "CATEGORY" | "TOTAL";
  targetId?: string;
  targetName?: string;
  maxQuantityPerRequest?: number;
  maxValuePerRequest?: number;
  maxQuantityPerDay?: number;
  maxValuePerDay?: number;
  maxQuantityPerMonth?: number;
  maxValuePerMonth?: number;
  requiresApproval: boolean;
  autoApproveBelow?: number;
  isActive: boolean;
}

// API Services
export const outwardFlowService = {
  // Service Request Management
  serviceRequests: {
    // Get all service requests
    getAll: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      requestType?: string;
      priority?: string;
      vehicleId?: string;
      hubId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }) => {
      const response = await outwardFlowApi.get("/requests", { params });
      return response.data;
    },

    // Get service request by ID
    getById: async (id: string) => {
      const response = await outwardFlowApi.get(`/requests/${id}`);
      return response.data;
    },

    // Create service request
    create: async (data: {
      vehicleId: string;
      vehicleNumber?: string;
      riderId?: string;
      riderName?: string;
      hubId?: string;
      hubName?: string;
      requestType: "MAINTENANCE" | "REPAIR" | "INSPECTION" | "EMERGENCY";
      description: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      estimatedCost?: number;
      notes?: string;
      partRequests?: Array<{
        sparePartId: string;
        quantity: number;
        estimatedCost: number;
        priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        justification?: string;
      }>;
    }) => {
      const response = await outwardFlowApi.post("/request", data);
      return response.data;
    },

    // Update service request
    update: async (id: string, data: Partial<ServiceRequest>) => {
      const response = await outwardFlowApi.put(`/requests/${id}`, data);
      return response.data;
    },

    // Delete service request
    delete: async (id: string) => {
      const response = await outwardFlowApi.delete(`/requests/${id}`);
      return response.data;
    },

    // Approve service request
    approve: async (
      id: string,
      data: {
        comments?: string;
        conditions?: string;
        estimatedCost?: number;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/requests/${id}/approve`,
        data
      );
      return response.data;
    },

    // Reject service request
    reject: async (
      id: string,
      data: {
        comments: string;
        reason: string;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/requests/${id}/reject`,
        data
      );
      return response.data;
    },

    // Complete service request
    complete: async (
      id: string,
      data: {
        actualCost?: number;
        completionNotes?: string;
        mileageAtCompletion?: number;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/requests/${id}/complete`,
        data
      );
      return response.data;
    },
  },

  // Spare Part Request Management
  partRequests: {
    // Get all spare part requests
    getAll: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      sparePartId?: string;
      serviceRequestId?: string;
      requestedBy?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await outwardFlowApi.get("/part-requests", { params });
      return response.data;
    },

    // Get spare part request by ID
    getById: async (id: string) => {
      const response = await outwardFlowApi.get(`/part-requests/${id}`);
      return response.data;
    },

    // Create spare part request
    create: async (data: {
      serviceRequestId: string;
      sparePartId: string;
      quantity: number;
      estimatedCost: number;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      justification?: string;
      notes?: string;
    }) => {
      const response = await outwardFlowApi.post("/part-request", data);
      return response.data;
    },

    // Update spare part request
    update: async (id: string, data: Partial<SparePartRequest>) => {
      const response = await outwardFlowApi.put(`/part-requests/${id}`, data);
      return response.data;
    },

    // Approve spare part request
    approve: async (
      id: string,
      data: {
        comments?: string;
        conditions?: string;
        approverLevel?: number;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/part-requests/${id}/approve`,
        data
      );
      return response.data;
    },

    // Reject spare part request
    reject: async (
      id: string,
      data: {
        comments: string;
        reason: string;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/part-requests/${id}/reject`,
        data
      );
      return response.data;
    },

    // Issue spare part
    issue: async (
      id: string,
      data: {
        storeId: string;
        storeName?: string;
        actualCost?: number;
        notes?: string;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/part-requests/${id}/issue`,
        data
      );
      return response.data;
    },

    // Install spare part
    install: async (
      id: string,
      data: {
        unitCost: number;
        serviceCost?: number;
        laborCost?: number;
        warrantyMonths?: number;
        notes?: string;
        mileageAtInstallation?: number;
        nextServiceMileage?: number;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/part-requests/${id}/install`,
        data
      );
      return response.data;
    },
  },

  // Approval Management
  approvals: {
    // Get approval history for a request
    getHistory: async (requestId: string) => {
      const response = await outwardFlowApi.get(
        `/approval-history/${requestId}`
      );
      return response.data;
    },

    // Get pending approvals for current user
    getPending: async (params?: {
      page?: number;
      limit?: number;
      level?: number;
      requestType?: string;
      priority?: string;
    }) => {
      const response = await outwardFlowApi.get("/pending-approvals", {
        params,
      });
      return response.data;
    },

    // Process approval
    process: async (
      historyId: string,
      data: {
        decision: "APPROVED" | "REJECTED" | "ESCALATED";
        comments?: string;
        conditions?: string;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/approval-history/${historyId}/process`,
        data
      );
      return response.data;
    },
  },

  // Stock Reservation Management
  reservations: {
    // Get all reservations
    getAll: async (params?: {
      page?: number;
      limit?: number;
      sparePartId?: string;
      storeId?: string;
      isActive?: boolean;
    }) => {
      const response = await outwardFlowApi.get("/reservations", { params });
      return response.data;
    },

    // Reserve stock
    reserve: async (data: {
      sparePartRequestId: string;
      sparePartId: string;
      storeId: string;
      storeName?: string;
      quantity: number;
      expirationHours?: number;
      notes?: string;
    }) => {
      const response = await outwardFlowApi.post("/reserve", data);
      return response.data;
    },

    // Release reservation
    release: async (
      id: string,
      data?: {
        reason?: string;
        notes?: string;
      }
    ) => {
      const response = await outwardFlowApi.post(
        `/reservations/${id}/release`,
        data
      );
      return response.data;
    },
  },

  // Installation Management
  installations: {
    // Get all installed parts
    getAll: async (params?: {
      page?: number;
      limit?: number;
      serviceRequestId?: string;
      sparePartId?: string;
      vehicleId?: string;
      installedBy?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await outwardFlowApi.get("/installations", { params });
      return response.data;
    },

    // Get installation by ID
    getById: async (id: string) => {
      const response = await outwardFlowApi.get(`/installations/${id}`);
      return response.data;
    },

    // Update installation
    update: async (
      id: string,
      data: {
        notes?: string;
        warrantyStartDate?: string;
        warrantyEndDate?: string;
        nextServiceMileage?: number;
      }
    ) => {
      const response = await outwardFlowApi.put(`/installations/${id}`, data);
      return response.data;
    },
  },

  // Cost Management
  costs: {
    // Get cost breakdown for service request
    getBreakdown: async (serviceRequestId: string) => {
      const response = await outwardFlowApi.get(
        `/cost-breakdown/${serviceRequestId}`
      );
      return response.data;
    },

    // Update cost breakdown
    updateBreakdown: async (
      serviceRequestId: string,
      data: {
        costItems: Array<{
          costType:
            | "PARTS"
            | "LABOR"
            | "OVERHEAD"
            | "MARKUP"
            | "TAX"
            | "DISCOUNT";
          description: string;
          amount?: number;
          percentage?: number;
          isPercentageBased: boolean;
          calculatedFrom?: string;
          notes?: string;
        }>;
      }
    ) => {
      const response = await outwardFlowApi.put(
        `/cost-breakdown/${serviceRequestId}`,
        data
      );
      return response.data;
    },
  },

  // Technician Limits Management
  technicianLimits: {
    // Get all technician limits
    getAll: async (params?: {
      page?: number;
      limit?: number;
      technicianId?: string;
      limitType?: string;
      isActive?: boolean;
    }) => {
      const response = await outwardFlowApi.get("/technician-limits", {
        params,
      });
      return response.data;
    },

    // Create technician limit
    create: async (
      data: Omit<TechnicianLimit, "id" | "createdAt" | "updatedAt">
    ) => {
      const response = await outwardFlowApi.post("/technician-limit", data);
      return response.data;
    },

    // Update technician limit
    update: async (id: string, data: Partial<TechnicianLimit>) => {
      const response = await outwardFlowApi.put(
        `/technician-limits/${id}`,
        data
      );
      return response.data;
    },

    // Delete technician limit
    delete: async (id: string) => {
      const response = await outwardFlowApi.delete(`/technician-limits/${id}`);
      return response.data;
    },

    // Check technician limits
    check: async (data: {
      technicianId: string;
      sparePartId?: string;
      categoryId?: string;
      quantity: number;
      estimatedCost: number;
    }) => {
      const response = await outwardFlowApi.post("/check-limits", data);
      return response.data;
    },
  },

  // Analytics
  analytics: {
    // Get outward flow analytics
    getAll: async (params?: {
      startDate?: string;
      endDate?: string;
      departmentId?: string;
      hubId?: string;
      groupBy?: "day" | "week" | "month";
    }) => {
      const response = await outwardFlowApi.get("/analytics", { params });
      return response.data;
    },

    // Get department analytics
    getDepartmentAnalytics: async (
      departmentId: string,
      params?: {
        startDate?: string;
        endDate?: string;
      }
    ) => {
      const response = await outwardFlowApi.get(
        `/analytics/department/${departmentId}`,
        { params }
      );
      return response.data;
    },

    // Get vehicle analytics
    getVehicleAnalytics: async (
      vehicleId: string,
      params?: {
        startDate?: string;
        endDate?: string;
      }
    ) => {
      const response = await outwardFlowApi.get(
        `/analytics/vehicle/${vehicleId}`,
        { params }
      );
      return response.data;
    },

    // Get part usage analytics
    getPartUsageAnalytics: async (
      sparePartId: string,
      params?: {
        startDate?: string;
        endDate?: string;
      }
    ) => {
      const response = await outwardFlowApi.get(
        `/analytics/part-usage/${sparePartId}`,
        { params }
      );
      return response.data;
    },
  },
};

export default outwardFlowService;
