import { QueryParams } from './common';

// OEM (Original Equipment Manufacturer) types
export interface OEM {
  id: string;
  name: string;
  country: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOEMData {
  name: string;
  country: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface UpdateOEMData {
  name?: string;
  country?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface OEMQueryParams extends QueryParams {
  country?: string;
  isActive?: boolean;
}

// Vehicle Model types
export interface VehicleModel {
  id: string;
  oemId: string;
  name: string;
  type: VehicleType;
  year: number;
  engineSize?: string;
  fuelType: string;
  transmission?: string;
  seatingCapacity?: number;
  description?: string;
  specifications?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  oem?: OEM;
}

export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  HATCHBACK = 'HATCHBACK',
  COUPE = 'COUPE',
  CONVERTIBLE = 'CONVERTIBLE',
  WAGON = 'WAGON',
  PICKUP = 'PICKUP',
  VAN = 'VAN',
  TRUCK = 'TRUCK'
}

export interface CreateVehicleModelData {
  oemId: string;
  name: string;
  type: VehicleType;
  year: number;
  engineSize?: string;
  fuelType: string;
  transmission?: string;
  seatingCapacity?: number;
  description?: string;
  specifications?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateVehicleModelData {
  oemId?: string;
  name?: string;
  type?: VehicleType;
  year?: number;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  description?: string;
  specifications?: Record<string, any>;
  isActive?: boolean;
}

export interface VehicleModelQueryParams extends QueryParams {
  oemId?: string;
  type?: VehicleType;
  year?: number;
  fuelType?: string;
  isActive?: boolean;
}
