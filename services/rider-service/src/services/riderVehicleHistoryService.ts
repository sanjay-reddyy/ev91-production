import { PrismaClient, Prisma } from "@prisma/client";
import { NotFoundError, BadRequestError } from "../utils/errors";

// Create a typed Prisma client that includes schema
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

// Utility function for logging
const logDebug = (message: string, data?: any) => {
  console.log(
    `[RiderVehicleHistory] ${message}`,
    data ? JSON.stringify(data) : ""
  );
};

// Service for handling rider-vehicle assignment history
const riderVehicleHistoryService = {
  // Get all vehicle history for a specific rider
  async getRiderVehicleHistory(riderId: string) {
    try {
      logDebug(`Getting vehicle history for rider: ${riderId}`);

      // Verify rider exists
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundError(`Rider with ID ${riderId} not found`);
      }

      // Use direct $queryRaw to handle schema issues
      const history: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "riderId" = ${riderId}
        ORDER BY "assignedAt" DESC
      `;

      logDebug(`Found ${history.length} history records for rider ${riderId}`);

      // Fetch hub information for records that have hubId
      const hubIds = history
        .filter((record) => record.hubId)
        .map((record) => record.hubId);

      let hubsMap = new Map();

      if (hubIds.length > 0) {
        try {
          // Try to fetch hub information from client_store schema
          const hubs: any[] = await prisma.$queryRaw`
            SELECT id, code, name FROM client_store.hubs
            WHERE id = ANY(${hubIds}::uuid[])
          `;

          // Create a map for quick lookup
          hubs.forEach((hub) => {
            hubsMap.set(hub.id, { code: hub.code, name: hub.name });
          });

          logDebug(`Fetched ${hubs.length} hub records`);
        } catch (hubError) {
          // If cross-schema query fails, log warning but continue
          logDebug(`Could not fetch hub information: ${hubError}`);
          // Hub data will be null, frontend will show "N/A"
        }
      }

      // Process the history records to ensure clean data structure
      const processedHistory = history.map((record) => {
        // First check if vehicleModel contains JSON data
        if (
          record.vehicleModel &&
          typeof record.vehicleModel === "string" &&
          record.vehicleModel.startsWith("{")
        ) {
          try {
            const vehicleData = JSON.parse(record.vehicleModel);
            // Extract proper vehicle information
            const vehicleMake =
              vehicleData.oem?.name ||
              vehicleData.oem?.displayName ||
              "Unknown";
            const vehicleModelName =
              vehicleData.name || vehicleData.modelCode || "Unknown";

            // Replace the JSON with proper values
            record.vehicleMake = vehicleMake;
            record.vehicleModel = vehicleModelName;

            // Log the conversion
            logDebug(`Converted JSON vehicleModel for record ${record.id}`, {
              oldValue: record.vehicleModel.substring(0, 50) + "...",
              newMake: vehicleMake,
              newModel: vehicleModelName,
            });
          } catch (e) {
            logDebug(
              `Error parsing vehicleModel JSON for record ${record.id}: ${e}`
            );
          }
        }

        // Get hub information from the map
        const hubInfo = record.hubId ? hubsMap.get(record.hubId) : null;

        // Handle any other fields
        return {
          ...record,
          vehicleDisplay: `${record.vehicleMake || "Unknown"} ${
            record.vehicleModel || "Unknown"
          }`,
          // Ensure registration number is displayed correctly
          registrationNumber: record.registrationNumber || "Unknown",
          // Add hub information if available
          hubCode: hubInfo?.code || null,
          hubName: hubInfo?.name || null,
        };
      });

      return processedHistory;
    } catch (error) {
      logDebug(
        `Error getting vehicle history: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Get current/active vehicle assignment for a rider
  async getActiveVehicleAssignment(riderId: string) {
    try {
      logDebug(`Getting active vehicle assignment for rider: ${riderId}`);

      // Use direct $queryRaw to handle schema issues
      const assignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "riderId" = ${riderId}
        AND status = 'ACTIVE'
        AND "returnedAt" IS NULL
        LIMIT 1
      `;

      const activeAssignment = assignments.length > 0 ? assignments[0] : null;
      logDebug(
        `Active assignment for rider ${riderId}: ${
          activeAssignment ? "FOUND" : "NONE"
        }`
      );

      return activeAssignment;
    } catch (error) {
      logDebug(
        `Error getting active vehicle assignment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Get history by vehicle ID
  async getHistoryByVehicleId(vehicleId: string) {
    try {
      logDebug(`Getting history for vehicle: ${vehicleId}`);

      const history: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "vehicleId" = ${vehicleId}
        ORDER BY "assignedAt" DESC
      `;

      logDebug(
        `Found ${history.length} history records for vehicle ${vehicleId}`
      );
      return history;
    } catch (error) {
      logDebug(
        `Error getting vehicle history: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Get complete rider history for a vehicle with enhanced data
  async getEnhancedVehicleHistory(
    vehicleId: string,
    options: { includeRiderDetails?: boolean } = {}
  ) {
    try {
      logDebug(`Getting enhanced history for vehicle: ${vehicleId}`);

      const history: any[] = await prisma.$queryRaw`
        SELECT rvh.*, r.name AS rider_name, r.phone AS rider_phone
        FROM rider.rider_vehicle_history rvh
        LEFT JOIN rider.rider r ON rvh."riderId" = r.id
        WHERE rvh."vehicleId" = ${vehicleId}
        ORDER BY rvh."assignedAt" DESC
      `;

      logDebug(
        `Found ${history.length} enhanced history records for vehicle ${vehicleId}`
      );

      // Process the history records to ensure clean data structure
      const processedHistory = history.map((record) => {
        // Create a clean history record with consistent properties
        return {
          id: record.id,
          riderId: record.riderId,
          vehicleId: record.vehicleId,
          registrationNumber: record.registrationNumber || "Unknown",
          assignedAt: record.assignedAt,
          returnedAt: record.returnedAt,
          assignedBy: record.assignedBy,
          returnedBy: record.returnedBy,
          startMileage: record.startMileage,
          endMileage: record.endMileage,
          batteryPercentageStart: record.batteryPercentageStart,
          batteryPercentageEnd: record.batteryPercentageEnd,
          conditionOnAssign: record.conditionOnAssign,
          conditionOnReturn: record.conditionOnReturn,
          damagesReported: record.damagesReported,
          riderFeedback: record.riderFeedback,
          issuesReported: record.issuesReported,
          status: record.status,
          notes: record.notes,
          // Enhanced rider data
          rider: {
            id: record.riderId,
            name: record.rider_name || "Unknown Rider",
            phone: record.rider_phone,
          },
          // Create consistent vehicle display data
          vehicle: {
            id: record.vehicleId,
            registrationNumber: record.registrationNumber || "Unknown",
            make: record.vehicleMake || "Unknown",
            model: record.vehicleModel || "Unknown",
          },
        };
      });

      return processedHistory;
    } catch (error) {
      logDebug(
        `Error getting enhanced vehicle history: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Assign a vehicle to a rider
  async assignVehicleToRider(
    riderId: string,
    vehicleId: string,
    registrationNumber: string,
    assignedBy: string,
    data: {
      vehicleMake?: string;
      vehicleModel?: string;
      notes?: string;
      hubId?: string;
      hubCode?: string;
      hubName?: string;
      startMileage?: number;
      batteryPercentageStart?: number;
      conditionOnAssign?: string;
    }
  ) {
    try {
      logDebug(`Assigning vehicle ${vehicleId} to rider ${riderId}`, data);

      // Check if rider exists
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new NotFoundError(`Rider with ID ${riderId} not found`);
      }

      // Check if rider already has an active vehicle using direct query
      const activeAssignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "riderId" = ${riderId}
        AND status = 'ACTIVE'
        AND "returnedAt" IS NULL
      `;

      if (activeAssignments.length > 0) {
        throw new BadRequestError(
          "Rider already has an active vehicle assignment"
        );
      }

      // Create a new vehicle assignment history record using direct query
      const now = new Date();
      const assignmentId = await prisma.$executeRaw`
        INSERT INTO rider.rider_vehicle_history (
          id, "riderId", "vehicleId", "registrationNumber", "assignedBy",
          "vehicleMake", "vehicleModel", notes, "hubId", "hubCode", "hubName",
          "startMileage", "batteryPercentageStart", "conditionOnAssign",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${riderId}, ${vehicleId}, ${registrationNumber}, ${assignedBy},
          ${data.vehicleMake || null}, ${data.vehicleModel || null}, ${
        data.notes || null
      }, ${data.hubId || null}, ${data.hubCode || null}, ${
        data.hubName || null
      },
          ${data.startMileage || null}, ${
        data.batteryPercentageStart || null
      }, ${data.conditionOnAssign || null},
          ${now}, ${now}
        )
      `;

      // Update the rider's current vehicle assignment
      await prisma.rider.update({
        where: { id: riderId },
        data: {
          assignedVehicleId: vehicleId,
          assignmentDate: new Date(),
          hubId: data.hubId || null,
        },
      });

      // Get the newly created assignment
      const newAssignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "riderId" = ${riderId}
        AND "vehicleId" = ${vehicleId}
        AND "assignedBy" = ${assignedBy}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

      const newAssignment =
        newAssignments.length > 0 ? newAssignments[0] : null;
      logDebug(
        `Vehicle ${vehicleId} assigned to rider ${riderId} successfully`
      );

      return newAssignment;
    } catch (error) {
      logDebug(
        `Error assigning vehicle: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Return a vehicle from a rider
  async returnVehicleFromRider(
    assignmentId: string,
    returnedBy: string,
    data: {
      notes?: string;
      endMileage?: number;
      batteryPercentageEnd?: number;
      conditionOnReturn?: string;
      damagesReported?: string;
      riderFeedback?: string;
      issuesReported?: string;
    }
  ) {
    try {
      logDebug(`========== RETURNING VEHICLE - SERVICE LAYER ==========`);
      logDebug(`Assignment ID: ${assignmentId}`);
      logDebug(`Returned By: ${returnedBy}`);
      logDebug(`Data:`, data);

      // Find the assignment using direct query
      const assignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE id = ${assignmentId}
      `;

      if (assignments.length === 0) {
        throw new NotFoundError(`Assignment with ID ${assignmentId} not found`);
      }

      const assignment = assignments[0];
      logDebug(`Found assignment:`, {
        id: assignment.id,
        riderId: assignment.riderId,
        vehicleId: assignment.vehicleId,
        status: assignment.status,
        hubId: assignment.hubId,
        hubCode: assignment.hubCode,
        hubName: assignment.hubName,
        currentNotes: assignment.notes,
        assignedBy: assignment.assignedBy,
      });

      if (assignment.status !== "ACTIVE" || assignment.returnedAt) {
        throw new BadRequestError("Vehicle is not currently assigned to rider");
      }

      // Prepare notes with append logic
      const updatedNotes = data.notes
        ? `${assignment.notes || ""} | Return: ${data.notes}`
        : assignment.notes;

      logDebug(`Updating assignment with:`, {
        returnedBy,
        updatedNotes,
        endMileage: data.endMileage,
        batteryPercentageEnd: data.batteryPercentageEnd,
        conditionOnReturn: data.conditionOnReturn,
      });

      // Update the assignment with return details using direct query
      const now = new Date();
      await prisma.$executeRaw`
        UPDATE rider.rider_vehicle_history
        SET
          "returnedAt" = ${now},
          "returnedBy" = ${returnedBy},
          "status" = 'RETURNED',
          "endMileage" = ${data.endMileage || null},
          "batteryPercentageEnd" = ${data.batteryPercentageEnd || null},
          "conditionOnReturn" = ${data.conditionOnReturn || null},
          "damagesReported" = ${data.damagesReported || null},
          "riderFeedback" = ${data.riderFeedback || null},
          "issuesReported" = ${data.issuesReported || null},
          "notes" = ${updatedNotes || null},
          "updatedAt" = ${now}
        WHERE id = ${assignmentId}
      `;

      // Update the rider record to remove current vehicle assignment
      await prisma.rider.update({
        where: { id: assignment.riderId },
        data: {
          assignedVehicleId: null,
          assignmentDate: null,
          hubId: null,
        },
      });

      // Get the updated assignment
      const updatedAssignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE id = ${assignmentId}
      `;

      const updatedAssignment =
        updatedAssignments.length > 0 ? updatedAssignments[0] : null;

      logDebug(
        `✅ SERVICE LAYER: Vehicle returned successfully. Final record:`,
        {
          id: updatedAssignment?.id,
          returnedBy: updatedAssignment?.returnedBy,
          notes: updatedAssignment?.notes,
          hubCode: updatedAssignment?.hubCode,
          hubName: updatedAssignment?.hubName,
          returnedAt: updatedAssignment?.returnedAt,
          status: updatedAssignment?.status,
        }
      );

      return updatedAssignment;
    } catch (error) {
      logDebug(
        `Error returning vehicle: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Get a specific assignment by ID
  async getAssignmentById(assignmentId: string) {
    try {
      logDebug(`Getting assignment by ID: ${assignmentId}`);

      const assignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE id = ${assignmentId}
      `;

      if (assignments.length === 0) {
        throw new NotFoundError(`Assignment with ID ${assignmentId} not found`);
      }

      return assignments[0];
    } catch (error) {
      logDebug(
        `Error getting assignment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Add a direct method to unassign a vehicle without an assignment ID
  async unassignVehicleByRiderId(
    riderId: string,
    returnedBy: string,
    data?: {
      notes?: string;
      endMileage?: number;
      batteryPercentageEnd?: number;
      conditionOnReturn?: string;
    }
  ) {
    try {
      logDebug(`Direct unassign vehicle for rider ${riderId}`);

      // First find the active assignment
      const activeAssignments: any[] = await prisma.$queryRaw`
        SELECT * FROM rider.rider_vehicle_history
        WHERE "riderId" = ${riderId}
        AND status = 'ACTIVE'
        AND "returnedAt" IS NULL
      `;

      if (activeAssignments.length === 0) {
        throw new NotFoundError(
          `No active vehicle assignment found for rider ${riderId}`
        );
      }

      const activeAssignment = activeAssignments[0];

      // Return the vehicle using the standard method
      return this.returnVehicleFromRider(activeAssignment.id, returnedBy, {
        notes: data?.notes || "Unassigned via API",
        endMileage: data?.endMileage,
        batteryPercentageEnd: data?.batteryPercentageEnd,
        conditionOnReturn: data?.conditionOnReturn,
      });
    } catch (error) {
      logDebug(
        `Error unassigning vehicle by rider ID: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  // Debugging helper to diagnose issues
  async debugVehicleHistoryTable() {
    try {
      logDebug("Running vehicle history table diagnostics");

      // Check if table exists
      const tableCheck: any[] = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'rider'
          AND table_name = 'rider_vehicle_history'
        );
      `;

      const tableExists = tableCheck[0].exists;

      if (!tableExists) {
        return {
          status: "ERROR",
          message: "rider_vehicle_history table does not exist",
          tableExists,
        };
      }

      // Check table structure
      const columns: any[] = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'rider'
        AND table_name = 'rider_vehicle_history';
      `;

      // Count records
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM rider.rider_vehicle_history;
      `;

      const count = parseInt(countResult[0].count);

      // Get a sample of records if any exist
      let samples: any[] = [];
      if (count > 0) {
        samples = await prisma.$queryRaw`
          SELECT * FROM rider.rider_vehicle_history LIMIT 3;
        `;
      }

      return {
        status: "OK",
        tableExists,
        columns: columns.map((c) => ({
          name: c.column_name,
          type: c.data_type,
        })),
        recordCount: count,
        sampleRecords: samples,
      };
    } catch (error) {
      return {
        status: "ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export default riderVehicleHistoryService;
