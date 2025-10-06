// Common types used across the vehicle service
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  pagination?: PaginationInfo;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Vehicle-specific query params
  oemId?: string;
  modelId?: string;
  hubId?: string;
  operationalStatus?: string;
  serviceStatus?: string;
  assignedRider?: string;
  fleetOperatorId?: string;
  location?: string;
  minAge?: number;
  maxAge?: number;
  // Additional vehicle filter params
  minMileage?: number;
  maxMileage?: number;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  // Service-specific query params
  vehicleId?: string;
  serviceType?: string;
  mechanicName?: string;
  serviceCenter?: string;
  startDate?: string | Date;
  endDate?: string | Date;

  // Additional frontend mapping parameters
  oemType?: string; // Maps to oemId
  oem?: string; // Also maps to oemId (alternative parameter name)
  status?: string; // Maps to operationalStatus
  currentRiderId?: string; // Maps to assignedRider
  year?: string | number; // Filter by specific manufacturing year
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}
