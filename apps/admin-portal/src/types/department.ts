// Department Types and Constants for Role-Based Dashboards

export enum DepartmentType {
  SALES = "SALES",
  SUPPLY = "SUPPLY",
  FINANCE = "FINANCE",
  EV_VEHICLE_TEAM = "EV_VEHICLE_TEAM",
  INVENTORY_TEAM = "INVENTORY_TEAM",
  OPERATIONS = "OPERATIONS",
  MANAGEMENT = "MANAGEMENT",
}

export const DEPARTMENT_NAMES: Record<DepartmentType, string> = {
  [DepartmentType.SALES]: "Sales",
  [DepartmentType.SUPPLY]: "Supply Chain",
  [DepartmentType.FINANCE]: "Finance",
  [DepartmentType.EV_VEHICLE_TEAM]: "EV Vehicle Team",
  [DepartmentType.INVENTORY_TEAM]: "Inventory Team",
  [DepartmentType.OPERATIONS]: "Operations",
  [DepartmentType.MANAGEMENT]: "Management",
};

export const DEPARTMENT_CODES: Record<DepartmentType, string> = {
  [DepartmentType.SALES]: "SALES",
  [DepartmentType.SUPPLY]: "SUPPLY",
  [DepartmentType.FINANCE]: "FIN",
  [DepartmentType.EV_VEHICLE_TEAM]: "EVVT",
  [DepartmentType.INVENTORY_TEAM]: "INV",
  [DepartmentType.OPERATIONS]: "OPS",
  [DepartmentType.MANAGEMENT]: "MGT",
};

// Dashboard Metrics Interfaces

export interface BaseDashboardMetrics {
  department: DepartmentType;
  lastUpdated: Date;
}

// Sales Department Metrics
export interface SalesDashboardMetrics extends BaseDashboardMetrics {
  monthlyRevenue: number;
  revenueGrowth: number;
  targetRevenue: number;
  achievementPercentage: number;

  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientChurnRate: number;

  totalStores: number;
  newStoresThisMonth: number;

  avgRevenuePerClient: number;
  avgRevenuePerStore: number;

  leadsInPipeline: number;
  conversionsThisMonth: number;
  conversionRate: number;

  topClients: Array<{
    id: string;
    name: string;
    revenue: number;
    stores: number;
    growth: number;
  }>;

  storesByCity: Array<{
    city: string;
    count: number;
    revenue: number;
  }>;
}

// Supply Department Metrics
export interface SupplyDashboardMetrics extends BaseDashboardMetrics {
  totalHubs: number;
  activeHubs: number;
  hubUtilization: number;

  totalRiderCapacity: number;
  totalVehicleCapacity: number;
  currentRiders: number;
  currentVehicles: number;
  availableCapacity: number;

  citiesCovered: number;
  storesServed: number;
  avgResponseTime: number;
  coverageEfficiency: number;

  demandSupplyRatio: number;
  overloadedHubs: number;
  underutilizedHubs: number;

  hubsData: Array<{
    id: string;
    name: string;
    city: string;
    riderCapacity: number;
    currentRiders: number;
    vehicleCapacity: number;
    currentVehicles: number;
    utilizationRate: number;
    storesServed: number;
  }>;
}

// Finance Department Metrics
export interface FinanceDashboardMetrics extends BaseDashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;

  totalExpenses: number;
  riderPayouts: number;
  vehicleCosts: number;
  operationalCosts: number;
  maintenanceCosts: number;

  grossProfit: number;
  netProfit: number;
  profitMargin: number;

  pendingPayouts: number;
  processedPayoutsThisWeek: number;
  totalDeductions: number;
  avgPayoutPerRider: number;

  outstandingInvoices: number;
  overduePayments: number;
  collectionEfficiency: number;

  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  burnRate: number;
}

// EV Vehicle Team Metrics
export interface EVVehicleDashboardMetrics extends BaseDashboardMetrics {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;

  healthyVehicles: number;
  needsAttention: number;
  criticalVehicles: number;
  avgFleetHealth: number;

  avgBatteryHealth: number;
  vehiclesLowBattery: number;
  chargingVehicles: number;
  batteryReplacementDue: number;

  vehiclesUnderMaintenance: number;
  overdueMaintenance: number;
  scheduledMaintenanceToday: number;
  avgMaintenanceTime: number;

  avgDailyDistance: number;
  totalDistanceCovered: number;
  fuelEfficiency: number;

  maintenanceCostMTD: number;
  avgCostPerVehicle: number;

  vehiclesByStatus: Array<{
    status: string;
    count: number;
  }>;

  batteryHealthDistribution: Array<{
    range: string;
    count: number;
  }>;
}

// Inventory Team Metrics
export interface InventoryDashboardMetrics extends BaseDashboardMetrics {
  totalSKUs: number;
  totalValue: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;

  monthlyConsumption: number;
  avgTurnoverRate: number;
  fastMovingItemsCount: number;
  slowMovingItemsCount: number;

  pendingPurchaseOrders: number;
  poValue: number;
  expectedDeliveries: number;
  supplierPerformance: number;

  hubsWithLowStock: number;
  stockTransfersInProgress: number;

  inventoryValue: number;
  wastePercentage: number;

  categoryBreakdown: Array<{
    category: string;
    totalItems: number;
    value: number;
    lowStockCount: number;
  }>;

  hubInventory: Array<{
    hubId: string;
    hubName: string;
    totalItems: number;
    value: number;
    lowStockCount: number;
  }>;

  criticalItems: Array<{
    id: string;
    name: string;
    currentStock: number;
    minimumStock: number;
    affectedHubs: number;
  }>;
}

// Operations Department Metrics
export interface OperationsDashboardMetrics extends BaseDashboardMetrics {
  activeRiders: number;
  ongoingDeliveries: number;
  pendingPickups: number;
  completedDeliveriesToday: number;

  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
  customerSatisfaction: number;

  riderUtilization: number;
  avgDeliveriesPerRider: number;
  peakHourPerformance: number;

  delayedDeliveries: number;
  failedDeliveries: number;
  customerComplaints: number;
  riderIssues: number;

  activeStores: number;
  activeHubs: number;
  coverageEfficiency: number;

  liveRiders: Array<{
    riderId: string;
    name: string;
    status: "ACTIVE" | "IDLE" | "ON_DELIVERY" | "ON_BREAK" | "OFFLINE";
    location: {
      latitude: number;
      longitude: number;
    };
    currentOrder?: string;
    todayDeliveries: number;
    todayEarnings: number;
  }>;

  hourlyPerformance: Array<{
    hour: string;
    deliveries: number;
    avgTime: number;
  }>;
}

// Management Dashboard Metrics (Consolidated view)
export interface ManagementDashboardMetrics extends BaseDashboardMetrics {
  // Executive Summary
  totalRevenue: number;
  revenueGrowth: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;

  // Operations
  totalDeliveries: number;
  avgDeliveryTime: number;
  onTimeRate: number;
  customerSatisfaction: number;

  // Resources
  totalRiders: number;
  activeRiders: number;
  totalVehicles: number;
  activeVehicles: number;
  totalHubs: number;

  // Clients & Stores
  totalClients: number;
  totalStores: number;
  newClientsThisMonth: number;

  // Department Summaries
  departments: {
    sales: Partial<SalesDashboardMetrics>;
    supply: Partial<SupplyDashboardMetrics>;
    finance: Partial<FinanceDashboardMetrics>;
    operations: Partial<OperationsDashboardMetrics>;
    vehicles: Partial<EVVehicleDashboardMetrics>;
    inventory: Partial<InventoryDashboardMetrics>;
  };

  // Critical Alerts
  criticalAlerts: Array<{
    department: DepartmentType;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: Date;
  }>;
}

// Dashboard Data Request/Response Types
export interface DashboardDataRequest {
  department: DepartmentType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export interface DashboardDataResponse<T extends BaseDashboardMetrics> {
  success: boolean;
  data: T;
  timestamp: Date;
}

// Dashboard Permissions
export const DEPARTMENT_PERMISSIONS: Record<DepartmentType, string[]> = {
  [DepartmentType.SALES]: [
    "dashboard:sales:view",
    "clients:read",
    "stores:read",
    "revenue:read",
  ],
  [DepartmentType.SUPPLY]: [
    "dashboard:supply:view",
    "hubs:read",
    "riders:read",
    "vehicles:read",
    "capacity:manage",
  ],
  [DepartmentType.FINANCE]: [
    "dashboard:finance:view",
    "payouts:read",
    "payouts:approve",
    "invoices:read",
    "finance:read",
  ],
  [DepartmentType.EV_VEHICLE_TEAM]: [
    "dashboard:vehicles:view",
    "vehicles:read",
    "vehicles:update",
    "maintenance:read",
    "maintenance:manage",
  ],
  [DepartmentType.INVENTORY_TEAM]: [
    "dashboard:inventory:view",
    "inventory:read",
    "inventory:update",
    "purchase-orders:read",
    "purchase-orders:create",
  ],
  [DepartmentType.OPERATIONS]: [
    "dashboard:operations:view",
    "riders:read",
    "deliveries:read",
    "stores:read",
    "real-time:view",
  ],
  [DepartmentType.MANAGEMENT]: [
    "dashboard:management:view",
    "dashboard:*:view",
    "*:read",
  ],
};
