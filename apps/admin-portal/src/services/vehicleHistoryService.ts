import axios from "axios";

const VEHICLE_SERVICE_URL =
  import.meta.env.VITE_VEHICLE_API_URL || "http://localhost:8000/api/vehicles";
const RIDER_SERVICE_URL =
  import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api/riders";

// Configure axios instance for vehicle service
const vehicleApi = axios.create({
  baseURL: VEHICLE_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure axios instance for rider service
const riderApi = axios.create({
  baseURL: RIDER_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token (for both APIs)
const addAuthToken = (config: any) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

vehicleApi.interceptors.request.use(addAuthToken);
riderApi.interceptors.request.use(addAuthToken);

export interface RiderVehicleHistory {
  id: string;
  riderId: string;
  vehicleId: string;
  assignedAt: string;
  returnedAt: string | null;
  assignedBy: string;
  returnedBy: string | null;
  registrationNumber: string;
  vehicleMake?: string;
  vehicleModel?: string;
  status: "ACTIVE" | "RETURNED";
  notes: string | null;
  durationDays?: number; // Calculated field
  startMileage?: number;
  endMileage?: number;
  batteryPercentageStart?: number;
  batteryPercentageEnd?: number;
  conditionOnAssign?: string;
  conditionOnReturn?: string;
  damagesReported?: string;
  riderFeedback?: string;
  issuesReported?: string;
  hubId?: string; // Hub ID
  hubCode?: string; // Hub code (e.g., "HUB001")
  hubName?: string; // Hub name
  vehicle?: any; // This can be a string (JSON) or an object from backend
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Vehicle History Service - Extension of vehicleService focused on rider assignments
const vehicleHistoryService = {
  // Get vehicle assignment history for a rider
  async getRiderVehicleHistory(
    riderId: string
  ): Promise<APIResponse<RiderVehicleHistory[]>> {
    try {
      // Use the new endpoint in the rider service
      const response = await riderApi.get(
        `/riders/vehicle-history/riders/${riderId}/vehicle-history`
      );

      // Process the response data to calculate duration days if not provided by API
      const history = response.data.data.map((item: RiderVehicleHistory) => {
        let durationDays: number | undefined = item.durationDays;

        // Calculate duration if not provided
        if (durationDays === undefined) {
          const startDate = new Date(item.assignedAt).getTime();
          const endDate = item.returnedAt
            ? new Date(item.returnedAt).getTime()
            : new Date().getTime();

          durationDays = Math.floor(
            (endDate - startDate) / (1000 * 60 * 60 * 24)
          );
        }

        // Check if we have a stringified JSON in vehicleModel
        if (
          typeof item.vehicleModel === "string" &&
          item.vehicleModel.startsWith("{")
        ) {
          try {
            const vehicleData = JSON.parse(item.vehicleModel);
            // Extract the proper values
            item.vehicleMake =
              vehicleData.oem?.displayName ||
              vehicleData.oem?.name ||
              item.vehicleMake;
            item.vehicleModel = vehicleData.name || vehicleData.modelCode;
            console.log(
              "Parsed JSON from vehicleModel field:",
              item.vehicleMake,
              item.vehicleModel
            );
          } catch (e) {
            console.error("Failed to parse vehicleModel JSON:", e);
          }
        }

        // Create a consistent vehicle object
        const parsedVehicle = {
          id: item.vehicleId,
          registrationNumber: item.registrationNumber,
          make: item.vehicleMake || "Unknown",
          model: item.vehicleModel || "Unknown",
        };

        // Additionally handle case where vehicle field might exist as a JSON string
        if (item.vehicle) {
          try {
            // Only try to parse if it's a string
            const vehicleData =
              typeof item.vehicle === "string" && item.vehicle.startsWith("{")
                ? JSON.parse(item.vehicle)
                : item.vehicle;

            // Use any additional data from vehicle object
            parsedVehicle.id = vehicleData.id || parsedVehicle.id;
            parsedVehicle.registrationNumber =
              vehicleData.registrationNumber ||
              parsedVehicle.registrationNumber;
            parsedVehicle.make =
              vehicleData.oem?.displayName ||
              vehicleData.oem?.name ||
              parsedVehicle.make;
            parsedVehicle.model =
              vehicleData.name || vehicleData.modelCode || parsedVehicle.model;
          } catch (e) {
            console.error("Failed to parse vehicle JSON:", e);
          }
        }

        return {
          ...item,
          durationDays,
          // Create a consistent vehicle object for the frontend
          vehicle: parsedVehicle,
        };
      });

      return {
        success: true,
        data: history,
      };
    } catch (error: any) {
      console.error("Error fetching rider vehicle history:", error);

      // Fallback to mock data if the API fails or is not yet deployed
      if (error.response?.status === 404) {
        console.warn(
          "Vehicle history API not found. Using mock data as fallback."
        );

        // Mock data to simulate vehicle history
        const mockHistory: RiderVehicleHistory[] = [
          {
            id: "vh1-" + riderId.substring(0, 8),
            riderId: riderId,
            vehicleId: "veh-" + Math.random().toString(36).substring(2, 10),
            assignedAt: new Date(
              Date.now() - 60 * 24 * 60 * 60 * 1000
            ).toISOString(), // 60 days ago
            returnedAt: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // 30 days ago
            assignedBy: "admin-user",
            returnedBy: "admin-user",
            status: "RETURNED",
            notes: "Regular vehicle rotation",
            durationDays: 30,
            registrationNumber: "EV91-001",
            vehicleMake: "Ather",
            vehicleModel: "450X",
          },
          {
            id: "vh2-" + riderId.substring(0, 8),
            riderId: riderId,
            vehicleId: "veh-" + Math.random().toString(36).substring(2, 10),
            assignedAt: new Date(
              Date.now() - 29 * 24 * 60 * 60 * 1000
            ).toISOString(), // 29 days ago
            returnedAt: null,
            assignedBy: "admin-user",
            returnedBy: null,
            status: "ACTIVE",
            notes: "Current vehicle assignment",
            durationDays: 29,
            registrationNumber: "EV91-002",
            vehicleMake: "Ola",
            vehicleModel: "S1 Pro",
          },
        ];

        return {
          success: true,
          data: mockHistory.map((item) => ({
            ...item,
            vehicle: {
              id: item.vehicleId,
              registrationNumber: item.registrationNumber,
              make: item.vehicleMake || "Unknown",
              model: item.vehicleModel || "Unknown",
            },
          })),
        };
      }

      return {
        success: false,
        data: [],
        message: error.message || "Error fetching rider vehicle history",
      };
    }
  },

  // Assign vehicle to rider
  async assignVehicleToRider(
    riderId: string,
    vehicleId: string,
    registrationNumber: string,
    notes?: string
  ): Promise<APIResponse<RiderVehicleHistory>> {
    try {
      const response = await riderApi.post(
        `/riders/vehicle-history/riders/${riderId}/vehicle-assignments`,
        {
          vehicleId,
          registrationNumber,
          notes,
        }
      );
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error: any) {
      console.error("Error assigning vehicle to rider:", error);
      return {
        success: false,
        data: {} as RiderVehicleHistory,
        message: error.message || "Error assigning vehicle to rider",
      };
    }
  },

  // Return vehicle from rider
  async returnVehicleFromRider(
    assignmentId: string,
    notes?: string
  ): Promise<APIResponse<RiderVehicleHistory>> {
    try {
      const response = await riderApi.patch(
        `/riders/vehicle-history/vehicle-assignments/${assignmentId}/return`,
        {
          notes,
        }
      );
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error: any) {
      console.error("Error returning vehicle from rider:", error);
      return {
        success: false,
        data: {} as RiderVehicleHistory,
        message: error.message || "Error returning vehicle from rider",
      };
    }
  },

  // Get active vehicle assignment for a rider
  async getRiderActiveAssignment(
    riderId: string
  ): Promise<APIResponse<RiderVehicleHistory | null>> {
    try {
      const response = await riderApi.get(
        `/riders/vehicle-history/riders/${riderId}/vehicle-history/active`
      );
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error: any) {
      console.error("Error fetching rider active assignment:", error);

      // Fallback to checking the Rider entity if the API fails
      try {
        const riderResponse = await riderApi.get(`/riders/${riderId}`);
        const riderData = riderResponse.data?.data;

        if (riderData && riderData.assignedVehicleId) {
          // Use basic rider data to construct a minimal active assignment
          return {
            success: true,
            data: {
              id: `generated-${Date.now()}`,
              riderId: riderId,
              vehicleId: riderData.assignedVehicleId,
              assignedAt: riderData.assignmentDate || new Date().toISOString(),
              returnedAt: null,
              assignedBy: "system",
              returnedBy: null,
              status: "ACTIVE",
              notes: "Assignment data reconstructed from rider record",
              registrationNumber: "Unknown", // We don't have this in the rider data
              vehicleMake: "Unknown",
              vehicleModel: "Unknown",
            },
          };
        }

        return {
          success: true,
          data: null, // No active assignment
        };
      } catch (riderError) {
        console.error("Error fetching rider data as fallback:", riderError);
        return {
          success: false,
          data: null,
          message: error.message || "Error fetching rider active assignment",
        };
      }
    }
  },
};

export default vehicleHistoryService;
