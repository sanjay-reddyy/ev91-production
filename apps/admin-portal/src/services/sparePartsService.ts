import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Configure axios instance
const sparePartsApi = axios.create({
  baseURL: `${API_BASE_URL}`,
  timeout: 30000,
});

// Add auth interceptor
sparePartsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // Changed from 'auth_token' to 'authToken'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
sparePartsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken"); // Changed from 'auth_token' to 'authToken'
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Types
export interface SparePart {
  id: string;
  name: string;
  displayName: string;
  partNumber: string;
  oemPartNumber?: string;
  internalCode: string;
  description?: string;
  categoryId: string;
  supplierId: string;
  compatibility: string; // JSON array of model IDs
  specifications?: string; // JSON object with technical specs
  dimensions?: string; // L x W x H
  weight?: number; // in kg
  material?: string;
  color?: string;
  warranty?: number; // months
  costPrice: number; // Purchase cost from supplier
  sellingPrice: number; // Selling price to service centers
  mrp: number; // Maximum retail price
  markupPercent: number; // Markup percentage
  unitOfMeasure: string; // PCS, KG, LITER, METER
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  qualityGrade: string; // A, B, C
  isOemApproved: boolean;
  certifications?: string; // JSON array of certifications
  imageUrls?: string; // JSON array of image URLs
  documentUrls?: string; // JSON array of document URLs
  isActive: boolean;
  isDiscontinued: boolean;
  isHazardous: boolean;
  category?: any;
  supplier?: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    inventoryLevels: number;
    purchaseOrderItems: number;
  };
}

export interface InventoryLevel {
  id: string;
  sparePartId: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  reservedStock?: number;
  availableStock?: number;
  damagedStock?: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  rackNumber?: string;
  shelfNumber?: string;
  binLocation?: string;
  lastCountDate?: string;
  lastMovementDate?: string;
  isActive: boolean;
  sparePart?: SparePart;
  stockStatus?: string;
  urgencyLevel?: string;
  valueAtCost?: number;
  valueAtSelling?: number;
  reorderRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  displayName: string;
  code: string;
  supplierType: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  rating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchaseOrders: number;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "ORDERED"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CANCELLED";
  totalAmount: number;
  currency: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  sparePartId: string;
  sparePart?: SparePart;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  sparePartId: string;
  sparePart?: SparePart;
  storeId: string;
  store?: {
    id: string;
    name: string;
  };
  movementType: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalParts: number;
  totalValue: number;
  lowStockAlerts: number;
  pendingOrders: number;
  monthlyUsage: number;
  supplierCount: number;
  topCategories: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  recentMovements: StockMovement[];
  lowStockItems: Array<{
    sparePart: SparePart;
    currentQuantity: number;
    minThreshold: number;
    store: string;
  }>;
}

export interface AnalyticsData {
  costAnalysis: {
    totalSpent: number;
    avgOrderValue: number;
    costTrends: Array<{
      month: string;
      amount: number;
    }>;
  };
  inventoryAnalysis: {
    turnoverRate: number;
    stockAccuracy: number;
    trends: Array<{
      month: string;
      inflow: number;
      outflow: number;
    }>;
  };
  supplierAnalysis: Array<{
    supplier: string;
    orders: number;
    totalValue: number;
    avgDeliveryTime: number;
    rating: number;
  }>;
  usageAnalysis: Array<{
    partName: string;
    category: string;
    usageCount: number;
    totalValue: number;
    trend: "up" | "down" | "stable";
  }>;
}

// API functions

// Spare Parts
export const sparePartsService = {
  // Get all spare parts with pagination and filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    vehicleModelId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const response = await sparePartsApi.get("/spare-parts", { params });
    return response.data;
  },

  // Get spare part by ID
  getById: async (id: string) => {
    const response = await sparePartsApi.get(`/spare-parts/${id}`);
    return response.data;
  },

  // Create new spare part
  create: async (data: Omit<SparePart, "id" | "createdAt" | "updatedAt">) => {
    const response = await sparePartsApi.post("/spare-parts", data);
    return response.data;
  },

  // Update spare part
  update: async (id: string, data: Partial<SparePart>) => {
    const response = await sparePartsApi.put(`/spare-parts/${id}`, data);
    return response.data;
  },

  // Delete spare part
  delete: async (id: string) => {
    const response = await sparePartsApi.delete(`/spare-parts/${id}`);
    return response.data;
  },

  // Get spare parts by vehicle model
  getByVehicleModel: async (modelId: string) => {
    const response = await sparePartsApi.get(
      `/spare-parts/vehicle-model/${modelId}`
    );
    return response.data;
  },

  // Bulk update spare parts
  bulkUpdate: async (
    updates: Array<{ id: string; data: Partial<SparePart> }>
  ) => {
    const response = await sparePartsApi.post("/spare-parts/bulk-update", {
      updates,
    });
    return response.data;
  },
};

// Inventory Management
export const inventoryService = {
  // Get all inventory levels
  getAll: async (params?: {
    page?: number;
    limit?: number;
    storeId?: string;
    lowStock?: boolean;
    search?: string;
  }) => {
    const response = await sparePartsApi.get(
      "/spare-parts/inventory/stock-levels",
      { params }
    );
    return response.data;
  },

  // Get inventory by store and part
  getByStoreAndPart: async (storeId: string, sparePartId: string) => {
    const response = await sparePartsApi.get(
      `/spare-parts/inventory/stock-levels/${storeId}/${sparePartId}`
    );
    return response.data;
  },

  // Get all inventory levels for a specific spare part
  getBySparePartId: async (sparePartId: string) => {
    const response = await sparePartsApi.get(
      `/spare-parts/inventory/stock-levels/part/${sparePartId}`
    );
    return response.data;
  },

  // Update stock level
  updateStock: async (
    storeId: string,
    sparePartId: string,
    data: {
      quantity?: number;
      minThreshold?: number;
      maxThreshold?: number;
      reorderPoint?: number;
      location?: string;
    }
  ) => {
    const response = await sparePartsApi.put(
      `/spare-parts/inventory/stock-levels/${storeId}/${sparePartId}`,
      data
    );
    return response.data;
  },

  // Get stock movements
  getMovements: async (params?: {
    page?: number;
    limit?: number;
    storeId?: string;
    sparePartId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await sparePartsApi.get(
      "/spare-parts/inventory/stock-movements",
      { params }
    );
    return response.data;
  },

  // Create stock movement
  createMovement: async (data: {
    sparePartId: string;
    storeId: string;
    movementType:
      | "IN"
      | "OUT"
      | "TRANSFER"
      | "ADJUSTMENT"
      | "DAMAGED"
      | "RETURN";
    quantity: number;
    unitCost?: number;
    reason?: string;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
  }) => {
    const response = await sparePartsApi.post(
      "/spare-parts/inventory/stock-movement",
      data
    );
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await sparePartsApi.get(
      "/spare-parts/inventory/low-stock-alerts"
    );
    return response.data;
  },

  // Initialize stock for a spare part at a location
  initializeStock: async (data: {
    sparePartId: string;
    storeId: string;
    storeName: string;
    initialStock?: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
  }) => {
    const response = await sparePartsApi.post(
      "/spare-parts/inventory/initialize-stock",
      data
    );
    return response.data;
  },
};

// Suppliers
export const suppliersService = {
  // Get all suppliers
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    isActive?: boolean;
  }) => {
    const response = await sparePartsApi.get("/spare-parts/suppliers", {
      params,
    });
    return response.data;
  },

  // Get supplier by ID
  getById: async (id: string) => {
    const response = await sparePartsApi.get(`/spare-parts/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  create: async (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
    const response = await sparePartsApi.post("/spare-parts/suppliers", data);
    return response.data;
  },

  // Update supplier
  update: async (id: string, data: Partial<Supplier>) => {
    const response = await sparePartsApi.put(
      `/spare-parts/suppliers/${id}`,
      data
    );
    return response.data;
  },

  // Delete supplier
  delete: async (id: string) => {
    const response = await sparePartsApi.delete(`/spare-parts/suppliers/${id}`);
    return response.data;
  },

  // Get supplier performance
  getPerformance: async (id: string) => {
    const response = await sparePartsApi.get(
      `/spare-parts/suppliers/${id}/performance`
    );
    return response.data;
  },
};

// Purchase Orders
export const purchaseOrdersService = {
  // Get all purchase orders
  getAll: async (params?: {
    page?: number;
    limit?: number;
    supplierId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await sparePartsApi.get("/spare-parts/purchase-orders", {
      params,
    });
    return response.data;
  },

  // Get purchase order by ID
  getById: async (id: string) => {
    const response = await sparePartsApi.get(
      `/spare-parts/purchase-orders/${id}`
    );
    return response.data;
  },

  // Create purchase order
  create: async (data: {
    supplierId: string;
    storeId: string;
    storeName: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: Array<{
      sparePartId: string;
      orderedQuantity: number;
      unitCost: number;
    }>;
  }) => {
    const response = await sparePartsApi.post(
      "/spare-parts/purchase-orders",
      data
    );
    return response.data;
  },

  // Update purchase order
  update: async (id: string, data: Partial<PurchaseOrder>) => {
    const response = await sparePartsApi.put(
      `/spare-parts/purchase-orders/${id}`,
      data
    );
    return response.data;
  },

  // Delete purchase order
  delete: async (id: string) => {
    const response = await sparePartsApi.delete(
      `/spare-parts/purchase-orders/${id}`
    );
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: PurchaseOrder["status"]) => {
    const response = await sparePartsApi.patch(
      `/spare-parts/purchase-orders/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Receive items
  receiveItems: async (
    id: string,
    items: Array<{
      itemId: string;
      receivedQuantity: number;
    }>
  ) => {
    const response = await sparePartsApi.post(
      `/spare-parts/purchase-orders/${id}/receive`,
      { items }
    );
    return response.data;
  },
};

// Dashboard
export const dashboardService = {
  // Get dashboard stats
  getStats: async () => {
    const response = await sparePartsApi.get("/spare-parts/dashboard/stats");
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const response = await sparePartsApi.get(
      `/spare-parts/dashboard/recent-activities?limit=${limit}`
    );
    return response.data;
  },
};

// Analytics
export const analyticsService = {
  // Get cost analysis
  getCostAnalysis: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "month" | "quarter" | "year";
  }) => {
    const response = await sparePartsApi.get(
      "/spare-parts/analytics/cost-analysis",
      { params }
    );
    return response.data;
  },

  // Get inventory trends
  getInventoryTrends: async (params?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }) => {
    const response = await sparePartsApi.get(
      "/spare-parts/analytics/inventory-trends",
      { params }
    );
    return response.data;
  },

  // Get supplier performance
  getSupplierAnalysis: async () => {
    const response = await sparePartsApi.get(
      "/spare-parts/analytics/supplier-performance"
    );
    return response.data;
  },

  // Get usage analytics
  getUsageAnalysis: async (params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }) => {
    const response = await sparePartsApi.get(
      "/spare-parts/analytics/usage-analytics",
      { params }
    );
    return response.data;
  },

  // Get comprehensive analytics
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await sparePartsApi.get("/spare-parts/analytics", {
      params,
    });
    return response.data;
  },
};

// Categories
export const categoriesService = {
  // Get all categories
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: number;
  }) => {
    const response = await sparePartsApi.get("/spare-parts/categories", {
      params,
    });
    return response.data;
  },

  // Get category by ID
  getById: async (id: string) => {
    const response = await sparePartsApi.get(`/spare-parts/categories/${id}`);
    return response.data;
  },

  // Create category
  create: async (data: {
    name: string;
    displayName: string;
    code: string;
    description?: string;
    parentId?: string;
    level?: number;
  }) => {
    const response = await sparePartsApi.post("/spare-parts/categories", data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: any) => {
    const response = await sparePartsApi.put(
      `/spare-parts/categories/${id}`,
      data
    );
    return response.data;
  },

  // Delete category
  delete: async (id: string) => {
    const response = await sparePartsApi.delete(
      `/spare-parts/categories/${id}`
    );
    return response.data;
  },
};

export default {
  spareParts: sparePartsService,
  inventory: inventoryService,
  suppliers: suppliersService,
  purchaseOrders: purchaseOrdersService,
  dashboard: dashboardService,
  analytics: analyticsService,
  categories: categoriesService,
};
