import express, { Request, Response } from "express";
import { prisma } from "../config/database";
import axios from "axios";

const router = express.Router();

// ==========================================
// ADMIN RIDER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Get all riders with filtering, pagination, and search
 */
router.get("/riders", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      registrationStatus,
      kycStatus,
      city,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
      ];
    }

    if (registrationStatus) {
      where.registrationStatus = registrationStatus;
    }

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    // Get riders with pagination
    const [riders, totalCount] = await Promise.all([
      prisma.rider.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === "desc" ? "desc" : "asc",
        },
      }),
      prisma.rider.count({ where }),
    ]);

    // Add basic metrics (will be enhanced later)
    const ridersWithMetrics = riders.map((rider) => ({
      ...rider,
      isActive: rider.registrationStatus === "COMPLETED",
      totalOrders: 0,
      averageRating: 0,
      totalEarnings: 0,
      completionRate: 0,
    }));

    res.json({
      success: true,
      data: ridersWithMetrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch riders",
    });
  }
});

/**
 * Create new rider (Admin only)
 */
router.post("/riders", async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      dob,
      address1,
      address2,
      city,
      state,
      pincode,
      aadharNumber,
      panNumber,
      drivingLicenseNumber,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !phone ||
      !dob ||
      !address1 ||
      !city ||
      !state ||
      !pincode ||
      !aadharNumber ||
      !panNumber ||
      !drivingLicenseNumber ||
      !emergencyName ||
      !emergencyPhone ||
      !emergencyRelation
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if rider with phone already exists
    const existingRider = await prisma.rider.findUnique({
      where: { phone },
    });

    if (existingRider) {
      return res.status(409).json({
        success: false,
        message: "Rider with this phone number already exists",
      });
    }

    // Create new rider
    const rider = await prisma.rider.create({
      data: {
        name,
        phone,
        dob, // Keep as string to match schema
        address1,
        address2: address2 || null,
        city,
        state,
        pincode,
        aadhaar: aadharNumber, // Map to correct field name
        pan: panNumber, // Map to correct field name
        dl: drivingLicenseNumber, // Map to correct field name
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        registrationStatus: "KYC_COMPLETED", // Admin-created riders are pre-approved
        kycStatus: "pending", // KYC still needs to be verified
        phoneVerified: true, // Assume phone is verified when admin creates
        consent: true, // Assume consent when admin creates
        agreementSigned: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Rider created successfully",
      data: rider,
    });
  } catch (error) {
    console.error("Error creating rider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Update rider information (Admin only)
 */
router.put("/riders/:riderId", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const {
      name,
      phone,
      email,
      dob,
      address1,
      address2,
      city,
      state,
      pincode,
      aadharNumber,
      panNumber,
      drivingLicenseNumber,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    } = req.body;

    // Check if rider exists
    const existingRider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // If phone is being updated, check for conflicts
    if (phone && phone !== existingRider.phone) {
      const phoneConflict = await prisma.rider.findUnique({
        where: { phone },
      });

      if (phoneConflict) {
        return res.status(409).json({
          success: false,
          message: "Another rider with this phone number already exists",
        });
      }
    }

    // Update rider
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        name,
        phone,
        dob,
        address1,
        address2: address2 || null,
        city,
        state,
        pincode,
        aadhaar: aadharNumber,
        pan: panNumber,
        dl: drivingLicenseNumber,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
      },
    });

    res.json({
      success: true,
      message: "Rider updated successfully",
      data: updatedRider,
    });
  } catch (error) {
    console.error("Error updating rider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * Get rider by ID with full details
 */
router.get("/riders/:riderId", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Add computed fields to match frontend expectations
    let riderWithExtras: any = {
      ...rider,
      isActive: rider.registrationStatus === "COMPLETED",
      email: null, // Not in current schema
      phoneVerified: rider.phoneVerified,
      address1: rider.address1,
      address2: rider.address2,
      aadharNumber: rider.aadhaar,
      panNumber: rider.pan,
      drivingLicenseNumber: rider.dl,
      assignedVehicleId: rider.assignedVehicleId,
      assignedStoreId: rider.assignedStoreId,
      assignedClientId: rider.assignedClientId,
      storeAssignmentDate: rider.storeAssignmentDate?.toISOString(),
      storeAssignmentNotes: rider.storeAssignmentNotes,
    };

    // If rider has an assigned vehicle, fetch vehicle details
    if (rider.assignedVehicleId) {
      try {
        const vehicleServiceUrl =
          process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

        const vehicleResponse = await axios.get(
          `${vehicleServiceUrl}/api/v1/vehicles/${rider.assignedVehicleId}`,
          {
            timeout: 5000,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (vehicleResponse.data.success) {
          const vehicleData = vehicleResponse.data.data;

          riderWithExtras.assignedVehicle = {
            id: vehicleData.id,
            make: vehicleData.model?.oem?.name || "Unknown",
            model: vehicleData.model?.name || "Unknown",
            registrationNumber: vehicleData.registrationNumber,
            vehicleType: vehicleData.vehicleType || "2-Wheeler",
            fuelType: vehicleData.model?.fuelType || "Electric",
            assignedDate:
              rider.assignmentDate?.toISOString() || new Date().toISOString(),
          };

          console.log(`✅ Fetched vehicle details for rider ${riderId}`);
        }
      } catch (vehicleServiceError) {
        console.warn(
          `Could not fetch vehicle details for rider ${riderId}:`,
          vehicleServiceError
        );
        // Don't fail the request, just don't include vehicle details
      }
    }

    res.json({
      success: true,
      data: riderWithExtras,
    });
  } catch (error) {
    console.error("Error fetching rider:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rider",
    });
  }
});

/**
 * Get rider statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [
      totalRiders,
      completedRegistrations,
      pendingRegistrations,
      pendingKYC,
      verifiedRiders,
    ] = await Promise.all([
      prisma.rider.count(),
      prisma.rider.count({ where: { registrationStatus: "COMPLETED" } }),
      prisma.rider.count({ where: { registrationStatus: "PENDING" } }),
      prisma.rider.count({ where: { kycStatus: "pending" } }),
      prisma.rider.count({ where: { kycStatus: "verified" } }),
    ]);

    res.json({
      success: true,
      data: {
        totalRiders,
        activeRiders: completedRegistrations,
        pendingRegistrations,
        pendingKYC,
        verifiedRiders,
        totalEarnings: 0,
        averageRating: 0,
        completionRate: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching rider stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rider statistics",
    });
  }
});

/**
 * Update rider status (activate/deactivate)
 */
router.patch("/riders/:riderId/status", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const { isActive } = req.body;

    const status = isActive ? "COMPLETED" : "PENDING";

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: { registrationStatus: status },
    });

    res.json({
      success: true,
      data: { ...rider, isActive },
      message: `Rider ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update rider status",
    });
  }
});

/**
 * Approve rider registration
 */
router.patch(
  "/riders/:riderId/approve",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          registrationStatus: "COMPLETED",
        },
      });

      res.json({
        success: true,
        data: { ...rider, isActive: true },
        message: "Rider approved successfully",
      });
    } catch (error) {
      console.error("Error approving rider:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve rider",
      });
    }
  }
);

/**
 * Reject rider registration
 */
router.patch("/riders/:riderId/reject", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const { reason } = req.body;

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        registrationStatus: "REJECTED",
      },
    });

    res.json({
      success: true,
      data: { ...rider, isActive: false },
      message: "Rider rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting rider:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject rider",
    });
  }
});

// Placeholder endpoints for frontend compatibility
router.get("/riders/:riderId/kyc", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get("/riders/:riderId/orders", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get("/riders/:riderId/earnings", async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get(
  "/riders/:riderId/earnings/summary",
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        totalEarnings: 0,
        totalOrders: 0,
        averageEarningPerOrder: 0,
        totalDistance: 0,
      },
    });
  }
);

/**
 * Get available vehicles for assignment filtered by hub
 */
router.get("/vehicles/available", async (req: Request, res: Response) => {
  try {
    const { hubId } = req.query;

    // Make API call to vehicle service to get available vehicles
    const vehicleServiceUrl =
      process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

    let apiUrl = `${vehicleServiceUrl}/api/v1/vehicles?operationalStatus=Available&serviceStatus=Active`;
    if (hubId) {
      apiUrl += `&hubId=${hubId}`;
    }

    console.log(`🚗 Fetching vehicles from: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const vehicleData = response.data as {
      success: boolean;
      data: any[];
    };

    console.log(
      `✅ Vehicle Service responded with ${
        vehicleData.data?.length || 0
      } vehicles`
    );

    // Transform the data to match frontend expectations
    const vehicles = vehicleData.data.map((vehicle: any) => ({
      id: vehicle.id,
      make: vehicle.model?.oem?.name || "Unknown",
      model: vehicle.model?.name || "Unknown",
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType || "2-Wheeler",
      fuelType: vehicle.model?.fuelType || "Electric",
      hubId: vehicle.hubId,
      hubName: vehicle.hub?.name || "Unknown Hub",
    }));

    res.json({
      success: true,
      data: vehicles,
    });
  } catch (error: any) {
    console.error("❌ Error in vehicles endpoint:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch available vehicles",
      error: error.message,
      data: [],
    });
  }
});

/**
 * Get available hubs for dropdown
 */
router.get("/hubs", async (req: Request, res: Response) => {
  try {
    // Make API call to vehicle service to get hubs
    const vehicleServiceUrl =
      process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";
    const apiUrl = `${vehicleServiceUrl}/api/v1/hubs?status=Active`;

    try {
      const response = await axios.get(apiUrl);
      const hubData = response.data as {
        success: boolean;
        data: any[];
      };

      // Transform the data to ensure it has the expected structure
      const transformedHubs = hubData.data.map((hub: any) => ({
        id: hub.id,
        name: hub.name,
        code: hub.code,
        city: { name: hub.cityName || hub.city?.name || "Unknown City" },
        address: hub.address || "No address provided",
        hubType: hub.hubType || "Storage",
        vehicleCapacity: hub.vehicleCapacity || 0,
        chargingPoints: hub.chargingPoints || 0,
      }));

      res.json({
        success: true,
        data: transformedHubs,
      });
    } catch (vehicleServiceError) {
      console.warn(
        "Vehicle service not accessible, using mock data:",
        vehicleServiceError
      );

      // Return mock hubs data if vehicle service is not accessible
      const mockHubs = [
        {
          id: "hub1",
          name: "Central Hub",
          code: "CH001",
          city: { name: "Mumbai" },
          address: "123 Central Street, Mumbai",
          hubType: "Distribution",
          vehicleCapacity: 50,
          chargingPoints: 10,
        },
        {
          id: "hub2",
          name: "North Hub",
          code: "NH001",
          city: { name: "Delhi" },
          address: "456 North Avenue, Delhi",
          hubType: "Storage",
          vehicleCapacity: 30,
          chargingPoints: 6,
        },
        {
          id: "hub3",
          name: "South Hub",
          code: "SH001",
          city: { name: "Bangalore" },
          address: "789 South Road, Bangalore",
          hubType: "Distribution",
          vehicleCapacity: 40,
          chargingPoints: 8,
        },
      ];

      res.json({
        success: true,
        data: mockHubs,
      });
    }
  } catch (error) {
    console.error("Error in hubs endpoint:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hubs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Assign vehicle to rider
 */
router.post(
  "/riders/:riderId/assign-vehicle",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;
      const { vehicleId, hubId } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Vehicle ID is required",
        });
      }

      // Update rider with vehicle assignment
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          assignedVehicleId: vehicleId,
          assignmentDate: new Date(),
          hubId: hubId || null,
        },
      });

      // Also call vehicle service to update vehicle assignment
      try {
        const vehicleServiceUrl =
          process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

        await axios.post(
          `${vehicleServiceUrl}/api/v1/vehicles/${vehicleId}/assign`,
          {
            riderId: riderId,
            assignmentNotes: `Assigned to rider ${rider.name || rider.phone}`,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          `✅ Vehicle ${vehicleId} assigned to rider ${riderId} in vehicle service`
        );
      } catch (vehicleServiceError) {
        console.warn("Could not update vehicle service:", vehicleServiceError);
      }

      res.json({
        success: true,
        data: {
          ...rider,
          isActive: rider.registrationStatus === "COMPLETED",
        },
        message: "Vehicle assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign vehicle",
      });
    }
  }
);

/**
 * Unassign vehicle from rider
 */
router.delete(
  "/riders/:riderId/assign-vehicle",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      // Get current rider to get vehicle ID
      const currentRider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!currentRider) {
        return res.status(404).json({
          success: false,
          message: "Rider not found",
        });
      }

      const vehicleId = currentRider.assignedVehicleId;

      // Update rider to remove vehicle assignment
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          assignedVehicleId: null,
          assignmentDate: null,
          hubId: null,
        },
      });

      // Also call vehicle service to unassign vehicle
      if (vehicleId) {
        try {
          const vehicleServiceUrl =
            process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

          await axios.post(
            `${vehicleServiceUrl}/api/v1/vehicles/${vehicleId}/unassign`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          console.log(
            `✅ Vehicle ${vehicleId} unassigned from rider ${riderId} in vehicle service`
          );
        } catch (vehicleServiceError) {
          console.warn(
            "Could not update vehicle service:",
            vehicleServiceError
          );
        }
      }

      res.json({
        success: true,
        data: {
          ...rider,
          isActive: rider.registrationStatus === "COMPLETED",
        },
        message: "Vehicle unassigned successfully",
      });
    } catch (error) {
      console.error("Error unassigning vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to unassign vehicle",
      });
    }
  }
);

/**
 * Assign rider to store
 */
router.post(
  "/riders/:riderId/assign-store",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;
      const { storeId, clientId, notes } = req.body;

      if (!storeId || !clientId) {
        return res.status(400).json({
          success: false,
          message: "Store ID and Client ID are required",
        });
      }

      // Update rider with store assignment
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          assignedStoreId: storeId,
          assignedClientId: clientId,
          storeAssignmentDate: new Date(),
          storeAssignmentNotes: notes || null,
        },
      });

      res.json({
        success: true,
        data: {
          ...rider,
          isActive: rider.registrationStatus === "COMPLETED",
        },
        message: "Store assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning store:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign store",
      });
    }
  }
);

/**
 * Unassign store from rider
 */
router.delete(
  "/riders/:riderId/assign-store",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      // Update rider to remove store assignment
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          assignedStoreId: null,
          assignedClientId: null,
          storeAssignmentDate: null,
          storeAssignmentNotes: null,
        },
      });

      res.json({
        success: true,
        data: {
          ...rider,
          isActive: rider.registrationStatus === "COMPLETED",
        },
        message: "Store unassigned successfully",
      });
    } catch (error) {
      console.error("Error unassigning store:", error);
      res.status(500).json({
        success: false,
        message: "Failed to unassign store",
      });
    }
  }
);

export default router;
