import axios from "axios";

const CLIENT_STORE_SERVICE_URL =
  import.meta.env.VITE_CLIENT_STORE_API_URL || "http://localhost:3004/api";

// Configure axios instance for client-store service
const api = axios.create({
  baseURL: CLIENT_STORE_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn(
      "No auth token found in localStorage when making client-store API request"
    );
  } else {
    console.log(
      "Auth token found and will be used for client-store API request"
    );
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Unauthorized request to client-store service:",
        error.config?.url
      );
      // Handle auth errors if needed
    }
    return Promise.reject(error);
  }
);

// Types for Client Management
export interface Client {
  id: string;
  name: string;
  clientCode: string;
  clientType: string;
  city?: string;
  state?: string;
  pinCode?: string;
  primaryContactPerson?: string;
  email?: string;
  phone?: string;
  clientStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Types for Store Management
export interface Store {
  id: string;
  clientId: string;
  storeName: string;
  storeCode: string;
  storeType: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  contactNumber?: string;
  emailAddress?: string;
  storeStatus: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

// City data type
export interface City {
  name: string;
  state: string;
  count?: number;
}

// Client Store Service Functions

/**
 * Get all clients with filtering and pagination
 */
export const getClients = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  clientType?: string;
  city?: string;
  clientStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  success: boolean;
  data: Client[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> => {
  try {
    const response = await api.get("/clients", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
};

/**
 * Get client by ID
 */
export const getClientById = async (
  clientId: string
): Promise<{
  success: boolean;
  data: Client;
}> => {
  try {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
};

/**
 * Get clients by city
 */
export const getClientsByCity = async (
  city: string
): Promise<{
  success: boolean;
  data: Client[];
}> => {
  try {
    const response = await api.get(`/clients/city/${city}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching clients by city:", error);
    throw error;
  }
};

/**
 * Get all stores with filtering and pagination
 */
export const getStores = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  city?: string;
  storeType?: string;
  storeStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  success: boolean;
  data: Store[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> => {
  try {
    const response = await api.get("/stores", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
};

/**
 * Get store by ID
 */
export const getStoreById = async (
  storeId: string
): Promise<{
  success: boolean;
  data: Store;
}> => {
  try {
    const response = await api.get(`/stores/${storeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching store:", error);
    throw error;
  }
};

/**
 * Get stores by client ID
 */
export const getStoresByClient = async (
  clientId: string
): Promise<{
  success: boolean;
  data: Store[];
}> => {
  try {
    const response = await api.get(`/stores/client/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching stores by client:", error);
    throw error;
  }
};

/**
 * Get stores by city
 */
export const getStoresByCity = async (
  city: string
): Promise<{
  success: boolean;
  data: Store[];
}> => {
  try {
    const response = await api.get(`/stores/city/${city}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching stores by city:", error);
    throw error;
  }
};

/**
 * Get unique cities from clients
 */
export const getCities = async (): Promise<{
  success: boolean;
  data: City[];
}> => {
  try {
    // Get all clients and extract unique cities
    const clientsResponse = await getClients({ limit: 1000 });

    if (!clientsResponse.success) {
      throw new Error("Failed to fetch clients for cities");
    }

    const cities: { [key: string]: City } = {};

    clientsResponse.data.forEach((client) => {
      if (client.city && client.state) {
        const key = `${client.city}-${client.state}`;
        if (!cities[key]) {
          cities[key] = {
            name: client.city,
            state: client.state,
            count: 0,
          };
        }
        cities[key].count = (cities[key].count || 0) + 1;
      }
    });

    const uniqueCities = Object.values(cities).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      success: true,
      data: uniqueCities,
    };
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};

/**
 * Get client statistics
 */
export const getClientStats = async (): Promise<{
  success: boolean;
  data: {
    totalClients: number;
    activeClients: number;
    totalStores: number;
    activeStores: number;
    citiesServed: number;
    [key: string]: any;
  };
}> => {
  try {
    const response = await api.get("/clients/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching client stats:", error);
    throw error;
  }
};

/**
 * Get store statistics
 */
export const getStoreStats = async (): Promise<{
  success: boolean;
  data: {
    totalStores: number;
    activeStores: number;
    storesByType: { [key: string]: number };
    storesByCity: { [key: string]: number };
    [key: string]: any;
  };
}> => {
  try {
    const response = await api.get("/stores/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching store stats:", error);
    throw error;
  }
};

export default {
  getClients,
  getClientById,
  getClientsByCity,
  getStores,
  getStoreById,
  getStoresByClient,
  getStoresByCity,
  getCities,
  getClientStats,
  getStoreStats,
};
