import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

// Environment variables for service URLs
const RIDER_SERVICE_URL =
  process.env.RIDER_SERVICE_URL || "http://localhost:3004";
const CLIENT_STORE_SERVICE_URL =
  process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006";
const RETRIES = Number(process.env.SERVICE_CALL_RETRIES) || 3;
const RETRY_DELAY = Number(process.env.SERVICE_CALL_RETRY_DELAY) || 1000;

// Helper for retry logic
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    const isAxiosError = (error as AxiosError).isAxiosError;
    const status = isAxiosError ? (error as AxiosError).response?.status : null;

    // Don't retry on certain status codes
    if (status && [400, 401, 403, 404].includes(status)) {
      throw error;
    }

    console.log(
      `Retrying operation, ${retries} attempts left. Error: ${
        (error as Error).message
      }`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
};

// Typed error response handling
interface ServiceErrorResponse {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

class ServiceIntegrationError extends Error {
  statusCode: number;
  errorCode: string;
  details?: unknown;

  constructor(response: ServiceErrorResponse) {
    super(response.message || "Service integration error");
    this.statusCode = response.status || 500;
    this.errorCode = response.code || "SERVICE_ERROR";
    this.details = response.details;
    this.name = "ServiceIntegrationError";
  }

  static fromError(error: unknown): ServiceIntegrationError {
    if (error instanceof ServiceIntegrationError) {
      return error;
    }

    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError && axiosError.response) {
      return new ServiceIntegrationError({
        status: axiosError.response.status,
        message: `Service call failed: ${axiosError.message}`,
        code: `${axiosError.response.status}_ERROR`,
        details: axiosError.response.data,
      });
    }

    return new ServiceIntegrationError({
      status: 500,
      message: error instanceof Error ? error.message : String(error),
      code: "UNKNOWN_SERVICE_ERROR",
    });
  }
}

// Service to validate and retrieve rider information
export const riderService = {
  // Validate rider exists
  validateRider: async (riderId: string): Promise<boolean> => {
    try {
      console.log(`🔍 Validating rider with ID: ${riderId}`);

      const response = await withRetry(() =>
        axios.get(`${RIDER_SERVICE_URL}/api/v1/riders/${riderId}`)
      );

      return response.status === 200;
    } catch (error) {
      // Only log as error if it's not a 404 (which is an expected case)
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError && axiosError.response?.status === 404) {
        console.log(`Rider with ID ${riderId} not found`);
      } else {
        console.error(`Error validating rider: ${(error as Error).message}`, {
          riderId,
          error: error instanceof Error ? error.stack : String(error),
        });
      }
      return false;
    }
  },

  // Get rider details
  getRider: async (riderId: string) => {
    try {
      console.log(`🔍 Fetching rider details for ID: ${riderId}`);

      const response = await withRetry(() =>
        axios.get(`${RIDER_SERVICE_URL}/api/v1/riders/${riderId}`)
      );

      console.log(`✅ Successfully retrieved rider data for ID: ${riderId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching rider with ID ${riderId}:`, {
        riderId,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Get all available riders in a city
  getAvailableRiders: async (city: string) => {
    try {
      console.log(`🔍 Finding available riders in city: ${city}`);

      const response = await withRetry(() =>
        axios.get(`${RIDER_SERVICE_URL}/api/v1/riders/available`, {
          params: { city },
        })
      );

      console.log(
        `✅ Found ${response.data.length || 0} available riders in ${city}`
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching available riders in city ${city}:`, {
        city,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Notify rider about a new order
  notifyRider: async (riderId: string, orderId: string, orderDetails: any) => {
    try {
      console.log(
        `📲 Sending notification to rider ${riderId} about order ${orderId}`
      );

      const response = await withRetry(() =>
        axios.post(
          `${RIDER_SERVICE_URL}/api/v1/notifications/riders/${riderId}`,
          {
            type: "NEW_ORDER",
            orderId,
            details: orderDetails,
          }
        )
      );

      console.log(
        `✅ Successfully notified rider ${riderId} about order ${orderId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `❌ Error notifying rider ${riderId} about order ${orderId}:`,
        {
          riderId,
          orderId,
          error: error instanceof Error ? error.stack : String(error),
        }
      );

      // We return false instead of throwing because notification failures should not break the flow
      return false;
    }
  },

  // Update rider's order status
  updateRiderOrderStatus: async (
    riderId: string,
    orderId: string,
    status: string
  ) => {
    try {
      console.log(
        `🔄 Updating order status for rider ${riderId}, order ${orderId} to ${status}`
      );

      const response = await withRetry(() =>
        axios.patch(
          `${RIDER_SERVICE_URL}/api/v1/riders/${riderId}/orders/${orderId}/status`,
          { status }
        )
      );

      console.log(`✅ Successfully updated rider's order status to ${status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating rider order status:`, {
        riderId,
        orderId,
        status,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },
};

// Service to validate and retrieve client information
export const clientService = {
  // Validate client exists
  validateClient: async (clientId: string): Promise<boolean> => {
    try {
      console.log(`🔍 Validating client with ID: ${clientId}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/clients/${clientId}`)
      );

      return response.status === 200;
    } catch (error) {
      // Only log as error if it's not a 404 (which is an expected case)
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError && axiosError.response?.status === 404) {
        console.log(`Client with ID ${clientId} not found`);
      } else {
        console.error(`Error validating client: ${(error as Error).message}`, {
          clientId,
          error: error instanceof Error ? error.stack : String(error),
        });
      }
      return false;
    }
  },

  // Get client details
  getClient: async (clientId: string) => {
    try {
      console.log(`🔍 Fetching client details for ID: ${clientId}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/clients/${clientId}`)
      );

      console.log(`✅ Successfully retrieved client data for ID: ${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching client with ID ${clientId}:`, {
        clientId,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Get clients by city
  getClientsByCity: async (city: string) => {
    try {
      console.log(`🔍 Fetching clients in city: ${city}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/clients/city/${city}`)
      );

      console.log(`✅ Found ${response.data.length || 0} clients in ${city}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching clients in city ${city}:`, {
        city,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Notify client about order status
  notifyClientOrderUpdate: async (
    clientId: string,
    orderId: string,
    status: string
  ) => {
    try {
      console.log(
        `📲 Notifying client ${clientId} about order ${orderId} status update to ${status}`
      );

      const response = await withRetry(() =>
        axios.post(
          `${CLIENT_STORE_SERVICE_URL}/api/clients/${clientId}/notifications`,
          {
            type: "ORDER_STATUS_UPDATE",
            orderId,
            status,
            timestamp: new Date().toISOString(),
          }
        )
      );

      console.log(
        `✅ Successfully notified client ${clientId} about order ${orderId} status update`
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error notifying client about order status:`, {
        clientId,
        orderId,
        status,
        error: error instanceof Error ? error.stack : String(error),
      });

      // We return false instead of throwing because notification failures should not break the flow
      return false;
    }
  },
};

// Service to validate and retrieve store information
export const storeService = {
  // Validate store exists
  validateStore: async (storeId: string): Promise<boolean> => {
    try {
      console.log(`🔍 Validating store with ID: ${storeId}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/stores/${storeId}`)
      );

      return response.status === 200;
    } catch (error) {
      // Only log as error if it's not a 404 (which is an expected case)
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError && axiosError.response?.status === 404) {
        console.log(`Store with ID ${storeId} not found`);
      } else {
        console.error(`Error validating store: ${(error as Error).message}`, {
          storeId,
          error: error instanceof Error ? error.stack : String(error),
        });
      }
      return false;
    }
  },

  // Get store details
  getStore: async (storeId: string) => {
    try {
      console.log(`🔍 Fetching store details for ID: ${storeId}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/stores/${storeId}`)
      );

      console.log(`✅ Successfully retrieved store data for ID: ${storeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching store with ID ${storeId}:`, {
        storeId,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Get stores by client
  getStoresByClient: async (clientId: string) => {
    try {
      console.log(`🔍 Fetching stores for client: ${clientId}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/stores`, {
          params: { clientId },
        })
      );

      console.log(
        `✅ Found ${response.data.length || 0} stores for client ${clientId}`
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching stores for client ${clientId}:`, {
        clientId,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Get stores by city
  getStoresByCity: async (city: string) => {
    try {
      console.log(`🔍 Fetching stores in city: ${city}`);

      const response = await withRetry(() =>
        axios.get(`${CLIENT_STORE_SERVICE_URL}/api/stores`, {
          params: { city },
        })
      );

      console.log(`✅ Found ${response.data.length || 0} stores in ${city}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching stores in city ${city}:`, {
        city,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Update store inventory based on order
  updateStoreInventory: async (storeId: string, orderItems: any[]) => {
    try {
      console.log(`🔄 Updating inventory for store ${storeId}`);

      const response = await withRetry(() =>
        axios.post(
          `${CLIENT_STORE_SERVICE_URL}/api/stores/${storeId}/inventory/update`,
          { items: orderItems }
        )
      );

      console.log(`✅ Successfully updated inventory for store ${storeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating store inventory:`, {
        storeId,
        itemCount: orderItems.length,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },

  // Check if items are available in store
  checkItemsAvailability: async (storeId: string, items: any[]) => {
    try {
      console.log(`🔍 Checking item availability in store ${storeId}`);

      const response = await withRetry(() =>
        axios.post(
          `${CLIENT_STORE_SERVICE_URL}/api/stores/${storeId}/inventory/check`,
          { items }
        )
      );

      console.log(`✅ Successfully checked inventory for store ${storeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error checking store inventory:`, {
        storeId,
        itemCount: items.length,
        error: error instanceof Error ? error.stack : String(error),
      });

      throw ServiceIntegrationError.fromError(error);
    }
  },
};
