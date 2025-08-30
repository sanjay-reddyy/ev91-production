import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_VEHICLE_API_URL || 'http://localhost:8000/api/vehicles';

export interface VehicleModel {
  id: string;
  oemId: string;
  name: string;
  displayName: string;
  modelCode: string;
  category: string;
  segment: string;
  fuelType: string;
  
  // Technical Specifications
  vehicleType?: string;
  batteryCapacity?: string;
  range?: number;
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
  oem?: {
    id: string;
    name: string;
    code: string;
    logoUrl?: string;
  };
}

export interface CreateVehicleModelRequest {
  oemId: string;
  name: string;
  displayName: string;
  modelCode: string;
  category: string;
  segment: string;
  fuelType: string;
  vehicleType?: string;
  batteryCapacity?: string;
  range?: number;
  maxSpeed?: number;
  weight?: number;
  dimensions?: string;
  seatingCapacity?: number;
  cargoCapacity?: number;
  availableVariants?: string;
  availableColors?: string;
  standardFeatures?: string;
  optionalFeatures?: string;
  basePrice?: number;
  priceRange?: string;
  serviceInterval?: number;
  warrantyPeriod?: number;
  spareParts?: string;
  imageUrl?: string;
  brochureUrl?: string;
  isActive?: boolean;
  isPopular?: boolean;
}

export interface UpdateVehicleModelRequest extends Partial<CreateVehicleModelRequest> {}

export interface VehicleModelStats {
  totalModels: number;
  activeModels: number;
  popularModels: number;
  totalVehicles: number;
  averagePrice: number;
}

class VehicleModelService {
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

  // Get all vehicle models
  async getAllVehicleModels(params?: {
    oemId?: string;
    isActive?: boolean;
    isPopular?: boolean;
    vehicleType?: string;
    search?: string;
  }) {
    const response = await this.apiClient.get<{ data: VehicleModel[] }>('/vehicle-models', { params });
    return response.data;
  }

  // Get vehicle model by ID
  async getVehicleModelById(id: string) {
    const response = await this.apiClient.get<{ data: VehicleModel }>(`/vehicle-models/${id}`);
    return response.data;
  }

  // Create new vehicle model
  async createVehicleModel(data: CreateVehicleModelRequest) {
    const response = await this.apiClient.post<{ data: VehicleModel }>('/vehicle-models', data);
    return response.data;
  }

  // Update vehicle model
  async updateVehicleModel(id: string, data: UpdateVehicleModelRequest) {
    const response = await this.apiClient.put<{ data: VehicleModel }>(`/vehicle-models/${id}`, data);
    return response.data;
  }

  // Delete vehicle model
  async deleteVehicleModel(id: string) {
    const response = await this.apiClient.delete<{ message: string }>(`/vehicle-models/${id}`);
    return response.data;
  }

  // Get vehicle model statistics
  async getVehicleModelStats() {
    const response = await this.apiClient.get<{ data: VehicleModelStats }>('/vehicle-models/stats');
    return response.data;
  }

  // Get models by OEM
  async getModelsByOEM(oemId: string) {
    const response = await this.apiClient.get<{ data: VehicleModel[] }>(`/vehicle-models?oemId=${oemId}`);
    return response.data;
  }
}

export const vehicleModelService = new VehicleModelService();
