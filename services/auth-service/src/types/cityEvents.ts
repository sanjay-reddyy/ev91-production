/**
 * City Event Types
 * For EV91 Platform - Auth Service
 * Event types for city synchronization across services
 */

export enum CityEventType {
  CITY_CREATED = "city.created",
  CITY_UPDATED = "city.updated",
  CITY_ACTIVATED = "city.activated",
  CITY_DEACTIVATED = "city.deactivated",
  CITY_DELETED = "city.deleted",
}

export interface CityEventData {
  id: string;
  name: string;
  displayName: string;
  code: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  pinCodeRange?: string;
  regionCode?: string;
  isActive: boolean;
  isOperational: boolean;
  launchDate?: Date;
  estimatedPopulation?: number;
  marketPotential?: string;
  version: number;
  lastModifiedBy: string;
  eventSequence: number;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CityEvent {
  eventId: string;
  type: CityEventType;
  cityId: string;
  data: CityEventData;
  timestamp: Date;
  source: string;
  version: number;
}

export interface EventProcessResult {
  success: boolean;
  action: "created" | "updated" | "skipped" | "error";
  cityId: string;
  eventId: string;
  message?: string;
  error?: string;
}
