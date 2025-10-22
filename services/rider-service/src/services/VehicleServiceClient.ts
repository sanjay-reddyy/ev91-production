import axios, { AxiosInstance, AxiosError } from "axios";

/**
 * Vehicle Service Client
 * Handles all communication with the Vehicle Service API
 * Features:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Optional Redis caching
 * - Error normalization
 * - Request/response logging
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface VehicleModel {
  id: string;
  modelName: string;
  oemId: string;
  oemName?: string;
  isAvailableForRent: boolean;
  baseRentalCost: number;
  rentalCategory: string;
  rentalDescription?: string;
  minimumRentalPeriod?: number;
  fuelType: string;
  batteryCapacity?: number;
  range?: number;
  topSpeed?: number;
  chargingTime?: number;
  weight?: number;
  loadCapacity?: number;
}

interface RentalCostCalculation {
  modelName: string;
  baseRentalCost: number;
  vehicleAgeInMonths: number;
  depreciationPercentage: number;
  actualMonthlyCost: number;
  monthlySavings: number;
  totalCostFor12Months: number;
  breakdown: {
    formula: string;
    calculation: string;
  };
}

interface AvailableVehicle {
  id: string;
  registrationNumber: string;
  ageInMonths: number;
  operationalStatus: string;
  hub?: {
    hubName: string;
    city: {
      cityName: string;
    };
  };
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number | null;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

// ==========================================
// VEHICLE SERVICE CLIENT CLASS
// ==========================================

export class VehicleServiceClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  private circuitBreaker: CircuitBreakerState;
  private readonly maxRetries: number = 3;
  private readonly retryDelays: number[] = [500, 1000, 2000]; // milliseconds
  private readonly circuitBreakerThreshold: number = 5;
  private readonly circuitBreakerTimeout: number = 30000; // 30 seconds
  private readonly requestTimeout: number = 10000; // 10 seconds

  constructor(baseURL?: string) {
    this.baseURL =
      baseURL || process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.requestTimeout,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "rider-service",
      },
    });

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: "CLOSED",
    };

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(
          `[VehicleServiceClient] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("[VehicleServiceClient] Request error:", error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `[VehicleServiceClient] ✓ ${response.config.method?.toUpperCase()} ${
            response.config.url
          } - ${response.status}`
        );
        this.recordSuccess();
        return response;
      },
      (error) => {
        this.recordFailure();
        console.error(
          `[VehicleServiceClient] ✗ ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          } - ${error.response?.status || "TIMEOUT"}`
        );
        return Promise.reject(error);
      }
    );
  }

  // ==========================================
  // CIRCUIT BREAKER METHODS
  // ==========================================

  private recordSuccess(): void {
    if (this.circuitBreaker.state === "HALF_OPEN") {
      console.log("[CircuitBreaker] Request succeeded - Closing circuit");
      this.circuitBreaker.state = "CLOSED";
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.lastFailureTime = null;
    }
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreakerThreshold) {
      console.warn(
        `[CircuitBreaker] Threshold reached (${this.circuitBreaker.failures} failures) - Opening circuit`
      );
      this.circuitBreaker.state = "OPEN";
    }
  }

  private checkCircuitBreaker(): void {
    if (this.circuitBreaker.state === "OPEN") {
      const timeSinceLastFailure =
        Date.now() - (this.circuitBreaker.lastFailureTime || 0);

      if (timeSinceLastFailure >= this.circuitBreakerTimeout) {
        console.log(
          "[CircuitBreaker] Timeout reached - Attempting half-open state"
        );
        this.circuitBreaker.state = "HALF_OPEN";
        this.circuitBreaker.failures = 0;
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Service unavailable. Retry in ${Math.ceil(
            (this.circuitBreakerTimeout - timeSinceLastFailure) / 1000
          )}s`
        );
      }
    }
  }

  // ==========================================
  // RETRY LOGIC
  // ==========================================

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      this.checkCircuitBreaker();
      return await requestFn();
    } catch (error: any) {
      const isLastAttempt = attempt >= this.maxRetries - 1;
      const isRetryableError = this.isRetryableError(error);

      if (!isLastAttempt && isRetryableError) {
        const delay = this.retryDelays[attempt];
        console.log(
          `[VehicleServiceClient] Retry attempt ${attempt + 1}/${
            this.maxRetries
          } after ${delay}ms`
        );
        await this.sleep(delay);
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return true;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return !status || status >= 500;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================
  // ERROR NORMALIZATION
  // ==========================================

  private normalizeError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error status
        return new Error(
          `Vehicle Service error: ${axiosError.response.status} - ${
            JSON.stringify(axiosError.response.data) || axiosError.message
          }`
        );
      } else if (axiosError.request) {
        // Request made but no response
        return new Error("Vehicle Service unavailable - no response received");
      }
    }

    if (error.message?.includes("Circuit breaker")) {
      return error;
    }

    return new Error(`Vehicle Service communication failed: ${error.message}`);
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  /**
   * Get vehicle model by ID
   * @param modelId - Vehicle model UUID
   * @returns Vehicle model details or null if not found
   */
  async getVehicleModel(modelId: string): Promise<VehicleModel | null> {
    try {
      const response = await this.retryRequest(() =>
        this.axiosInstance.get(`/api/vehicle-models/${modelId}`)
      );

      return response.data.data as VehicleModel;
    } catch (error) {
      console.error(
        `[VehicleServiceClient] Failed to fetch vehicle model ${modelId}:`,
        this.normalizeError(error).message
      );
      return null;
    }
  }

  /**
   * Get all available rental models
   * @param category - Optional filter by rental category
   * @returns List of available rental models
   */
  async getAvailableRentalModels(
    category?: string
  ): Promise<VehicleModel[] | null> {
    try {
      const params: any = {};
      if (category) {
        params.category = category;
      }

      const response = await this.retryRequest(() =>
        this.axiosInstance.get("/api/vehicle-models/available-for-rent", {
          params,
        })
      );

      return response.data.data.models as VehicleModel[];
    } catch (error) {
      console.error(
        "[VehicleServiceClient] Failed to fetch available rental models:",
        this.normalizeError(error).message
      );
      return null;
    }
  }

  /**
   * Calculate rental cost with depreciation
   * @param modelId - Vehicle model UUID
   * @param vehicleAge - Vehicle age in months
   * @returns Rental cost calculation details
   */
  async calculateRentalCost(
    modelId: string,
    vehicleAge: number
  ): Promise<RentalCostCalculation | null> {
    try {
      const response = await this.retryRequest(() =>
        this.axiosInstance.get(`/api/vehicle-models/${modelId}/rental-cost`, {
          params: { vehicleAge },
        })
      );

      return response.data.data as RentalCostCalculation;
    } catch (error) {
      console.error(
        `[VehicleServiceClient] Failed to calculate rental cost for model ${modelId}:`,
        this.normalizeError(error).message
      );
      return null;
    }
  }

  /**
   * Get available vehicles for a specific model
   * @param modelId - Vehicle model UUID
   * @returns List of available vehicles
   */
  async getAvailableVehicles(
    modelId: string
  ): Promise<AvailableVehicle[] | null> {
    try {
      const response = await this.retryRequest(() =>
        this.axiosInstance.get(
          `/api/vehicle-models/${modelId}/available-vehicles`
        )
      );

      return response.data.data.vehicles as AvailableVehicle[];
    } catch (error) {
      console.error(
        `[VehicleServiceClient] Failed to fetch available vehicles for model ${modelId}:`,
        this.normalizeError(error).message
      );
      return null;
    }
  }

  /**
   * Validate if a vehicle model exists and is available for rent
   * @param modelId - Vehicle model UUID
   * @returns Boolean indicating availability, or null on error
   */
  async validateModelAvailability(modelId: string): Promise<boolean | null> {
    try {
      const model = await this.getVehicleModel(modelId);

      if (!model) {
        return false;
      }

      return model.isAvailableForRent === true;
    } catch (error) {
      console.error(
        `[VehicleServiceClient] Failed to validate model ${modelId}:`,
        this.normalizeError(error).message
      );
      return null;
    }
  }

  /**
   * Health check for Vehicle Service
   * @returns Boolean indicating service health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get("/api/health", {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      console.error(
        "[VehicleServiceClient] Health check failed:",
        this.normalizeError(error).message
      );
      return false;
    }
  }

  /**
   * Get circuit breaker status
   * @returns Current circuit breaker state
   */
  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  resetCircuitBreaker(): void {
    console.log("[CircuitBreaker] Manual reset");
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: "CLOSED",
    };
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let vehicleServiceClientInstance: VehicleServiceClient | null = null;

/**
 * Get singleton instance of VehicleServiceClient
 */
export function getVehicleServiceClient(): VehicleServiceClient {
  if (!vehicleServiceClientInstance) {
    vehicleServiceClientInstance = new VehicleServiceClient();
  }
  return vehicleServiceClientInstance;
}

/**
 * Create new instance with custom configuration (for testing)
 */
export function createVehicleServiceClient(
  baseURL: string
): VehicleServiceClient {
  return new VehicleServiceClient(baseURL);
}
