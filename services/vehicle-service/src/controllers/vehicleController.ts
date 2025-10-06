import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { VehicleService } from "../services";
import { VehicleCreateData, VehicleUpdateData, QueryParams } from "../types";
import { Logger } from "../utils";
import { prisma } from "../index";

// Create new vehicle
export const createVehicle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Vehicle creation request received", { userId: req.user?.id });

    const vehicleData: VehicleCreateData = req.body;

    try {
      const result = await VehicleService.createVehicle(
        vehicleData,
        req.user?.id
      );

      res.status(201).json({
        success: true,
        message: "Vehicle created successfully with RC and Insurance details",
        data: result,
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get all vehicles with filtering and pagination
export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  Logger.info("Get vehicles request received", { params: req.query });

  try {
    // Create a clean params object and handle type conversions properly
    const params: QueryParams = {};

    // Process all query parameters with proper type conversion
    Object.entries(req.query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return; // Skip empty values
      }

      // Handle numeric parameters
      if (
        [
          "page",
          "limit",
          "minAge",
          "maxAge",
          "minMileage",
          "maxMileage",
          "year",
        ].includes(key)
      ) {
        const numValue = parseInt(value as string, 10);
        if (!isNaN(numValue)) {
          (params as any)[key] = numValue;
        } else {
          Logger.warn(`Invalid numeric value for parameter ${key}: ${value}`);
        }
      }
      // Handle date parameters
      else if (
        ["purchaseDateFrom", "purchaseDateTo", "startDate", "endDate"].includes(
          key
        )
      ) {
        try {
          const dateValue = new Date(value as string);
          if (!isNaN(dateValue.getTime())) {
            (params as any)[key] = value;
          } else {
            Logger.warn(`Invalid date format for parameter ${key}: ${value}`);
          }
        } catch (e) {
          Logger.warn(`Error parsing date for parameter ${key}: ${value}`);
        }
      }
      // Handle boolean parameters
      else if (["isActive", "hasServiceCenter", "is24x7"].includes(key)) {
        (params as any)[key] = value === "true";
      }
      // Pass through all other string parameters
      else {
        (params as any)[key] = value;
      }
    });

    // Set defaults for pagination
    if (!params.page) params.page = 1;
    if (!params.limit) params.limit = 25;

    Logger.debug("Processed query parameters:", params);

    // Validate required filter params if any
    const invalidParams = Object.entries(params)
      .filter(([key, value]) => {
        // Check numeric parameters have valid values
        if (
          [
            "page",
            "limit",
            "minAge",
            "maxAge",
            "minMileage",
            "maxMileage",
            "year",
          ].includes(key) &&
          value !== undefined &&
          isNaN(value as number)
        ) {
          return true;
        }
        return false;
      })
      .map(([key]) => key);

    // Return validation error if any parameters are invalid
    if (invalidParams.length > 0) {
      Logger.warn("Invalid parameters in request:", invalidParams);
      // Instead of returning error, let's fix the parameters to make the API more forgiving
      invalidParams.forEach((key) => {
        // Remove invalid parameters or set defaults
        if (key === "page") params.page = 1;
        else if (key === "limit") params.limit = 25;
        else delete (params as any)[key];
      });
      Logger.info("Auto-corrected invalid parameters:", params);
    }

    // Debug log the parameters before passing to service
    console.log(
      "🔍 DEBUG Controller: Params being passed to VehicleService.getVehicles:",
      JSON.stringify(params)
    );

    // Special debug for search parameter
    if (params.search) {
      console.log(
        `🔍 DEBUG Controller: Search parameter value: "${params.search}"`
      );
    } else {
      console.log("⚠️ DEBUG Controller: No search parameter found in request");

      // Check if search exists in original request but was filtered out
      if (req.query.search) {
        console.log(
          `❌ DEBUG Controller: Found search in req.query but not in params: "${req.query.search}"`
        );
      }
    }

    // Call service with validated parameters
    const result = await VehicleService.getVehicles(params);

    // Enhanced response with debug information
    // ALWAYS use 'vehicles' key for consistency with frontend expectations
    const response = {
      success: true,
      vehicles: result.vehicles, // Use consistent key name
      pagination: result.pagination,
      // Include metadata for easier frontend debugging
      meta: {
        appliedFilters: Object.entries(params)
          .filter(
            ([key, value]) =>
              value !== undefined &&
              !["page", "limit", "sortBy", "sortOrder"].includes(key)
          )
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        returnedRecords: result.vehicles.length,
        totalRecords: result.pagination.totalItems,
      },
    };

    Logger.debug("Sending successful response with data:", {
      vehicleCount: result.vehicles.length,
      pagination: result.pagination,
    });

    res.json(response);
  } catch (error) {
    Logger.error("Error in getVehicles controller:", error);
    throw error; // Let the global error handler manage it
  }
});

// Get vehicle by ID
export const getVehicleById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle by ID request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;

    try {
      const vehicle = await VehicleService.getVehicleById(id);

      res.json({
        success: true,
        vehicle: vehicle, // Use consistent key names for all responses
        data: vehicle, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Update vehicle
export const updateVehicle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Update vehicle request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;
    const updateData: VehicleUpdateData = req.body;

    try {
      const vehicle = await VehicleService.updateVehicle(
        id,
        updateData,
        req.user?.id
      );

      res.json({
        success: true,
        message: "Vehicle updated successfully",
        vehicle: vehicle, // Use consistent key names
        data: vehicle, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Delete vehicle
export const deleteVehicle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Delete vehicle request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;

    try {
      await VehicleService.deleteVehicle(id);

      res.json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Update vehicle status
export const updateVehicleStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    Logger.info("Update vehicle status request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;
    const { operationalStatus, reason } = req.body;

    // Validate that operationalStatus is provided
    if (!operationalStatus) {
      res.status(400).json({
        success: false,
        error: "operationalStatus is required",
        message: "Please provide a valid operational status",
      });
      return;
    }

    try {
      const vehicle = await VehicleService.updateVehicleStatus(
        id,
        operationalStatus,
        reason || "",
        req.user?.id
      );

      res.json({
        success: true,
        message: "Vehicle status updated successfully",
        vehicle: vehicle, // Use consistent key names
        data: vehicle, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get vehicle status
export const getVehicleStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle status request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;

    try {
      const vehicle = await VehicleService.getVehicleById(id);

      // Extract only status-related fields
      const statusData = {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        operationalStatus: vehicle.operationalStatus,
        serviceStatus: vehicle.serviceStatus,
        currentRiderId: vehicle.currentRiderId,
        assignmentDate: vehicle.assignmentDate,
        location: vehicle.location,
        mileage: vehicle.mileage,
        updatedAt: vehicle.updatedAt,
      };

      res.json({
        success: true,
        vehicle: statusData, // Use consistent key names
        data: statusData, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Assign vehicle to rider
export const assignVehicle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Assign vehicle request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;
    const { riderId } = req.body;

    try {
      const vehicle = await VehicleService.assignVehicle(
        id,
        riderId,
        req.user?.id
      );

      res.json({
        success: true,
        message: "Vehicle assigned successfully",
        vehicle: vehicle, // Use consistent key names
        data: vehicle, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Unassign vehicle from rider
export const unassignVehicle = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Unassign vehicle request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;

    try {
      const vehicle = await VehicleService.unassignVehicle(id, req.user?.id);

      res.json({
        success: true,
        message: "Vehicle unassigned successfully",
        vehicle: vehicle, // Use consistent key names
        data: vehicle, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get vehicle history (status changes, services, damages)
export const getVehicleHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle history request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    try {
      const result = await VehicleService.getVehicleHistory(id, {
        page: Number(page),
        limit: Number(limit),
        type: type as string,
      });

      res.json({
        success: true,
        history: result.history, // Use consistent key names
        data: result.history, // Keep 'data' for backward compatibility
        pagination: result.pagination,
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get vehicle rider history (assignments, handovers, returns)
export const getVehicleRiderHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle rider history request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;
    const { page = 1, limit = 20, includeMedia = true } = req.query;

    try {
      // Get handover records from vehicle service
      const result = await VehicleService.getVehicleRiderHistory(id, {
        page: Number(page),
        limit: Number(limit),
        includeMedia: includeMedia === "true" || includeMedia === true,
      });

      // Extend the data with rider information
      const enrichedHistory = await Promise.all(
        result.history.map(async (item: any) => {
          try {
            // Try to fetch rider information from environment variable or config
            const RIDER_SERVICE_URL =
              process.env.RIDER_SERVICE_URL || "http://localhost:4003";

            // Make a request to the rider service to get rider details
            const riderResponse = await fetch(
              `${RIDER_SERVICE_URL}/api/v1/riders/${item.riderId}`
            );

            if (riderResponse.ok) {
              const riderData: any = await riderResponse.json();
              return {
                ...item,
                riderDetails: riderData.data || { name: "Unknown Rider" },
              };
            }
          } catch (error) {
            Logger.error(
              `Failed to fetch rider details for rider ${item.riderId}`,
              error
            );
            // Continue without rider details if there's an error
          }

          // Return the original item if rider info fetch fails
          return {
            ...item,
            riderDetails: { name: "Unknown Rider", id: item.riderId },
          };
        })
      );

      res.json({
        success: true,
        history: enrichedHistory, // Use consistent key names
        data: enrichedHistory, // Keep 'data' for backward compatibility
        pagination: result.pagination,
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get vehicle stats
export const getVehicleStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle stats request received", {
      vehicleId: req.params.id,
      userId: req.user?.id,
    });

    const { id } = req.params;

    try {
      const stats = await VehicleService.getVehicleStats(id);

      res.json({
        success: true,
        stats: stats, // Use consistent key names
        data: stats, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      throw error; // Let the global error handler manage it
    }
  }
);

// Get analytics for all vehicles (dashboard stats)
export const getAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    Logger.info("Get vehicle analytics request received", {
      userId: req.user?.id,
    });

    try {
      // Simple implementation without complex queries
      const totalVehicles = await prisma.vehicle.count();
      const availableVehicles = await prisma.vehicle.count({
        where: { operationalStatus: "Available" },
      });
      const assignedVehicles = await prisma.vehicle.count({
        where: { operationalStatus: "Assigned" },
      });
      const underMaintenance = await prisma.vehicle.count({
        where: { operationalStatus: "Under Maintenance" },
      });
      const retired = await prisma.vehicle.count({
        where: { operationalStatus: "Retired" },
      });

      const stats = {
        totalVehicles,
        availableVehicles,
        assignedVehicles,
        underMaintenance,
        retired,
        activeVehicles: totalVehicles - retired,
        inactiveVehicles: retired,
        // Frontend-compatible format
        vehiclesByStatus: {
          Available: availableVehicles,
          Assigned: assignedVehicles,
          "Under Maintenance": underMaintenance,
          Retired: retired,
        },
        vehiclesByServiceStatus: {
          Active: availableVehicles + assignedVehicles,
          Inactive: underMaintenance + retired,
          "Scheduled for Service": 0, // TODO: Calculate actual scheduled services
        },
      };

      Logger.info("Analytics stats calculated:", stats);

      res.json({
        success: true,
        stats: stats, // Use consistent key names
        data: stats, // Keep 'data' for backward compatibility
      });
    } catch (error) {
      Logger.error("Analytics error details:", error);
      throw error; // Let the global error handler manage it
    }
  }
);
