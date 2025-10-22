import { Request, Response } from "express";
import riderVehicleHistoryService from "../services/riderVehicleHistoryService";
import { asyncHandler } from "../utils/errors";

// Helper function to sanitize vehicle data
const sanitizeVehicleData = (data: any) => {
  let sanitizedVehicleMake = data.vehicleMake;
  let sanitizedVehicleModel = data.vehicleModel;

  // Check if vehicleModel is a JSON string
  if (
    typeof data.vehicleModel === "string" &&
    data.vehicleModel.startsWith("{")
  ) {
    try {
      const vehicleData = JSON.parse(data.vehicleModel);
      sanitizedVehicleMake =
        vehicleData.oem?.name ||
        vehicleData.oem?.displayName ||
        sanitizedVehicleMake ||
        "Unknown";
      sanitizedVehicleModel =
        vehicleData.name ||
        vehicleData.modelCode ||
        sanitizedVehicleModel ||
        "Unknown";
      console.log(
        `Parsed vehicle JSON to make=${sanitizedVehicleMake}, model=${sanitizedVehicleModel}`
      );
    } catch (e) {
      console.error("Error parsing vehicleModel JSON:", e);
    }
  }

  return {
    ...data,
    vehicleMake: sanitizedVehicleMake,
    vehicleModel: sanitizedVehicleModel,
  };
};

// Extend the Express Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

// Controller for rider-vehicle assignment history
const riderVehicleHistoryController = {
  // Get all vehicle history for a specific rider
  getRiderVehicleHistory: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { riderId } = req.params;
      const history = await riderVehicleHistoryService.getRiderVehicleHistory(
        riderId
      );

      // Ensure clean data for frontend by processing any potential vehicle JSON
      const processedHistory = Array.isArray(history)
        ? history.map((item) => {
            const record = { ...item };

            // Add formatted display fields for frontend use
            if (!record.vehicleDisplay) {
              const make =
                record.vehicleMake ||
                record.vehicle?.oem?.name ||
                record.vehicle?.oem?.displayName ||
                "Unknown";
              const model =
                record.vehicleModel ||
                record.vehicle?.name ||
                record.vehicle?.modelCode ||
                "Unknown";
              record.vehicleDisplay = `${make} ${model}`;
            }

            return record;
          })
        : history;

      res.status(200).json({
        success: true,
        data: processedHistory,
      });
    }
  ),

  // Get active vehicle assignment for a rider
  getActiveVehicleAssignment: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { riderId } = req.params;
      const activeAssignment =
        await riderVehicleHistoryService.getActiveVehicleAssignment(riderId);

      res.status(200).json({
        success: true,
        data: activeAssignment,
      });
    }
  ),

  // Assign a vehicle to a rider
  assignVehicleToRider: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { riderId } = req.params;
      const {
        vehicleId,
        registrationNumber,
        vehicleMake,
        vehicleModel,
        notes,
        hubId,
        hubCode,
        hubName,
        startMileage,
        batteryPercentageStart,
        conditionOnAssign,
        assignedBy: assignedByFromBody,
        updatedBy,
      } = req.body;

      // Use assignedBy from request body first, then updatedBy, then JWT token, then fallback to "System"
      const assignedBy =
        assignedByFromBody || updatedBy || req.user?.id || "System";

      console.log(
        `[VehicleHistory] Assigning vehicle with assignedBy: ${assignedBy}, notes: ${notes}, hubCode: ${hubCode}, hubName: ${hubName}`
      );

      // Sanitize vehicle make and model data while preserving all other fields
      const sanitizedData = sanitizeVehicleData({
        vehicleMake,
        vehicleModel,
        notes,
        hubId,
        hubCode,
        hubName,
        startMileage,
        batteryPercentageStart,
        conditionOnAssign,
      });

      console.log(
        `[VehicleHistory] Sanitized data:`,
        JSON.stringify(sanitizedData, null, 2)
      );

      const newAssignment =
        await riderVehicleHistoryService.assignVehicleToRider(
          riderId,
          vehicleId,
          registrationNumber,
          assignedBy,
          sanitizedData
        );

      res.status(201).json({
        success: true,
        data: newAssignment,
      });
    }
  ),

  // Return a vehicle from a rider
  returnVehicleFromRider: asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { assignmentId } = req.params;
      const {
        notes,
        returnedBy: returnedByFromBody,
        unassignedBy,
        updatedBy,
        endMileage,
        batteryPercentageEnd,
        conditionOnReturn,
        damagesReported,
        riderFeedback,
        issuesReported,
      } = req.body;

      // Use returnedBy from request body first, then try alternative names, then JWT token, then fallback to "System"
      const returnedBy =
        returnedByFromBody ||
        unassignedBy ||
        updatedBy ||
        req.user?.id ||
        "System";

      console.log(
        `[VehicleHistory] ========== RETURN VEHICLE REQUEST ==========`
      );
      console.log(`[VehicleHistory] Assignment ID: ${assignmentId}`);
      console.log(
        `[VehicleHistory] Request Body:`,
        JSON.stringify(req.body, null, 2)
      );
      console.log(`[VehicleHistory] Extracted Values:`, {
        notes,
        returnedByFromBody,
        unassignedBy,
        updatedBy,
        finalReturnedBy: returnedBy,
        endMileage,
        batteryPercentageEnd,
        conditionOnReturn,
      });
      console.log(
        `[VehicleHistory] Returning vehicle with returnedBy: ${returnedBy}, notes: ${notes}`
      );

      const updatedAssignment =
        await riderVehicleHistoryService.returnVehicleFromRider(
          assignmentId,
          returnedBy,
          {
            notes,
            endMileage,
            batteryPercentageEnd,
            conditionOnReturn,
            damagesReported,
            riderFeedback,
            issuesReported,
          }
        );

      console.log(
        `[VehicleHistory] ✅ Vehicle returned successfully. Updated record:`,
        {
          id: updatedAssignment?.id,
          returnedBy: updatedAssignment?.returnedBy,
          notes: updatedAssignment?.notes,
          returnedAt: updatedAssignment?.returnedAt,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedAssignment,
      });
    }
  ),

  // Get a specific assignment by ID
  getAssignmentById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { assignmentId } = req.params;
    const assignment = await riderVehicleHistoryService.getAssignmentById(
      assignmentId
    );

    res.status(200).json({
      success: true,
      data: assignment,
    });
  }),

  // Get vehicle history by vehicle ID (enhanced with rider details)
  getVehicleHistory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId } = req.params;
    const { includeRiderDetails = true } = req.query;

    const history = await riderVehicleHistoryService.getEnhancedVehicleHistory(
      vehicleId,
      {
        includeRiderDetails:
          includeRiderDetails === "true" || includeRiderDetails === true,
      }
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  }),
};

export default riderVehicleHistoryController;
