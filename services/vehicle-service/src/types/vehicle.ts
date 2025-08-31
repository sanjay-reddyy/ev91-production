import { QueryParams } from "./common";
import { Hub } from "./hub";

// Vehicle related types based on actual Prisma schema
export interface Vehicle {
  id: string;
  modelId: string;
  hubId: string; // Mandatory hub assignment
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
  operationalStatus: string;
  serviceStatus: string;
  location?: string;
  mileage: number;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle with hub details for rider assignment
export interface VehicleWithHub extends Vehicle {
  hub: Hub;
}

// Vehicle response for API with hub information (for mobile app/rider)
export interface VehicleWithHubInfo {
  id: string;
  modelId: string;
  hubId: string;
  hubName: string;
  hubAddress: string;
  cityName: string;
  registrationNumber: string;
  color: string;
  operationalStatus: string;
  serviceStatus: string;
  mileage: number;
  batteryCapacity?: number;
  maxRange?: number;
}

export enum VehicleStatus {
  AVAILABLE = "Available",
  ASSIGNED = "Assigned",
  UNDER_MAINTENANCE = "Under Maintenance",
  RETIRED = "Retired",
  DAMAGED = "Damaged",
}

export enum ServiceStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  SCHEDULED_FOR_SERVICE = "Scheduled for Service",
}

export interface VehicleCreateData {
  modelId: string;
  hubId: string; // Mandatory hub assignment
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  variant?: string;
  color: string;
  year?: number;
  vehicleType?: string;
  batteryType?: string;
  batteryCapacity?: number | string;
  maxRange?: number;
  maxSpeed?: number;
  purchaseDate?: string | Date;
  registrationDate?: string | Date;
  purchasePrice?: number;
  currentValue?: number;
  fleetOperatorId?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  location?: string;
  mileage?: number;
  // RC Details
  rcNumber?: string;
  rcExpiryDate?: string | Date;
  ownerName?: string;
  ownerAddress?: string;
  seatingCapacity?: number;
  // Insurance Details
  insuranceNumber?: string;
  insuranceProvider?: string;
  insuranceExpiryDate?: string | Date;
  insuranceType?: string;
  premiumAmount?: number;
  coverageAmount?: number;
}

export interface VehicleUpdateData {
  modelId?: string;
  hubId?: string; // Allow hub reassignment
  registrationNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  variant?: string;
  color?: string;
  year?: number;
  vehicleType?: string;
  batteryType?: string;
  batteryCapacity?: number;
  maxRange?: number;
  maxSpeed?: number;
  purchaseDate?: string | Date;
  registrationDate?: string | Date;
  purchasePrice?: number;
  currentValue?: number;
  ageInMonths?: number;
  fleetOperatorId?: string;
  currentRiderId?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  location?: string;
  mileage?: number;
}

export interface VehicleResponse extends Vehicle {
  // Hub information for complete vehicle response
  hub?: {
    id: string;
    hubName: string;
    hubCode: string;
    address: string;
    city: {
      id: string;
      name: string;
      displayName: string;
    };
  };
  // Model information
  model?: {
    id: string;
    name: string;
    oem?: {
      id: string;
      name: string;
    };
  };
  rcDetails?: any;
  insuranceDetails?: any;
  statusHistory?: any[];
  damages?: any[];
  serviceRecords?: any[];
}

export interface VehicleQueryParams extends QueryParams {
  oemId?: string;
  modelId?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  assignedRider?: string;
  fleetOperatorId?: string;
  location?: string;
  minAge?: number;
  maxAge?: number;
}

export interface VehicleAnalytics {
  totalVehicles: number;
  availableVehicles: number;
  assignedVehicles: number;
  maintenanceVehicles: number;
  averageAge: number;
  totalValue: number;
  statusDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
}
