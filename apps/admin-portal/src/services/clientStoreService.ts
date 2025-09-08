import axios from "axios";

// Helper function to debug authentication state
const debugAuthState = (): void => {
  const authToken = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  console.log("🔍 Auth State Debug:", {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    authTokenLength: authToken ? authToken.length : 0,
    refreshTokenLength: refreshToken ? refreshToken.length : 0,
  });

  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      const currentTime = Date.now() / 1000;
      const expiresIn = payload.exp - currentTime;
      console.log("🔍 Token Details:", {
        userId: payload.sub || payload.userId,
        role: payload.role,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresInMinutes: Math.round(expiresIn / 60),
        isExpired: payload.exp < currentTime,
      });
    } catch (error) {
      console.error("❌ Error parsing auth token:", error);
    }
  }
};

// Helper function to refresh token proactively
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn("❌ No auth token found in localStorage");
    return null;
  }

  // Check if token is expired or will expire in 5 minutes
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    const fiveMinutesFromNow = currentTime + 5 * 60; // 5 minutes buffer

    if (payload.exp > fiveMinutesFromNow) {
      // Token is still valid for at least 5 more minutes
      return token;
    }
  } catch (error) {
    console.error("❌ Error parsing token:", error);
  }

  // Token is expired or will expire soon, attempt refresh
  console.log("🔄 Token is expired or expiring soon, attempting refresh...");

  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.error("❌ No refresh token available");
      return null;
    }

    const response = await fetch(
      "http://localhost:8000/api/auth/refresh-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.data && result.data.accessToken) {
      localStorage.setItem("authToken", result.data.accessToken);
      if (result.data.refreshToken) {
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }
      console.log("✅ Token refreshed proactively");
      return result.data.accessToken;
    } else {
      throw new Error("Invalid response from refresh endpoint");
    }
  } catch (error) {
    console.error("❌ Proactive token refresh failed:", error);
    // Clear invalid tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
};

// Use the API Gateway URL instead of direct service connection
const API_GATEWAY_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Configure axios instance for client-store service through API Gateway
const api = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`🔍 Making request to: ${config.url}`);
    debugAuthState(); // Debug current auth state

    // Skip auth for login and refresh endpoints
    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh-token") ||
      config.url?.includes("/auth/register");

    if (isAuthEndpoint) {
      console.log("⚡ Skipping auth for authentication endpoint");
      return config;
    }

    // For all other endpoints, try to get a valid token
    const token = await refreshTokenIfNeeded();

    if (!token) {
      console.error("❌ No valid token available for request");
      console.error(
        "🔑 Please login first with: admin@ev91.com / SuperAdmin123!"
      );

      // Instead of rejecting, we'll let the request go through
      // and let the server return 401, which will trigger the response interceptor
      console.warn(
        "⚠️ Proceeding with request without token - server will return 401"
      );
    } else {
      console.log("✅ Valid token found, adding to request headers");
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with auto token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Successful response from: ${response.config?.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(`❌ Request failed: ${originalRequest?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.warn("🚨 401 Unauthorized - checking authentication status");

      // Check if we have any tokens at all
      const authToken = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!authToken && !refreshToken) {
        console.error("❌ No authentication tokens found!");
        console.error(
          "🔑 You need to login first. Use the QUICK_LOGIN.js script in browser console:"
        );
        console.error(
          "📋 Copy and paste the content of QUICK_LOGIN.js in your browser console"
        );

        const authError = new Error(
          "Please login first. Open browser console (F12) and run the QUICK_LOGIN.js script."
        );
        authError.name = "AuthenticationError";
        return Promise.reject(authError);
      }

      if (refreshToken) {
        console.log("🔄 Attempting token refresh...");

        try {
          const response = await fetch(
            "http://localhost:8000/api/auth/refresh-token",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Refresh failed: ${response.status} ${response.statusText}`
            );
          }

          const result = await response.json();

          if (result.success && result.data && result.data.accessToken) {
            localStorage.setItem("authToken", result.data.accessToken);
            if (result.data.refreshToken) {
              localStorage.setItem("refreshToken", result.data.refreshToken);
            }

            console.log(
              "✅ Token refreshed successfully, retrying original request"
            );
            originalRequest.headers.Authorization = `Bearer ${result.data.accessToken}`;
            return api(originalRequest);
          } else {
            throw new Error("Invalid refresh response");
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);

          // Clear invalid tokens
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");

          console.error(
            "🔑 Token refresh failed. Please login again using QUICK_LOGIN.js"
          );

          const authError = new Error(
            "Session expired and refresh failed. Please login again using the QUICK_LOGIN.js script."
          );
          authError.name = "AuthenticationError";
          return Promise.reject(authError);
        }
      }
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

    // Map _count.stores to storeCount for frontend compatibility
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map((client: any) => ({
        ...client,
        storeCount: client._count?.stores || 0,
      }));
    }

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

    // Map backend field names to frontend field names for compatibility
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map((store: any) => ({
        ...store,
        contactPersonName: store.storeManagerName, // Map storeManagerName to contactPersonName for frontend
        latitude: store.gpsLatitude, // Map gpsLatitude to latitude
        longitude: store.gpsLongitude, // Map gpsLongitude to longitude
        isEVChargingAvailable: false, // Default value since this field doesn't exist in backend
      }));
    }

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

    // Map backend field names to frontend field names for compatibility
    if (response.data.success && response.data.data) {
      const store = response.data.data;
      response.data.data = {
        ...store,
        contactPersonName: store.storeManagerName,
        latitude: store.gpsLatitude,
        longitude: store.gpsLongitude,
        isEVChargingAvailable: false, // Default value since this field doesn't exist in backend
      };
    }

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

    // Map backend field names to frontend field names for compatibility
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map((store: any) => ({
        ...store,
        contactPersonName: store.storeManagerName,
        latitude: store.gpsLatitude,
        longitude: store.gpsLongitude,
        isEVChargingAvailable: false,
      }));
    }

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

    // Map backend field names to frontend field names for compatibility
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map((store: any) => ({
        ...store,
        contactPersonName: store.storeManagerName,
        latitude: store.gpsLatitude,
        longitude: store.gpsLongitude,
        isEVChargingAvailable: false,
      }));
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching stores by city:", error);
    throw error;
  }
};

/**
 * Get unique cities from clients with robust fallback handling
 */
export const getCities = async (): Promise<{
  success: boolean;
  data: City[];
}> => {
  console.log("🏙️ Loading cities data...");

  try {
    // First attempt: Try to get cities from the city sync endpoint via API Gateway
    console.log("Attempting to fetch from city sync endpoint...");
    const response = await api.get("/internal/city-sync/cities");

    if (response.data?.success && Array.isArray(response.data.data)) {
      const cities = response.data.data
        .filter((city: any) => city.isActive !== false) // Accept true or undefined
        .map((city: any) => ({
          name: city.name,
          state: city.state,
          count: 0,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      if (cities.length > 0) {
        console.log(
          `✅ Successfully loaded ${cities.length} cities from sync endpoint`
        );
        return { success: true, data: cities };
      }
    }
  } catch (error: any) {
    const errorMsg =
      error.response?.status === 404
        ? "City sync endpoint not found (404)"
        : `API error: ${error.response?.status || error.message}`;
    console.warn(`⚠️ City sync endpoint failed: ${errorMsg}`);
  }

  // Second attempt: Extract cities from existing client data
  try {
    console.log("Falling back to client data extraction...");
    const clientsResponse = await getClients({ limit: 1000 });

    if (clientsResponse.success && clientsResponse.data.length > 0) {
      const cityMap: { [key: string]: City } = {};

      clientsResponse.data.forEach((client) => {
        if (client.city && client.state) {
          const key = `${client.city}-${client.state}`;
          if (!cityMap[key]) {
            cityMap[key] = {
              name: client.city,
              state: client.state,
              count: 0,
            };
          }
          cityMap[key].count = (cityMap[key].count || 0) + 1;
        }
      });

      const cities = Object.values(cityMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      if (cities.length > 0) {
        console.log(
          `✅ Successfully extracted ${cities.length} cities from client data`
        );
        return { success: true, data: cities };
      }
    }
  } catch (error: any) {
    console.warn("⚠️ Client data extraction failed:", error.message);
  }

  // Final fallback: Return static city list to ensure UI doesn't break
  console.log("🔄 Using static fallback city list");
  const fallbackCities: City[] = [
    { name: "Bengaluru", state: "Karnataka", count: 0 },
    { name: "Mumbai", state: "Maharashtra", count: 0 },
    { name: "Chennai", state: "Tamil Nadu", count: 0 },
    { name: "Hyderabad", state: "Telangana", count: 0 },
    { name: "Pune", state: "Maharashtra", count: 0 },
    { name: "Delhi", state: "Delhi", count: 0 },
    { name: "Kolkata", state: "West Bengal", count: 0 },
    { name: "Ahmedabad", state: "Gujarat", count: 0 },
    { name: "Jaipur", state: "Rajasthan", count: 0 },
    { name: "Kochi", state: "Kerala", count: 0 },
  ];

  return { success: true, data: fallbackCities };
};

/**
 * Get unique states from cities with fallback handling
 */
export const getStates = async (): Promise<{
  success: boolean;
  data: string[];
}> => {
  try {
    console.log("🗺️ Loading states data...");
    const citiesResponse = await getCities();

    if (citiesResponse.success && citiesResponse.data.length > 0) {
      const uniqueStates = [
        ...new Set(citiesResponse.data.map((city) => city.state)),
      ]
        .filter(Boolean)
        .sort();

      console.log(`✅ Successfully loaded ${uniqueStates.length} states`);
      return { success: true, data: uniqueStates };
    }

    // Fallback to static state list
    console.log("🔄 Using static fallback state list");
    const fallbackStates = [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
    ];

    return { success: true, data: fallbackStates };
  } catch (error) {
    console.error("Error fetching states:", error);

    // Final static fallback
    const fallbackStates = [
      "Karnataka",
      "Maharashtra",
      "Tamil Nadu",
      "Telangana",
      "Delhi",
      "Gujarat",
      "West Bengal",
      "Rajasthan",
      "Kerala",
      "Punjab",
    ];

    return { success: true, data: fallbackStates };
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

// Client CRUD operations
export const createClient = async (
  clientData: any
): Promise<{
  success: boolean;
  data: Client;
  message?: string;
}> => {
  try {
    const response = await api.post("/clients", clientData);
    return response.data;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

export const updateClient = async (
  id: string,
  clientData: any
): Promise<{
  success: boolean;
  data: Client;
  message?: string;
}> => {
  try {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (
  id: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

// Store CRUD operations
export const createStore = async (
  storeData: any
): Promise<{
  success: boolean;
  data: Store;
  message?: string;
}> => {
  try {
    // Map frontend field names to backend field names
    const backendStoreData: any = { ...storeData };
    if ("contactPersonName" in backendStoreData) {
      backendStoreData.storeManagerName = backendStoreData.contactPersonName;
      delete backendStoreData.contactPersonName;
    }

    const response = await api.post("/stores", backendStoreData);
    return response.data;
  } catch (error) {
    console.error("Error creating store:", error);
    throw error;
  }
};

export const updateStore = async (
  id: string,
  storeData: any
): Promise<{
  success: boolean;
  data: Store;
  message?: string;
}> => {
  try {
    // Map frontend field names to backend field names
    const backendStoreData: any = { ...storeData };
    if ("contactPersonName" in backendStoreData) {
      backendStoreData.storeManagerName = backendStoreData.contactPersonName;
      delete backendStoreData.contactPersonName;
    }

    const response = await api.put(`/stores/${id}`, backendStoreData);
    return response.data;
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
};

export const deleteStore = async (
  id: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting store:", error);
    throw error;
  }
};

/**
 * Get coordinates from address using geocoding
 */
export const getCoordinatesFromAddress = async (
  address: string,
  city: string,
  state: string,
  pinCode?: string
): Promise<{
  success: boolean;
  data?: {
    latitude: number;
    longitude: number;
  };
  error?: string;
}> => {
  try {
    // Construct full address for geocoding - filter out empty strings
    const addressParts = [address, city, state, pinCode, "India"].filter(
      (part) => part && part.trim()
    );
    const fullAddress = addressParts.join(", ");

    console.log("🔍 Geocoding search query:", fullAddress);

    if (!fullAddress || fullAddress === "India") {
      return {
        success: false,
        error:
          "Please provide at least some address information to search for coordinates",
      };
    }

    // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: fullAddress,
          format: "json",
          limit: 1,
          countrycodes: "in", // Restrict to India
          addressdetails: 1,
        },
        // Note: User-Agent header cannot be set from browser JavaScript
        // The browser will automatically set an appropriate User-Agent header
      }
    );

    console.log("📍 Geocoding API response:", response.data);

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      console.log("✅ Coordinates found:", {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        display_name: location.display_name,
      });

      return {
        success: true,
        data: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
        },
      };
    } else {
      console.log("❌ No coordinates found in response");
      return {
        success: false,
        error:
          "No coordinates found for this address. Please verify the address details.",
      };
    }
  } catch (error: any) {
    console.error("❌ Geocoding error:", error);

    // Handle different types of errors
    if (error.code === "ERR_NETWORK") {
      return {
        success: false,
        error:
          "Network error: Please check your internet connection and try again.",
      };
    } else if (error.response?.status === 429) {
      return {
        success: false,
        error: "Too many requests: Please wait a moment and try again.",
      };
    } else if (error.message?.includes("CORS")) {
      return {
        success: false,
        error: "CORS error: Please try again or enter coordinates manually.",
      };
    } else {
      return {
        success: false,
        error:
          "Failed to fetch coordinates. Please try again or enter coordinates manually.",
      };
    }
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
  getStates,
  getClientStats,
  getStoreStats,
  createClient,
  updateClient,
  deleteClient,
  createStore,
  updateStore,
  deleteStore,
  getCoordinatesFromAddress,
};
