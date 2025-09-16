/**
 * City Related Types and Interfaces
 * For EV91 Platform - Vehicle Service
 */

// Base City interface
export interface City {
  id: string;
  name: string;
  displayName: string;
  code: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  pinCodeRange: string | null;
  regionCode: string | null;
  isActive: boolean;
  isOperational: boolean;
  launchDate: Date | null;
  estimatedPopulation: number | null;
  marketPotential: number | null;
  // Event Sourcing Fields
  version: number;
  lastModifiedBy: string | null;
  eventSequence: number;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// City creation interface
export interface CreateCityRequest {
  name: string;
  displayName: string;
  code: string;
  state: string;
  country?: string;
  timezone?: string;
  latitude: number;
  longitude: number;
  pinCodeRange?: string;
  regionCode?: string;
  isActive?: boolean;
  isOperational?: boolean;
  launchDate?: Date;
  estimatedPopulation?: number;
  marketPotential?: number;
}

// City update interface
export interface UpdateCityRequest {
  name?: string;
  displayName?: string;
  code?: string;
  state?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  pinCodeRange?: string;
  regionCode?: string;
  isActive?: boolean;
  isOperational?: boolean;
  launchDate?: Date;
  estimatedPopulation?: number;
  marketPotential?: number;
}

// City with Hub count
export interface CityWithHubCount extends City {
  hubCount: number;
  activeHubCount: number;
  totalVehicles: number;
}

// City response for API
export interface CityResponse {
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
  hubCount?: number;
  vehicleCount?: number;
}

// City filters for listing
export interface CityFilters {
  isActive?: boolean;
  isOperational?: boolean;
  state?: string;
  regionCode?: string;
  marketPotential?: number;
  search?: string; // Search by name, displayName, or code
}

// City enums
export enum CityRegion {
  NORTH = "North",
  SOUTH = "South",
  EAST = "East",
  WEST = "West",
  CENTRAL = "Central",
  NORTHEAST = "Northeast",
}
