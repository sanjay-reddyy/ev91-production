import axios from "axios";
import {
  DepartmentType,
  BaseDashboardMetrics,
  SalesDashboardMetrics,
  SupplyDashboardMetrics,
  FinanceDashboardMetrics,
  EVVehicleDashboardMetrics,
  InventoryDashboardMetrics,
  OperationsDashboardMetrics,
  ManagementDashboardMetrics,
  DashboardDataRequest,
  DashboardDataResponse,
} from "../types/department";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://dashboard.ev91riderz.com/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard API Service
export const dashboardApi = {
  /**
   * Get Sales Dashboard Data
   */
  async getSalesDashboard(
    filters?: DashboardDataRequest
  ): Promise<SalesDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<SalesDashboardMetrics>
    >("/dashboard/sales", { params: filters });
    return response.data.data;
  },

  /**
   * Get Supply Dashboard Data
   */
  async getSupplyDashboard(
    filters?: DashboardDataRequest
  ): Promise<SupplyDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<SupplyDashboardMetrics>
    >("/dashboard/supply", { params: filters });
    return response.data.data;
  },

  /**
   * Get Finance Dashboard Data
   */
  async getFinanceDashboard(
    filters?: DashboardDataRequest
  ): Promise<FinanceDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<FinanceDashboardMetrics>
    >("/dashboard/finance", { params: filters });
    return response.data.data;
  },

  /**
   * Get EV Vehicle Dashboard Data
   */
  async getVehicleDashboard(
    filters?: DashboardDataRequest
  ): Promise<EVVehicleDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<EVVehicleDashboardMetrics>
    >("/dashboard/vehicles", { params: filters });
    return response.data.data;
  },

  /**
   * Get Inventory Dashboard Data
   */
  async getInventoryDashboard(
    filters?: DashboardDataRequest
  ): Promise<InventoryDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<InventoryDashboardMetrics>
    >("/dashboard/inventory", { params: filters });
    return response.data.data;
  },

  /**
   * Get Operations Dashboard Data
   */
  async getOperationsDashboard(
    filters?: DashboardDataRequest
  ): Promise<OperationsDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<OperationsDashboardMetrics>
    >("/dashboard/operations", { params: filters });
    return response.data.data;
  },

  /**
   * Get Management Dashboard Data
   */
  async getManagementDashboard(
    filters?: DashboardDataRequest
  ): Promise<ManagementDashboardMetrics> {
    const response = await apiClient.get<
      DashboardDataResponse<ManagementDashboardMetrics>
    >("/dashboard/management", { params: filters });
    return response.data.data;
  },

  /**
   * Generic dashboard data fetcher based on department type
   */
  async getDashboardData(
    department: DepartmentType,
    filters?: DashboardDataRequest
  ): Promise<BaseDashboardMetrics> {
    switch (department) {
      case DepartmentType.SALES:
        return await this.getSalesDashboard(filters);
      case DepartmentType.SUPPLY:
        return await this.getSupplyDashboard(filters);
      case DepartmentType.FINANCE:
        return await this.getFinanceDashboard(filters);
      case DepartmentType.EV_VEHICLE_TEAM:
        return await this.getVehicleDashboard(filters);
      case DepartmentType.INVENTORY_TEAM:
        return await this.getInventoryDashboard(filters);
      case DepartmentType.OPERATIONS:
        return await this.getOperationsDashboard(filters);
      case DepartmentType.MANAGEMENT:
        return await this.getManagementDashboard(filters);
      default:
        throw new Error(`Unknown department type: ${department}`);
    }
  },
};

// Existing service endpoints that we'll integrate
export const existingServicesApi = {
  /**
   * Get clients list (for Sales Dashboard)
   */
  async getClients() {
    const response = await apiClient.get("/clients");
    return response.data;
  },

  /**
   * Get stores list (for Sales Dashboard)
   */
  async getStores() {
    const response = await apiClient.get("/stores");
    return response.data;
  },

  /**
   * Get riders list (for Operations/Supply Dashboard)
   */
  async getRiders() {
    const response = await apiClient.get("/riders");
    return response.data;
  },

  /**
   * Get vehicles list (for Vehicle Team Dashboard)
   */
  async getVehicles() {
    const response = await apiClient.get("/vehicles");
    return response.data;
  },

  /**
   * Get hubs list (for Supply Dashboard)
   */
  async getHubs() {
    const response = await apiClient.get("/hubs");
    return response.data;
  },

  /**
   * Get spare parts inventory (for Inventory Dashboard)
   */
  async getSpareParts() {
    const response = await apiClient.get("/spare-parts");
    return response.data;
  },

  /**
   * Get spare parts dashboard stats
   */
  async getSparePartsStats() {
    const response = await apiClient.get("/spare-parts/dashboard/stats");
    return response.data;
  },

  /**
   * Get rider earnings (for Finance Dashboard)
   */
  async getRiderEarnings() {
    const response = await apiClient.get("/rider-earnings");
    return response.data;
  },

  /**
   * Get orders (for Operations Dashboard)
   */
  async getOrders() {
    const response = await apiClient.get("/orders");
    return response.data;
  },
};

export default dashboardApi;
