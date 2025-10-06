import express from "express";
import riderVehicleHistoryController from "../controllers/riderVehicleHistoryController";

const router = express.Router();

// Get all vehicle history for a specific rider
router.get(
  "/riders/:riderId/vehicle-history",
  riderVehicleHistoryController.getRiderVehicleHistory
);

// Get active vehicle assignment for a rider
router.get(
  "/riders/:riderId/vehicle-history/active",
  riderVehicleHistoryController.getActiveVehicleAssignment
);

// Assign a vehicle to a rider
router.post(
  "/riders/:riderId/vehicle-assignments",
  riderVehicleHistoryController.assignVehicleToRider
);

// Return a vehicle from a rider
router.patch(
  "/vehicle-assignments/:assignmentId/return",
  riderVehicleHistoryController.returnVehicleFromRider
);

// Get a specific assignment by ID
router.get(
  "/vehicle-assignments/:assignmentId",
  riderVehicleHistoryController.getAssignmentById
);

// Get complete history for a vehicle
router.get(
  "/vehicles/:vehicleId/history",
  riderVehicleHistoryController.getVehicleHistory
);

export default router;
