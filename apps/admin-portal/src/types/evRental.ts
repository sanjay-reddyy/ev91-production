/**
 * EV Rental Type Definitions
 *
 * These types match the backend schema from:
 * - services/rider-service/prisma/schema.prisma
 * - services/vehicle-service/prisma/schema.prisma
 */

// ============================================
// Enums
// ============================================

export enum RiderVehiclePreference {
  NEED_EV_RENTAL = "NEED_EV_RENTAL",
  OWN_VEHICLE = "OWN_VEHICLE",
  RENTED_VEHICLE = "RENTED_VEHICLE",
  CYCLE = "CYCLE",
  WALK = "WALK",
}

// Deprecated: Use RiderVehiclePreference instead
export enum OwnVehicleType {
  OWN_VEHICLE = "OWN_VEHICLE",
  RENTED_VEHICLE = "RENTED_VEHICLE", // Rented EV from other provider
  CYCLE = "CYCLE",
  WALK = "WALK",
}

export enum VehicleRentalStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  TERMINATED = "TERMINATED",
}

export enum RentalPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  WAIVED = "WAIVED",
}

export enum RentalCategory {
  ELECTRIC_SCOOTER = "ELECTRIC_SCOOTER",
  ELECTRIC_BIKE = "ELECTRIC_BIKE",
  ELECTRIC_CARGO = "ELECTRIC_CARGO",
}

// ============================================
// Vehicle Model Types (from Vehicle Service)
// ============================================

export interface VehicleModel {
  id: string;
  modelName: string;
  manufacturer: string;
  year: number;
  category: string;
  specifications: {
    batteryCapacity?: string;
    range?: string;
    chargingTime?: string;
    topSpeed?: string;
    motor?: string;
    [key: string]: any;
  };

  // EV Rental Fields
  isAvailableForRent: boolean;
  baseRentalCost: number;
  rentalCategory: RentalCategory | null;
  rentalDescription: string | null;
  minimumRentalPeriod: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface AvailableRentalModelsResponse {
  success: boolean;
  data: {
    models: VehicleModel[];
    totalCount: number;
  };
  message: string;
}

export interface RentalCostCalculation {
  modelId: string;
  modelName: string;
  baseRentalCost: number;
  vehicleAge: number;
  depreciationPercentage: number;
  actualMonthlyCost: number;
  savings: number;
}

export interface RentalCostResponse {
  success: boolean;
  data: RentalCostCalculation;
  message: string;
}

export interface AvailableVehicle {
  vehicleId: string;
  registrationNumber: string;
  vehicleAge: number;
  condition: string;
  hub: {
    hubId: string;
    hubName: string;
    city: string;
  };
}

export interface AvailableVehiclesResponse {
  success: boolean;
  data: {
    modelId: string;
    modelName: string;
    vehicles: AvailableVehicle[];
    totalAvailable: number;
  };
  message: string;
}

// ============================================
// Rider Rental Types (from Rider Service)
// ============================================

export interface RiderVehicleRental {
  id: string;
  riderId: string;
  vehicleId: string;
  vehicleModelId: string;

  // Vehicle details (fetched from Vehicle Service)
  vehicleModel?: VehicleModel;
  vehicleRegistrationNumber?: string;
  vehicleAge?: number;

  monthlyRentalCost: number;
  securityDeposit: number;
  startDate: string;
  endDate: string | null;
  status: VehicleRentalStatus;

  hubId: string;
  hubName: string;
  cityId: string;
  cityName: string;

  totalAmountPaid: number;
  outstandingBalance: number;

  rentalAgreementUrl: string | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface RiderRentalPayment {
  id: string;
  rentalId: string;
  riderId: string;

  paymentMonth: string; // Format: "YYYY-MM"
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: RentalPaymentStatus;

  paidDate: string | null;
  paymentMethod: string | null;
  transactionReference: string | null;

  deductedFromEarnings: boolean;
  earningsDeductionDate: string | null;

  lateFee: number;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface RentalWithPayments extends RiderVehicleRental {
  payments: RiderRentalPayment[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateRentalRequest {
  vehicleId: string;
  vehicleModelId: string;
  monthlyRentalCost: number;
  securityDeposit: number;
  startDate: string;
  hubId: string;
  hubName: string;
  cityId: string;
  cityName: string;
  notes?: string;
}

export interface UpdateRentalRequest {
  status?: VehicleRentalStatus;
  endDate?: string;
  notes?: string;
  monthlyRentalCost?: number;
}

export interface UpdateVehiclePreferenceRequest {
  needsEvRental: boolean;
  preferredVehicleModelId: string | null;
  vehiclePreference: string | null;
}

export interface UpdatePaymentRequest {
  status: RentalPaymentStatus;
  amountPaid: number;
  paidDate: string;
  paymentMethod: string;
  transactionReference?: string;
  deductedFromEarnings?: boolean;
  notes?: string;
}

export interface RentalHistoryResponse {
  success: boolean;
  data: {
    rentals: RiderVehicleRental[];
    totalCount: number;
  };
  message: string;
}

export interface RentalPaymentsResponse {
  success: boolean;
  data: {
    payments: RiderRentalPayment[];
    summary: {
      totalDue: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
      overdueCount: number;
    };
  };
  message: string;
}

export interface CurrentRentalResponse {
  success: boolean;
  data: {
    rental: RentalWithPayments | null;
  };
  message: string;
}

export interface CostCalculatorResponse {
  success: boolean;
  data: {
    modelId: string;
    modelName: string;
    baseRentalCost: number;
    vehicleAge: number;
    monthlyRentalCost: number;
    depreciationPercentage: number;
    savings: number;
    totalFor12Months: number;
    securityDepositRecommendation: number;
  };
  message: string;
}

// ============================================
// UI Component Props Types
// ============================================

export interface VehicleModelCardProps {
  model: VehicleModel;
  selected?: boolean;
  onSelect?: (model: VehicleModel) => void;
  showRentalInfo?: boolean;
  showActions?: boolean;
}

export interface VehiclePreferenceSelectorProps {
  riderId: string;
  currentPreference?: RiderVehiclePreference;
  currentModelId?: string;
  onPreferenceSelected: (
    preference: RiderVehiclePreference,
    modelId: string
  ) => void;
  disabled?: boolean;
}

export interface RentalAssignmentDialogProps {
  open: boolean;
  riderId: string;
  riderName: string;
  preferredModelId?: string;
  onClose: () => void;
  onRentalCreated: (rental: RiderVehicleRental) => void;
}

export interface RentalPaymentTabProps {
  riderId: string;
  rental: RentalWithPayments;
  onPaymentUpdated: () => void;
}

export interface VehicleModelListProps {
  category?: RentalCategory;
  onModelSelect?: (model: VehicleModel) => void;
  showOnlyAvailable?: boolean;
}

// ============================================
// Filter & Sort Types
// ============================================

export interface RentalFilters {
  status?: VehicleRentalStatus;
  category?: RentalCategory;
  hubId?: string;
  cityId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
}

export interface PaymentFilters {
  status?: RentalPaymentStatus;
  monthFrom?: string;
  monthTo?: string;
  overdue?: boolean;
}

export type RentalSortField =
  | "startDate"
  | "monthlyRentalCost"
  | "status"
  | "updatedAt";
export type PaymentSortField =
  | "dueDate"
  | "amountDue"
  | "status"
  | "paymentMonth";
export type SortOrder = "asc" | "desc";
