import {
  CityEvent,
  CityEventType,
  AnyCityEvent,
  EventPublishResult,
  ServiceEndpoint,
  CityEventData,
} from "./cityEvents";
import axios, { AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * Event Publisher for City data synchronization
 * Publishes events to all registered services when city data changes
 */
export class CityEventPublisher {
  private serviceEndpoints: ServiceEndpoint[] = [
    {
      name: "client-store-service",
      url: process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006",
      isActive: true,
    },
    {
      name: "rider-service",
      url: process.env.RIDER_SERVICE_URL || "http://localhost:4005",
      isActive: true,
    },
    {
      name: "auth-service",
      url: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
      isActive: true,
    },
    // Add more services as needed
  ];

  /**
   * Publish city event to all registered services
   */
  async publishCityEvent(event: AnyCityEvent): Promise<EventPublishResult> {
    const eventId = uuidv4();
    const publishedTo: string[] = [];
    const errors: { service: string; error: string }[] = [];

    console.log(
      `📢 Publishing city event: ${event.type} for city ${event.cityId}`
    );

    // Publish to all active service endpoints
    const publishPromises = this.serviceEndpoints
      .filter((endpoint) => endpoint.isActive)
      .map(async (endpoint) => {
        try {
          await this.publishToService(endpoint, { ...event, eventId });
          publishedTo.push(endpoint.name);
          console.log(`✅ Event published to ${endpoint.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof AxiosError
              ? `${error.message} (${error.response?.status})`
              : String(error);
          errors.push({ service: endpoint.name, error: errorMessage });
          console.error(
            `❌ Failed to publish to ${endpoint.name}:`,
            errorMessage
          );
        }
      });

    await Promise.allSettled(publishPromises);

    // Log the event publication
    await this.logEvent({
      eventId,
      eventType: event.type,
      cityId: event.cityId,
      eventData: event,
      publishedTo,
      publishedAt: new Date(),
      status:
        errors.length === 0
          ? "published"
          : publishedTo.length === 0
            ? "failed"
            : "partial",
      errors: errors.length > 0 ? errors : undefined,
    });

    return {
      success:
        errors.length < this.serviceEndpoints.filter((e) => e.isActive).length,
      eventId,
      publishedTo,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Publish event to a specific service
   */
  private async publishToService(
    endpoint: ServiceEndpoint,
    event: AnyCityEvent & { eventId: string }
  ) {
    const url = `${endpoint.url}/internal/city-sync`;
    const timeout = 5000; // 5 seconds timeout

    await axios.post(url, event, {
      timeout,
      headers: {
        "Content-Type": "application/json",
        "X-Event-Source": "vehicle-service",
        "X-Event-Id": event.eventId,
        "X-Event-Type": event.type,
      },
    });
  }

  /**
   * Create city created event
   */
  createCityCreatedEvent(
    cityData: CityEventData,
    triggeredBy?: string
  ): AnyCityEvent {
    return {
      type: CityEventType.CITY_CREATED,
      cityId: cityData.id,
      eventId: uuidv4(),
      eventSequence: cityData.eventSequence,
      timestamp: new Date(),
      version: cityData.version,
      triggeredBy,
      data: cityData,
      metadata: {
        source: "vehicle-service",
        correlationId: uuidv4(),
      },
    };
  }

  /**
   * Create city updated event
   */
  createCityUpdatedEvent(
    cityData: CityEventData,
    changes: { field: string; oldValue: any; newValue: any }[],
    triggeredBy?: string
  ): AnyCityEvent {
    return {
      type: CityEventType.CITY_UPDATED,
      cityId: cityData.id,
      eventId: uuidv4(),
      eventSequence: cityData.eventSequence,
      timestamp: new Date(),
      version: cityData.version,
      triggeredBy,
      data: cityData,
      changes,
      metadata: {
        source: "vehicle-service",
        correlationId: uuidv4(),
      },
    };
  }

  /**
   * Create city deleted event
   */
  createCityDeletedEvent(
    cityId: string,
    cityName: string,
    cityCode: string,
    version: number,
    triggeredBy?: string
  ): AnyCityEvent {
    return {
      type: CityEventType.CITY_DELETED,
      cityId,
      eventId: uuidv4(),
      eventSequence: 0, // Final event
      timestamp: new Date(),
      version,
      triggeredBy,
      data: {
        id: cityId,
        name: cityName,
        code: cityCode,
        version,
      },
      metadata: {
        source: "vehicle-service",
        correlationId: uuidv4(),
      },
    };
  }

  /**
   * Create city status changed event
   */
  createCityStatusChangedEvent(
    cityData: Pick<
      CityEventData,
      "id" | "name" | "code" | "isActive" | "isOperational" | "version"
    >,
    isActivating: boolean,
    triggeredBy?: string
  ): AnyCityEvent {
    return {
      type: isActivating
        ? CityEventType.CITY_ACTIVATED
        : CityEventType.CITY_DEACTIVATED,
      cityId: cityData.id,
      eventId: uuidv4(),
      eventSequence: 0,
      timestamp: new Date(),
      version: cityData.version,
      triggeredBy,
      data: cityData,
      metadata: {
        source: "vehicle-service",
        correlationId: uuidv4(),
      },
    };
  }

  /**
   * Log event publication for audit trail
   * In production, this should go to a proper event store or database
   */
  private async logEvent(logEntry: any) {
    try {
      // For now, just console log. In production, save to database or event store
      console.log(
        "📝 Event Log:",
        JSON.stringify(
          {
            ...logEntry,
            timestamp: logEntry.publishedAt.toISOString(),
          },
          null,
          2
        )
      );

      // TODO: Implement proper event logging to database
      // await eventLogRepository.save(logEntry);
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  }

  /**
   * Get service endpoints
   */
  getServiceEndpoints(): ServiceEndpoint[] {
    return this.serviceEndpoints;
  }

  /**
   * Update service endpoint status
   */
  updateServiceEndpoint(serviceName: string, isActive: boolean) {
    const endpoint = this.serviceEndpoints.find((e) => e.name === serviceName);
    if (endpoint) {
      endpoint.isActive = isActive;
      console.log(
        `🔄 Service endpoint ${serviceName} ${isActive ? "enabled" : "disabled"}`
      );
    }
  }
}

// Singleton instance
export const cityEventPublisher = new CityEventPublisher();
