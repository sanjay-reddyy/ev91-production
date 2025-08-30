// Base response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationInfo;
  meta?: Record<string, any>;
}

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter interfaces
export interface SparePartFilters {
  categoryId?: string;
  supplierId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  compatibility?: string; // Vehicle model ID
  inStock?: boolean;
  lowStock?: boolean;
}

export interface StockFilters {
  storeId?: string;
  sparePartId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ServiceUsageFilters {
  vehicleId?: string;
  serviceRecordId?: string;
  sparePartId?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
  minCost?: number;
  maxCost?: number;
}

// Business logic interfaces
export interface StockMovementRequest {
  sparePartId: string;
  storeId: string;
  movementType: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT" | "DAMAGED" | "RETURN";
  quantity: number;
  unitCost?: number;
  reason?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface PurchaseOrderRequest {
  supplierId: string;
  storeId: string;
  storeName: string;
  expectedDate?: Date;
  notes?: string;
  terms?: string;
  urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemRequest {
  sparePartId: string;
  orderedQuantity: number;
  unitCost: number;
}

export interface ServicePartUsageRequest {
  serviceRecordId: string;
  vehicleId: string;
  sparePartId: string;
  storeId: string;
  quantityUsed: number;
  sellingPrice: number;
  usageReason?: string;
  notes?: string;
  isWarranty?: boolean;
}

export interface GoodsReceivingRequest {
  purchaseOrderId: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceAmount?: number;
  transportDetails?: string;
  qualityNotes?: string;
  qualityRating?: number;
  items: GoodsReceivingItemRequest[];
}

export interface GoodsReceivingItemRequest {
  sparePartId: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  condition?: "GOOD" | "DAMAGED" | "DEFECTIVE";
  rejectionReason?: string;
  notes?: string;
  unitCost: number;
}

// Analytics interfaces
export interface InventoryAnalyticsData {
  totalItems: number;
  totalValue: number;
  totalCostValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  excessStockItems: number;
  fastMovingItems: number;
  slowMovingItems: number;
  deadStockItems: number;
  stockTurnover: number;
}

export interface SalesAnalyticsData {
  totalSales: number;
  totalCost: number;
  totalMargin: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topSellingParts: TopSellingPart[];
  topProfitableParts: TopProfitablePart[];
}

export interface TopSellingPart {
  sparePartId: string;
  partName: string;
  partNumber: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface TopProfitablePart {
  sparePartId: string;
  partName: string;
  partNumber: string;
  totalMargin: number;
  marginPercent: number;
}

export interface FinancialSummary {
  totalInventoryValue: number;
  totalCostValue: number;
  totalPurchases: number;
  totalSales: number;
  totalMargin: number;
  averageMargin: number;
  pendingPurchaseValue: number;
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  purchases: number;
  sales: number;
  margin: number;
  marginPercent: number;
}

// Dashboard data
export interface DashboardData {
  overview: {
    totalParts: number;
    totalValue: number;
    lowStockAlerts: number;
    pendingOrders: number;
  };
  recentActivities: RecentActivity[];
  topPerformingParts: TopSellingPart[];
  stockAlerts: StockAlert[];
  financialSummary: FinancialSummary;
}

export interface RecentActivity {
  id: string;
  type: "STOCK_IN" | "STOCK_OUT" | "PURCHASE_ORDER" | "SERVICE_USAGE";
  description: string;
  timestamp: Date;
  value?: number;
  reference?: string;
}

export interface StockAlert {
  sparePartId: string;
  partName: string;
  partNumber: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  minimumStock: number;
  alertType: "LOW_STOCK" | "OUT_OF_STOCK" | "EXCESS_STOCK";
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Utility types
export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: BulkError[];
}

export interface BulkError {
  index: number;
  id?: string;
  error: string;
  data?: any;
}

// User context (for audit trails)
export interface UserContext {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
}

// System configuration
export interface SystemConfiguration {
  autoReorderEnabled: boolean;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  defaultMarkupPercentage: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  auditLogRetentionDays: number;
}

// Export outward flow types
export * from "./outward";
