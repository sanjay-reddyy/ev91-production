/**
 * Client Store Types
 * For EV91 Platform - Admin Portal
 */

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Account Manager interface
export interface AccountManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// City and Location types
export interface City {
  id?: string;
  name: string;
  state: string;
  isActive?: boolean;
  count?: number;
}

export interface LocationInfo {
  city: string;
  state: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
}

// Client related types
export interface Client extends BaseEntity {
  clientCode: string;
  clientType: string;
  name: string;
  primaryContactPerson?: string;
  designation?: string;
  email?: string;
  secondaryEmail?: string;
  phone?: string;
  secondaryPhone?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  registrationNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  industrySector?: string;
  businessCategory?: string;
  evPortfolio?: string;
  fleetSize?: number;
  hasChargingInfra?: boolean;
  chargingInfraDetails?: string;
  batteryTechPreference?: string;
  serviceRequirements?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  taxCategory?: string;
  discountCategory?: string;
  baseOrderRate?: number;
  rateEffectiveDate?: string;
  rateType?: string;
  minimumRate?: number;
  maximumRate?: number;
  bulkBonusEnabled?: boolean;
  bulkOrdersThreshold?: number;
  bulkBonusAmount?: number;
  bulkResetPeriod?: string;
  weeklyBonusEnabled?: boolean;
  weeklyOrderTarget?: number;
  weeklyBonusAmount?: number;
  performanceMultiplierEnabled?: boolean;
  topPerformerRate?: number;
  performanceCriteria?: string;
  paymentCycle?: string;
  paymentMethods?: string;
  minimumPayout?: number;
  payoutDay?: string;
  clientStatus: string;
  acquisitionDate?: string;
  accountManagerId?: string;
  accountManager?: AccountManager;
  clientPriority?: string;
  relationshipType?: string;
  // Computed fields
  storeCount?: number;
  totalOrders?: number;
}

export interface ClientFormData {
  clientCode: string;
  clientType: string;
  name: string;
  primaryContactPerson?: string;
  designation?: string;
  email?: string;
  secondaryEmail?: string;
  phone?: string;
  secondaryPhone?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  registrationNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  industrySector?: string;
  businessCategory?: string;
  evPortfolio?: string;
  fleetSize?: number;
  hasChargingInfra?: boolean;
  chargingInfraDetails?: string;
  batteryTechPreference?: string;
  serviceRequirements?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  taxCategory?: string;
  discountCategory?: string;
  baseOrderRate?: number;
  rateEffectiveDate?: Date | string;
  rateType?: string;
  minimumRate?: number;
  maximumRate?: number;
  bulkBonusEnabled?: boolean;
  bulkOrdersThreshold?: number;
  bulkBonusAmount?: number;
  bulkResetPeriod?: string;
  weeklyBonusEnabled?: boolean;
  weeklyOrderTarget?: number;
  weeklyBonusAmount?: number;
  performanceMultiplierEnabled?: boolean;
  topPerformerRate?: number;
  performanceCriteria?: string;
  paymentCycle?: string;
  paymentMethods?: string;
  minimumPayout?: number;
  payoutDay?: string;
  clientStatus: string;
  acquisitionDate?: Date | string;
  accountManagerId?: string;
  clientPriority?: string;
  relationshipType?: string;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalStores: number;
  activeStores: number;
  citiesServed: number;
  clientsByType: Record<string, number>;
  clientsByCity: Record<string, number>;
  clientsByStatus: Record<string, number>;
  recentClients: number;
}

// Store related types
export interface Store extends BaseEntity {
  clientId: string;
  storeName: string;
  storeCode: string;
  storeType: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  emailAddress?: string;
  contactPersonName?: string;
  deliveryRadius?: number;
  isEVChargingAvailable?: boolean;
  chargingStationType?: string;
  chargingPower?: number;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  commission?: number;
  storeStatus: string;
  // Relations
  client?: Client;
  // Computed fields
  totalOrders?: number;
  averageRating?: number;
}

export interface StoreFormData {
  clientId: string;
  storeName: string;
  storeCode: string;
  storeType: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  emailAddress?: string;
  contactPersonName?: string;
  deliveryRadius?: number;
  isEVChargingAvailable?: boolean;
  chargingStationType?: string;
  chargingPower?: number;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  commission?: number;
  storeStatus: string;
}

export interface StoreStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  storesByType: Record<string, number>;
  storesByCity: Record<string, number>;
  storesByStatus: Record<string, number>;
  storesWithEV: number;
  averageDeliveryRadius: number;
  totalDeliveryCapacity: number;
  recentStores: number;
}

// API Response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Filter and Search types
export interface ClientFilters {
  search?: string;
  clientType?: string;
  clientStatus?: string;
  city?: string;
  businessSize?: string;
  clientPriority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StoreFilters {
  search?: string;
  clientId?: string;
  storeType?: string;
  storeStatus?: string;
  city?: string;
  isEVChargingAvailable?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Constants
export const CLIENT_TYPES = [
  "restaurant",
  "grocery",
  "pharmacy",
  "retail",
  "electronics",
  "fashion",
  "automotive",
  "healthcare",
  "other",
] as const;

export const BUSINESS_SIZES = [
  "small",
  "medium",
  "large",
  "enterprise",
] as const;

export const CLIENT_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "onboarding",
] as const;

export const CLIENT_PRIORITIES = ["High", "Medium", "Low"] as const;

export const INDUSTRY_SECTORS = [
  "Automotive OEM",
  "Fleet Operator",
  "Logistics",
  "E-commerce",
  "Food & Beverage",
  "Healthcare",
  "Government",
  "Other",
] as const;

export const BUSINESS_CATEGORIES = [
  "Manufacturer",
  "Dealer",
  "Service Provider",
  "End Customer",
  "Distributor",
  "Retailer",
] as const;

export const RATE_TYPES = ["fixed", "variable", "distance-based"] as const;

export const PAYMENT_CYCLES = [
  "daily",
  "weekly",
  "bi-weekly",
  "monthly",
] as const;

export const RELATIONSHIP_TYPES = [
  "Direct",
  "Partner",
  "Distributor",
  "Channel Partner",
] as const;

export const STORE_TYPES = [
  "supermarket",
  "convenience",
  "restaurant",
  "cafe",
  "pharmacy",
  "electronics",
  "fashion",
  "automotive",
  "hardware",
  "other",
] as const;

export const STORE_STATUSES = [
  "active",
  "inactive",
  "maintenance",
  "suspended",
] as const;

export const CHARGING_STATION_TYPES = ["AC", "DC", "Both"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];
export type BusinessSize = (typeof BUSINESS_SIZES)[number];
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type ClientPriority = (typeof CLIENT_PRIORITIES)[number];
export type StoreType = (typeof STORE_TYPES)[number];
export type StoreStatus = (typeof STORE_STATUSES)[number];
export type ChargingStationType = (typeof CHARGING_STATION_TYPES)[number];
