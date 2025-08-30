import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_VEHICLE_API_URL || 'http://localhost:8000/api/vehicles';

export interface OEM {
  id: string;
  name: string;
  displayName: string;
  code: string;
  
  // OEM Details
  country?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  
  // Business Information
  gstin?: string;
  panNumber?: string;
  registeredAddress?: string;
  
  // Brand Information
  logoUrl?: string;
  brandColor?: string;
  description?: string;
  
  // Status
  isActive: boolean;
  isPreferred: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relationships
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  oemId: string;
  name: string;
  modelCode: string;
  
  // Technical Specifications
  vehicleType?: string;
  batteryType?: string;
  batteryCapacity?: number;
  maxRange?: number;
  maxSpeed?: number;
  
  // Physical Specifications
  weight?: number;
  dimensions?: string;
  seatingCapacity?: number;
  cargoCapacity?: number;
  
  // Variants and Options
  availableVariants?: string;
  availableColors?: string;
  standardFeatures?: string;
  optionalFeatures?: string;
  
  // Pricing Information
  basePrice?: number;
  priceRange?: string;
  
  // Service Information
  serviceInterval?: number;
  warrantyPeriod?: number;
  spareParts?: string;
  
  // Media
  imageUrl?: string;
  brochureUrl?: string;
  
  // Status
  isActive: boolean;
  isPopular: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relationships
  oem?: OEM;
}

export interface CreateOEMRequest {
  name: string;
  displayName: string;
  code: string;
  country?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  gstin?: string;
  panNumber?: string;
  registeredAddress?: string;
  logoUrl?: string;
  brandColor?: string;
  description?: string;
  isActive?: boolean;
  isPreferred?: boolean;
}

export interface UpdateOEMRequest extends Partial<CreateOEMRequest> {}

export interface OEMStats {
  totalOEMs: number;
  activeOEMs: number;
  preferredOEMs: number;
  totalModels: number;
  totalVehicles: number;
}

class OEMService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Get all OEMs
  async getAllOEMs(params?: {
    isActive?: boolean;
    isPreferred?: boolean;
    country?: string;
    search?: string;
  }) {
    const response = await this.apiClient.get<{ data: OEM[] }>('/oems', { params });
    return response.data;
  }

  // Get OEM by ID
  async getOEMById(id: string) {
    const response = await this.apiClient.get<{ data: OEM }>(`/oems/${id}`);
    return response.data;
  }

  // Create new OEM
  async createOEM(data: CreateOEMRequest) {
    const response = await this.apiClient.post<{ data: OEM }>('/oems', data);
    return response.data;
  }

  // Update OEM
  async updateOEM(id: string, data: UpdateOEMRequest) {
    const response = await this.apiClient.put<{ data: OEM }>(`/oems/${id}`, data);
    return response.data;
  }

  // Delete OEM
  async deleteOEM(id: string) {
    const response = await this.apiClient.delete<{ message: string }>(`/oems/${id}`);
    return response.data;
  }

  // Get OEM statistics
  async getOEMStats() {
    const response = await this.apiClient.get<{ data: OEMStats }>('/oems/stats');
    return response.data;
  }

  // Get models for an OEM
  async getOEMModels(oemId: string) {
    const response = await this.apiClient.get<{ data: VehicleModel[] }>(`/oems/${oemId}/models`);
    return response.data;
  }
}

export const oemService = new OEMService();
