import axios, { AxiosInstance } from "axios";

// Account Manager interface
export interface AccountManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Types for Client-Store Service
export interface Client {
  id: string;
  clientCode: string;
  clientType: string;
  name: string;
  primaryContactPerson?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  city?: string;
  state?: string;
  businessSize?: string;
  baseOrderRate: number;
  bulkBonusEnabled: boolean;
  weeklyBonusEnabled: boolean;
  clientStatus: string;
  clientPriority: string;
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
  _count?: {
    stores: number;
  };
}

export interface Store {
  id: string;
  storeCode: string;
  clientId: string;
  storeName: string;
  storeType?: string;
  storeAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  businessHours?: any;
  deliveryRadius?: number;
  isEVChargingAvailable: boolean;
  chargingStationType?: string;
  chargingPower?: number;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  commission?: number;
  storeStatus: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  _count?: {
    riderEarnings: number;
  };
}

export interface RiderEarning {
  id: string;
  riderId: string;
  clientRiderId?: string;
  clientId: string;
  storeId: string;
  orderId?: string;

  // Rate Breakdown
  baseRate: number;
  storeOfferRate: number;
  totalRate: number;

  // Bonuses Applied
  bulkOrderBonus: number;
  performanceBonus: number;
  weeklyTargetBonus: number;
  specialEventBonus: number;

  finalEarning: number;

  // Metadata
  orderDate: string;
  deliveryTime?: number;
  riderRating?: number;
  distance?: number;

  // Calculation Details
  bonusesApplied?: string;
  rateCalculationLog?: string;

  // Payment Status
  paymentStatus: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;

  createdAt: string;
  updatedAt: string;

  store?: Store;
  client?: {
    id: string;
    name: string;
    clientCode: string;
  };
}

export interface ClientRiderMapping {
  id: string;
  platformRiderId: string; // Internal UUID
  publicRiderId?: string; // Human-readable ID (e.g., DEL-25-R000044)
  clientId: string;
  clientRiderId: string;
  isActive: boolean;
  assignmentDate: string;
  deactivationDate?: string;
  deactivationReason?: string;
  assignedBy?: string;
  assignedByName?: string;
  notes?: string;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: string;
  source: string;
  priority: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    clientCode: string;
    clientType?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  businessTypeDistribution: Record<string, number>;
}

export interface StoreStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  evChargingStores: number;
  storeTypeDistribution: Record<string, number>;
}

class ClientStoreService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_CLIENT_STORE_API_URL || "",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get("/health");
    return response.data;
  }

  // Client methods
  async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    clientType?: string;
    businessSize?: string;
    clientStatus?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<Client[]>> {
    const response = await this.api.get("/api/clients", { params });
    return response.data;
  }

  async getClient(id: string): Promise<ApiResponse<Client>> {
    const response = await this.api.get(`/api/clients/${id}`);
    return response.data;
  }

  async createClient(client: Partial<Client>): Promise<ApiResponse<Client>> {
    const response = await this.api.post("/api/clients", client);
    return response.data;
  }

  async updateClient(
    id: string,
    client: Partial<Client>
  ): Promise<ApiResponse<Client>> {
    const response = await this.api.put(`/api/clients/${id}`, client);
    return response.data;
  }

  async deleteClient(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/clients/${id}`);
    return response.data;
  }

  async getClientStats(params?: {
    clientType?: string;
  }): Promise<ApiResponse<ClientStats>> {
    const response = await this.api.get("/api/clients/stats", { params });
    return response.data;
  }

  async getAccountManagers(): Promise<ApiResponse<AccountManager[]>> {
    const response = await this.api.get("/api/clients/account-managers");
    return response.data;
  }

  // Store methods
  async getStores(params?: {
    page?: number;
    limit?: number;
    search?: string;
    clientId?: string;
    storeType?: string;
    storeStatus?: string;
    isEVChargingAvailable?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<Store[]>> {
    const response = await this.api.get("/api/stores", { params });
    return response.data;
  }

  async getStore(id: string): Promise<ApiResponse<Store>> {
    const response = await this.api.get(`/api/stores/${id}`);
    return response.data;
  }

  async getStoresByClient(clientId: string): Promise<ApiResponse<Store[]>> {
    const response = await this.api.get(`/api/stores/client/${clientId}`);
    return response.data;
  }

  async createStore(store: Partial<Store>): Promise<ApiResponse<Store>> {
    // Map frontend field names to backend field names
    const backendStoreData: any = { ...store };
    if ("contactPersonName" in backendStoreData) {
      backendStoreData.storeManagerName = backendStoreData.contactPersonName;
      delete backendStoreData.contactPersonName;
    }

    const response = await this.api.post("/api/stores", backendStoreData);
    return response.data;
  }

  async updateStore(
    id: string,
    store: Partial<Store>
  ): Promise<ApiResponse<Store>> {
    // Map frontend field names to backend field names
    const backendStoreData: any = { ...store };
    if ("contactPersonName" in backendStoreData) {
      backendStoreData.storeManagerName = backendStoreData.contactPersonName;
      delete backendStoreData.contactPersonName;
    }

    const response = await this.api.put(`/api/stores/${id}`, backendStoreData);
    return response.data;
  }

  async deleteStore(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/stores/${id}`);
    return response.data;
  }

  async getStoreStats(params?: {
    clientId?: string;
  }): Promise<ApiResponse<StoreStats>> {
    const response = await this.api.get("/api/stores/stats", { params });
    return response.data;
  }

  // Rider Earnings methods
  async getRiderEarnings(params?: {
    page?: number;
    limit?: number;
    riderId?: string;
    clientRiderId?: string;
    storeId?: string;
    clientId?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<RiderEarning[]>> {
    const response = await this.api.get("/api/rider-earnings", { params });
    return response.data;
  }

  async getRiderEarning(id: string): Promise<ApiResponse<RiderEarning>> {
    const response = await this.api.get(`/api/rider-earnings/${id}`);
    return response.data;
  }

  async getRiderEarningsByRider(
    riderId: string,
    params?: {
      dateFrom?: string;
      dateTo?: string;
      paymentStatus?: string;
    }
  ): Promise<ApiResponse<{ earnings: RiderEarning[]; summary: any }>> {
    const response = await this.api.get(
      `/api/rider-earnings/rider/${riderId}`,
      { params }
    );
    return response.data;
  }

  async getRiderEarningsByStore(
    storeId: string,
    params?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ApiResponse<RiderEarning[]>> {
    const response = await this.api.get(
      `/api/rider-earnings/store/${storeId}`,
      { params }
    );
    return response.data;
  }

  async createRiderEarning(
    earning: Partial<RiderEarning>
  ): Promise<ApiResponse<RiderEarning>> {
    const response = await this.api.post("/api/rider-earnings", earning);
    return response.data;
  }

  async updateRiderEarning(
    id: string,
    earning: Partial<RiderEarning>
  ): Promise<ApiResponse<RiderEarning>> {
    const response = await this.api.put(`/api/rider-earnings/${id}`, earning);
    return response.data;
  }

  async deleteRiderEarning(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/api/rider-earnings/${id}`);
    return response.data;
  }

  async getWeeklyRiderSummary(
    riderId: string,
    params?: {
      year?: number;
      week?: number;
    }
  ): Promise<ApiResponse<any>> {
    const response = await this.api.get(
      `/api/rider-earnings/weekly/${riderId}`,
      { params }
    );
    return response.data;
  }

  async generateWeeklyReport(data: {
    riderIds: string[];
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post(
      "/api/rider-earnings/reports/weekly",
      data
    );
    return response.data;
  }

  // Client Rider Mapping methods
  async getClientRiderMappings(params?: {
    page?: number;
    limit?: number;
    clientId?: string;
    platformRiderId?: string;
    clientRiderId?: string;
    isActive?: boolean;
    verificationStatus?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<ClientRiderMapping[]>> {
    const response = await this.api.get("/api/client-rider-mappings", {
      params,
    });
    return response.data;
  }

  async getClientRiderMapping(
    id: string
  ): Promise<ApiResponse<ClientRiderMapping>> {
    const response = await this.api.get(`/api/client-rider-mappings/${id}`);
    return response.data;
  }

  async resolveClientRiderId(
    clientId: string,
    clientRiderId: string
  ): Promise<
    ApiResponse<{
      platformRiderId: string;
      clientRiderId: string;
      clientName: string;
      mappingId: string;
      verificationStatus: string;
    }>
  > {
    const response = await this.api.get(
      `/api/client-rider-mappings/resolve/${clientId}/${clientRiderId}`
    );
    return response.data;
  }

  async getClientRiderMappingsByRider(
    platformRiderId: string,
    includeInactive?: boolean
  ): Promise<ApiResponse<ClientRiderMapping[]>> {
    const response = await this.api.get(
      `/api/client-rider-mappings/rider/${platformRiderId}`,
      {
        params: { includeInactive },
      }
    );
    return response.data;
  }

  async getClientRiderMappingsByClient(
    clientId: string,
    includeInactive?: boolean
  ): Promise<ApiResponse<ClientRiderMapping[]>> {
    const response = await this.api.get(
      `/api/client-rider-mappings/client/${clientId}`,
      {
        params: { includeInactive },
      }
    );
    return response.data;
  }

  async createClientRiderMapping(
    mapping: Partial<ClientRiderMapping>
  ): Promise<ApiResponse<ClientRiderMapping>> {
    const response = await this.api.post("/api/client-rider-mappings", mapping);
    return response.data;
  }

  async updateClientRiderMapping(
    id: string,
    mapping: Partial<ClientRiderMapping>
  ): Promise<ApiResponse<ClientRiderMapping>> {
    const response = await this.api.put(
      `/api/client-rider-mappings/${id}`,
      mapping
    );
    return response.data;
  }

  async deactivateClientRiderMapping(
    id: string,
    deactivationReason?: string
  ): Promise<ApiResponse<ClientRiderMapping>> {
    const response = await this.api.delete(`/api/client-rider-mappings/${id}`, {
      data: { deactivationReason },
    });
    return response.data;
  }

  async verifyClientRiderMapping(
    id: string,
    verifiedBy: string,
    status: string = "verified"
  ): Promise<ApiResponse<ClientRiderMapping>> {
    const response = await this.api.post(
      `/api/client-rider-mappings/${id}/verify`,
      {
        verifiedBy,
        status,
      }
    );
    return response.data;
  }

  async bulkCreateClientRiderMappings(data: {
    mappings: Partial<ClientRiderMapping>[];
    source?: string;
  }): Promise<
    ApiResponse<{
      successful: ClientRiderMapping[];
      failed: any[];
    }>
  > {
    const response = await this.api.post(
      "/api/client-rider-mappings/bulk",
      data
    );
    return response.data;
  }
}

export const clientStoreService = new ClientStoreService();
export default clientStoreService;

// Export convenience functions
export const getAccountManagers = () => clientStoreService.getAccountManagers();
