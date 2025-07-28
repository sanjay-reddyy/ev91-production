import axios from 'axios';

const VEHICLE_SERVICE_URL = 'http://localhost:4003/api/v1';

// Configure axios instance
const vehicleApi = axios.create({
  baseURL: VEHICLE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
vehicleApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
vehicleApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Vehicle API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface OEM {
  id: string;
  name: string;
  displayName: string;
  code: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  isPreferred: boolean;
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  oemId: string;
  name: string;
  displayName: string;
  modelCode: string;
  category: string;
  segment: string;
  vehicleType: string;
  fuelType: string;
  engineCapacity?: string;
  batteryCapacity?: string;
  maxSpeed?: number;
  range?: number;
  chargingTime?: string;
  seatingCapacity: number;
  availableVariants?: string;
  availableColors?: string;
  basePrice?: number;
  serviceInterval?: number;
  warrantyPeriod?: number;
  isActive: boolean;
  isPopular: boolean;
  oem?: OEM;
}

export interface Vehicle {
  id: string;
  modelId: string;
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  variant?: string;
  color: string;
  year?: number;
  vehicleType?: string;
  batteryType?: string;
  batteryCapacity?: number;
  maxRange?: number;
  maxSpeed?: number;
  purchaseDate?: Date;
  registrationDate: Date;
  purchasePrice?: number;
  currentValue?: number;
  ageInMonths?: number;
  fleetOperatorId?: string;
  currentRiderId?: string;
  assignmentDate?: Date;
  operationalStatus: 'Available' | 'Assigned' | 'Under Maintenance' | 'Retired' | 'Damaged';
  serviceStatus: 'Active' | 'Inactive' | 'Scheduled for Service';
  location?: string;
  mileage: number;
  model?: VehicleModel;
  rcDetails?: {
    rcNumber: string;
    validUpto?: Date;
  };
  insuranceDetails?: Array<{
    policyNumber: string;
    policyEndDate: Date;
    providerName: string;
  }>;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  createdAt: Date;
  updatedAt: Date;
  mediaFiles?: MediaFile[];
  serviceHistory?: ServiceRecord[];
  damageRecords?: DamageRecord[];
}

export interface MediaFile {
  id: string;
  vehicleId: string;
  fileType: 'Vehicle Photo' | 'RC Document' | 'Insurance Document' | 'Service Photo' | 'Damage Photo' | 'Rider Upload';
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
  uploadedBy: string;
  tags?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: 'Preventive' | 'Corrective' | 'Emergency';
  serviceDate: Date;
  description: string;
  issueReported?: string;
  workPerformed?: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  serviceStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  partsReplaced?: string;
  nextServiceDue?: Date;
  mileageAtService?: number;
  serviceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  mediaFiles?: MediaFile[];
}

export interface DamageRecord {
  id: string;
  vehicleId: string;
  damageType: 'Cosmetic' | 'Mechanical' | 'Electrical' | 'Structural';
  severity: 'Minor' | 'Moderate' | 'Major';
  location: string;
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  reportedDate: Date;
  reportedBy: string;
  resolvedDate?: Date;
  resolutionNotes?: string;
  damageStatus: 'Reported' | 'Under Review' | 'Approved for Repair' | 'In Repair' | 'Resolved' | 'Rejected';
  assignedTechnician?: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  mediaFiles?: MediaFile[];
}

export interface VehicleStats {
  totalVehicles: number;
  vehiclesByStatus: Record<string, number>;
  vehiclesByServiceStatus: Record<string, number>;
  topModels: Array<{
    modelId: string;
    count: number;
    modelName: string;
    oemName: string;
  }>;
  ageDistribution: {
    new: number;
    moderate: number;
    old: number;
    vintage: number;
  };
  mileageStats: {
    average: number;
    maximum: number;
    minimum: number;
  };
}

export interface VehicleFilters {
  oemType?: string;
  vehicleModel?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  location?: string;
  minMileage?: number;
  maxMileage?: number;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Functions
export const vehicleService = {
  // Vehicle CRUD operations
  async getVehicles(filters: VehicleFilters = {}, pagination: PaginationParams = {}) {
    const params = { ...filters, ...pagination };
    const response = await vehicleApi.get('/vehicles', { params });
    return response.data;
  },

  async getVehicle(id: string) {
    const response = await vehicleApi.get(`/vehicles/${id}`);
    return response.data;
  },

  async createVehicle(vehicleData: Partial<Vehicle>) {
    const response = await vehicleApi.post('/vehicles', vehicleData);
    return response.data;
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>) {
    const response = await vehicleApi.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  async deleteVehicle(id: string) {
    const response = await vehicleApi.delete(`/vehicles/${id}`);
    return response.data;
  },

  async updateVehicleStatus(id: string, status: string, reason?: string) {
    const response = await vehicleApi.patch(`/vehicles/${id}/status`, { status, reason });
    return response.data;
  },

  // Service operations
  async getServiceRecords(filters: any = {}, pagination: PaginationParams = {}) {
    const params = { ...filters, ...pagination };
    const response = await vehicleApi.get('/service', { params });
    return response.data;
  },

  async getServiceRecord(id: string) {
    const response = await vehicleApi.get(`/service/${id}`);
    return response.data;
  },

  async createServiceRecord(serviceData: Partial<ServiceRecord>) {
    const response = await vehicleApi.post('/service', serviceData);
    return response.data;
  },

  async updateServiceRecord(id: string, serviceData: Partial<ServiceRecord>) {
    const response = await vehicleApi.put(`/service/${id}`, serviceData);
    return response.data;
  },

  async scheduleService(serviceData: any) {
    const response = await vehicleApi.post('/service/schedule', serviceData);
    return response.data;
  },

  async getUpcomingServices(days: number = 30) {
    const response = await vehicleApi.get(`/service/upcoming?days=${days}`);
    return response.data;
  },

  async getServiceAnalytics(period: string = 'month') {
    const response = await vehicleApi.get(`/service/analytics?period=${period}`);
    return response.data;
  },

  // Damage operations
  async getDamageRecords(filters: any = {}, pagination: PaginationParams = {}) {
    const params = { ...filters, ...pagination };
    const response = await vehicleApi.get('/damage', { params });
    return response.data;
  },

  async getDamageRecord(id: string) {
    const response = await vehicleApi.get(`/damage/${id}`);
    return response.data;
  },

  async createDamageRecord(damageData: Partial<DamageRecord>) {
    const response = await vehicleApi.post('/damage', damageData);
    return response.data;
  },

  async updateDamageRecord(id: string, damageData: Partial<DamageRecord>) {
    const response = await vehicleApi.put(`/damage/${id}`, damageData);
    return response.data;
  },

  async updateDamageStatus(id: string, status: string, notes?: string) {
    const response = await vehicleApi.patch(`/damage/${id}/status`, { status, notes });
    return response.data;
  },

  // Media operations
  async uploadMedia(vehicleId: string, files: FileList, fileType: string, tags?: string) {
    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('fileType', fileType);
    if (tags) formData.append('tags', tags);
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const response = await vehicleApi.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMediaFiles(vehicleId: string, fileType?: string) {
    const params = fileType ? { fileType } : {};
    const response = await vehicleApi.get(`/media/vehicle/${vehicleId}`, { params });
    return response.data;
  },

  async deleteMedia(id: string) {
    const response = await vehicleApi.delete(`/media/${id}`);
    return response.data;
  },

  // Analytics and stats
  async getVehicleStats() {
    const response = await vehicleApi.get('/vehicles/stats');
    return response.data;
  },

  async getVehicleAnalytics(period: string = 'month') {
    const response = await vehicleApi.get(`/vehicles/analytics?period=${period}`);
    return response.data;
  },

  // OEM operations
  async getOEMs(filters: { active?: boolean; preferred?: boolean } = {}) {
    const response = await vehicleApi.get('/oems', { params: filters });
    return response.data;
  },

  async getOEM(id: string) {
    const response = await vehicleApi.get(`/oems/${id}`);
    return response.data;
  },

  async createOEM(oemData: Partial<OEM>) {
    const response = await vehicleApi.post('/oems', oemData);
    return response.data;
  },

  async updateOEM(id: string, oemData: Partial<OEM>) {
    const response = await vehicleApi.put(`/oems/${id}`, oemData);
    return response.data;
  },

  async deleteOEM(id: string, hard: boolean = false) {
    const response = await vehicleApi.delete(`/oems/${id}`, { params: { hard } });
    return response.data;
  },

  async getOEMStats() {
    const response = await vehicleApi.get('/oems/stats');
    return response.data;
  },

  // Vehicle Model operations
  async getVehicleModels(filters: { oemId?: string; active?: boolean; popular?: boolean; category?: string; segment?: string } = {}) {
    const response = await vehicleApi.get('/vehicle-models', { params: filters });
    return response.data;
  },

  async getVehicleModelsByOEM(oemId: string, filters: { active?: boolean; popular?: boolean } = {}) {
    const response = await vehicleApi.get(`/vehicle-models/oem/${oemId}`, { params: filters });
    return response.data;
  },

  async getVehicleModel(id: string) {
    const response = await vehicleApi.get(`/vehicle-models/${id}`);
    return response.data;
  },

  async getVehicleModelSpecs(id: string) {
    const response = await vehicleApi.get(`/vehicle-models/${id}/specs`);
    return response.data;
  },

  async createVehicleModel(modelData: Partial<VehicleModel>) {
    const response = await vehicleApi.post('/vehicle-models', modelData);
    return response.data;
  },

  async updateVehicleModel(id: string, modelData: Partial<VehicleModel>) {
    const response = await vehicleApi.put(`/vehicle-models/${id}`, modelData);
    return response.data;
  },

  async deleteVehicleModel(id: string, hard: boolean = false) {
    const response = await vehicleApi.delete(`/vehicle-models/${id}`, { params: { hard } });
    return response.data;
  },

  async getModelMetadata() {
    const response = await vehicleApi.get('/vehicle-models/metadata');
    return response.data;
  },
};

export default vehicleService;
