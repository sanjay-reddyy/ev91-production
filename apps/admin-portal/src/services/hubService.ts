import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configure axios instance for hubs (through API Gateway)
const hubApi = axios.create({
  baseURL: `${API_BASE_URL}/hubs`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure axios instance for cities (through API Gateway)
const cityApi = axios.create({
  baseURL: `${API_BASE_URL}/cities`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
hubApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.warn('No auth token found in localStorage when making hub API request');
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
hubApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || 'unknown endpoint';
    console.error(`Hub API Error (${requestUrl}):`, error);
    
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.warn(`Auth token exists but request to ${requestUrl} was unauthorized.`);
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

cityApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
}

export interface Hub {
  id: string;
  name: string;
  code: string;
  cityId: string;
  address: string;
  pinCode: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  hubType: string;
  hubCategory: string;
  vehicleCapacity: number | null;
  chargingPoints: number;
  serviceCapacity: number;
  operatingHours: string | null;
  is24x7: boolean;
  managerName: string | null;
  contactNumber: string | null;
  emailAddress: string | null;
  alternateContact: string | null;
  hasParking: boolean;
  hasSecurity: boolean;
  hasCCTV: boolean;
  hasWashFacility: boolean;
  hasChargingStation: boolean;
  hasServiceCenter: boolean;
  status: string;
  isPublicAccess: boolean;
  monthlyRent: number | null;
  setupCost: number | null;
  operationalCost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HubResponse {
  id: string;
  name: string;
  code: string;
  cityId: string;
  cityName: string;
  address: string;
  pinCode: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  hubType: string;
  hubCategory: string;
  vehicleCapacity: number | null;
  chargingPoints: number;
  serviceCapacity: number;
  operatingHours: string | null;
  is24x7: boolean;
  managerName: string | null;
  contactNumber: string | null;
  status: string;
  vehicleCount?: number;
  hasChargingStation: boolean;
  hasServiceCenter: boolean;
}

export interface CreateHubRequest {
  name: string;
  code: string;
  cityId: string;
  address: string;
  pinCode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  hubType?: string;
  hubCategory?: string;
  vehicleCapacity?: number;
  chargingPoints?: number;
  serviceCapacity?: number;
  operatingHours?: string;
  is24x7?: boolean;
  managerName?: string;
  contactNumber?: string;
  emailAddress?: string;
  alternateContact?: string;
  hasParking?: boolean;
  hasSecurity?: boolean;
  hasCCTV?: boolean;
  hasWashFacility?: boolean;
  hasChargingStation?: boolean;
  hasServiceCenter?: boolean;
  status?: string;
  isPublicAccess?: boolean;
  monthlyRent?: number;
  setupCost?: number;
  operationalCost?: number;
}

export interface UpdateHubRequest extends Partial<CreateHubRequest> {}

export interface HubFilters {
  cityId?: string;
  hubType?: string;
  hubCategory?: string;
  status?: string;
  hasChargingStation?: boolean;
  hasServiceCenter?: boolean;
  is24x7?: boolean;
  isPublicAccess?: boolean;
  search?: string;
}

// Hub Service Functions
export const hubService = {
  // Get all hubs with filters
  async getHubs(filters: HubFilters = {}): Promise<HubResponse[]> {
    try {
      const response = await hubApi.get('/', { params: filters });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching hubs:', error);
      throw error;
    }
  },

  // Get hub by ID
  async getHubById(id: string): Promise<Hub> {
    try {
      const response = await hubApi.get(`/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching hub:', error);
      throw error;
    }
  },

  // Create new hub
  async createHub(hubData: CreateHubRequest): Promise<Hub> {
    try {
      const response = await hubApi.post('/', hubData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating hub:', error);
      throw error;
    }
  },

  // Update hub
  async updateHub(id: string, hubData: UpdateHubRequest): Promise<Hub> {
    try {
      const response = await hubApi.put(`/${id}`, hubData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating hub:', error);
      throw error;
    }
  },

  // Delete hub
  async deleteHub(id: string): Promise<void> {
    try {
      await hubApi.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting hub:', error);
      throw error;
    }
  },

  // Get operational hubs
  async getOperationalHubs(cityId?: string): Promise<HubResponse[]> {
    try {
      const params = cityId ? { cityId } : {};
      const response = await hubApi.get('/operational', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching operational hubs:', error);
      throw error;
    }
  }
};

// City Service Functions
export const cityService = {
  // Get all cities
  async getCities(): Promise<City[]> {
    try {
      const response = await cityApi.get('/');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  // Get operational cities
  async getOperationalCities(): Promise<City[]> {
    try {
      const response = await cityApi.get('/operational');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching operational cities:', error);
      throw error;
    }
  },

  // Get city by ID
  async getCityById(id: string): Promise<City> {
    try {
      const response = await cityApi.get(`/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching city:', error);
      throw error;
    }
  }
};

export default hubService;
