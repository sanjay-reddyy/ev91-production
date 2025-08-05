/**
 * Hub Related Types and Interfaces
 * For EV91 Platform - Vehicle Service
 */

import { City } from './city';

// Base Hub interface
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
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Hub with city details
export interface HubWithCity extends Hub {
  city: City;
}

// Hub creation interface
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
  createdBy?: string;
}

// Hub update interface
export interface UpdateHubRequest {
  name?: string;
  code?: string;
  cityId?: string;
  address?: string;
  pinCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
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
  updatedBy?: string;
}

// Hub with vehicle count
export interface HubWithVehicleCount extends Hub {
  vehicleCount: number;
  availableVehicles: number;
  assignedVehicles: number;
  maintenanceVehicles: number;
}

// Hub response for API
export interface HubResponse {
  id: string;
  name: string;
  code: string;
  cityId: string;
  cityName: string;
  address: string;
  pinCode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  hubType: string;
  hubCategory: string;
  vehicleCapacity?: number;
  chargingPoints: number;
  serviceCapacity: number;
  operatingHours?: string;
  is24x7: boolean;
  managerName?: string;
  contactNumber?: string;
  status: string;
  vehicleCount?: number;
  availableVehicles?: number;
  hasChargingStation: boolean;
  hasServiceCenter: boolean;
}

// Hub filters for listing
export interface HubFilters {
  cityId?: string;
  hubType?: string;
  hubCategory?: string;
  status?: string;
  hasChargingStation?: boolean;
  hasServiceCenter?: boolean;
  is24x7?: boolean;
  isPublicAccess?: boolean;
  search?: string; // Search by hubName, hubCode, or address
  nearLocation?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

// Hub assignment interface
export interface HubAssignmentRequest {
  vehicleId: string;
  hubId: string;
  assignedBy: string;
  notes?: string;
}

// Operating hours interface
export interface OperatingHours {
  monday: { open: string; close: string; isClosed: boolean };
  tuesday: { open: string; close: string; isClosed: boolean };
  wednesday: { open: string; close: string; isClosed: boolean };
  thursday: { open: string; close: string; isClosed: boolean };
  friday: { open: string; close: string; isClosed: boolean };
  saturday: { open: string; close: string; isClosed: boolean };
  sunday: { open: string; close: string; isClosed: boolean };
}

// Hub enums
export enum HubType {
  STORAGE = 'Storage',
  SERVICE = 'Service',
  CHARGING = 'Charging',
  MIXED = 'Mixed'
}

export enum HubCategory {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  SERVICE_POINT = 'Service Point'
}

export enum HubStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  UNDER_CONSTRUCTION = 'Under Construction',
  MAINTENANCE = 'Maintenance'
}

// Hub statistics interface
export interface HubStatistics {
  totalHubs: number;
  activeHubs: number;
  inactiveHubs: number;
  totalVehicleCapacity: number;
  totalChargingPoints: number;
  averageUtilization: number;
  hubsByType: Record<HubType, number>;
  hubsByCategory: Record<HubCategory, number>;
}
