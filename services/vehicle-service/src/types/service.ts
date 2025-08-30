import { QueryParams } from './common';

// Service record types
export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  serviceDate: Date;
  description: string;
  issueReported?: string;
  workPerformed: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  partsReplaced?: string; // JSON string in database
  nextServiceDue?: Date;
  mileageAtService?: number;
  serviceNotes?: string;
  serviceStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceType {
  PREVENTIVE = 'Preventive',
  CORRECTIVE = 'Corrective',
  EMERGENCY = 'Emergency'
}

export interface PartsReplaced {
  partName: string;
  partNumber?: string;
  quantity: number;
  cost: number;
}

export interface CreateServiceData {
  vehicleId: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  issueReported?: string;
  workPerformed?: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  partsReplaced?: PartsReplaced[];
  nextServiceDue?: string;
  mileageAtService?: number;
  serviceNotes?: string;
  serviceStatus?: string;
  // Additional fields for scheduling
  scheduledDate?: string;
  estimatedCost?: number;
}

export interface UpdateServiceData {
  serviceType?: string;
  serviceDate?: string;
  description?: string;
  issueReported?: string;
  workPerformed?: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  partsReplaced?: PartsReplaced[];
  nextServiceDue?: string;
  mileageAtService?: number;
  serviceNotes?: string;
  serviceStatus?: string;
}

// Export aliases for compatibility
export type ServiceRecordCreateData = CreateServiceData;
export type ServiceRecordUpdateData = UpdateServiceData;

export interface ServiceRecordResponse extends ServiceRecord {
  vehicle?: {
    id: string;
    registrationNumber: string;
    model?: {
      name: string;
      oem?: {
        name: string;
      };
    };
    operationalStatus?: string;
    mileage?: number;
  };
  mediaFiles?: any[];
}

export interface ServiceQueryParams extends QueryParams {
  vehicleId?: string;
  serviceType?: string;
  serviceStatus?: string;
  mechanicName?: string;
  serviceCenter?: string;
  startDate?: string;
  endDate?: string;
}

export interface ScheduledService {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  scheduledDate: Date;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledServiceData {
  vehicleId: string;
  serviceType: ServiceType;
  scheduledDate: string;
  description: string;
}

export interface ServiceAnalytics {
  totalServices: number;
  preventiveServices: number;
  correctiveServices: number;
  emergencyServices: number;
  totalCost: number;
  averageCost: number;
  servicesByMonth: Record<string, number>;
  costByMonth: Record<string, number>;
  topServiceCenters: Array<{
    name: string;
    count: number;
    totalCost: number;
  }>;
}
