// Event types for city data synchronization across services
// Mirror of vehicle-service city events

export enum CityEventType {
  CITY_CREATED = "city.created",
  CITY_UPDATED = "city.updated",
  CITY_DELETED = "city.deleted",
  CITY_ACTIVATED = "city.activated",
  CITY_DEACTIVATED = "city.deactivated",
}

// Base event interface
export interface CityEvent {
  type: CityEventType;
  cityId: string;
  eventId: string; // Unique event identifier
  eventSequence: number; // For ordering events
  timestamp: Date;
  version: number; // City version when event occurred
  triggeredBy?: string; // User ID or system that triggered the event
  metadata?: {
    source: string; // 'admin-portal', 'api', 'migration', etc.
    correlationId?: string; // For tracing across services
    [key: string]: any;
  };
}

// City data payload for events
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
  lastModifiedBy?: string;
  eventSequence: number;
  createdAt: Date;
  updatedAt: Date;
}

// Specific event interfaces
export interface CityCreatedEvent extends CityEvent {
  type: CityEventType.CITY_CREATED;
  data: CityEventData;
}

export interface CityUpdatedEvent extends CityEvent {
  type: CityEventType.CITY_UPDATED;
  data: CityEventData;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface CityDeletedEvent extends CityEvent {
  type: CityEventType.CITY_DELETED;
  data: {
    id: string;
    name: string;
    code: string;
    version: number;
  };
}

export interface CityActivatedEvent extends CityEvent {
  type: CityEventType.CITY_ACTIVATED;
  data: Pick<
    CityEventData,
    "id" | "name" | "code" | "isActive" | "isOperational" | "version"
  >;
}

export interface CityDeactivatedEvent extends CityEvent {
  type: CityEventType.CITY_DEACTIVATED;
  data: Pick<
    CityEventData,
    "id" | "name" | "code" | "isActive" | "isOperational" | "version"
  >;
}

// Union type for all city events
export type AnyCityEvent =
  | CityCreatedEvent
  | CityUpdatedEvent
  | CityDeletedEvent
  | CityActivatedEvent
  | CityDeactivatedEvent;

// Event processing result
export interface EventProcessResult {
  success: boolean;
  action: "created" | "updated" | "deleted" | "skipped" | "error";
  cityId: string;
  eventId: string;
  message?: string;
  error?: string;
}
