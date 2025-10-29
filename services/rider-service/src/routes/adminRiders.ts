import express, { Request, Response } from "express";
import { prisma } from "../config/database";
import axios from "axios";
import { mapRider } from "../models/riderModels";
import { generateRiderId } from "../services/riderIdGenerator";

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

    console.log("Pagination Request:", {
      page,
      limit,
      search,
      registrationStatus,
      kycStatus,
      city,
      sortBy,
      sortOrder,
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    console.log(
      `Calculated pagination: page ${pageNum}, limit ${limitNum}, skip ${skip}`
    );

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
        { publicRiderId: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (registrationStatus) {
      where.registrationStatus = registrationStatus;
    }

    if (kycStatus) {
      console.log("🔍 BACKEND - KYC Status filter applied:", {
        received: kycStatus,
        type: typeof kycStatus,
        willQuery: kycStatus,
      });
      where.kycStatus = kycStatus;
    }

    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    // Store filter
    const storeId = req.query.storeId as string;
    if (storeId) {
      where.assignedStoreId = storeId;
    }

    console.log("Query where clause:", JSON.stringify(where));

    // Get riders with pagination and include KYC documents for verified selfies
    const [riders, totalCount] = await Promise.all([
      prisma.rider.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === "desc" ? "desc" : "asc",
        },
        include: {
          kycDocuments: {
            where: {
              documentType: "selfie",
              verificationStatus: "verified",
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      }),
      prisma.rider.count({ where }),
    ]);

    console.log(`Found ${riders.length} riders out of ${totalCount} total`);

    if (riders.length === 0 && totalCount > 0) {
      console.log(
        `⚠️ Warning: No riders returned despite totalCount being ${totalCount}. This suggests a pagination issue.`
      );

      // Try fetching the first page as a fallback if we're not already requesting page 1
      if (pageNum !== 1) {
        console.log("Falling back to first page data");
        const firstPageRiders = await prisma.rider.findMany({
          where,
          skip: 0,
          take: limitNum,
          orderBy: {
            [sortBy as string]: sortOrder === "desc" ? "desc" : "asc",
          },
          include: {
            kycDocuments: {
              where: {
                documentType: "selfie",
                verificationStatus: "verified",
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        });

        if (firstPageRiders.length > 0) {
          console.log(
            `Retrieved ${firstPageRiders.length} riders from the first page as fallback`
          );

          // Fetch store information for fallback riders
          const clientStoreServiceUrl =
            process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006";
          const vehicleServiceUrl =
            process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

          const ridersWithMetrics = await Promise.all(
            firstPageRiders.map(async (rider: any) => {
              let assignedStore = null;
              let assignedVehicle = null;

              // Fetch store details if rider has an assigned store
              if (rider.assignedStoreId) {
                try {
                  const storeResponse = await axios.get(
                    `${clientStoreServiceUrl}/internal/stores/${rider.assignedStoreId}`,
                    {
                      timeout: 3000,
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  if (storeResponse.data.success && storeResponse.data.data) {
                    const storeData = storeResponse.data.data;
                    assignedStore = {
                      id: storeData.id,
                      storeName: storeData.storeName,
                      storeCode: storeData.storeCode,
                      city: storeData.city,
                    };
                  }
                } catch (storeError) {
                  console.warn(
                    `Could not fetch store details for rider ${rider.id}:`,
                    storeError instanceof Error
                      ? storeError.message
                      : "Unknown error"
                  );
                }
              }

              // Fetch vehicle details if rider has an assigned vehicle
              if (rider.assignedVehicleId) {
                try {
                  const vehicleResponse = await axios.get(
                    `${vehicleServiceUrl}/api/v1/vehicles/${rider.assignedVehicleId}`,
                    {
                      timeout: 3000,
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  if (
                    vehicleResponse.data.success &&
                    vehicleResponse.data.data
                  ) {
                    const vehicleData = vehicleResponse.data.data;
                    assignedVehicle = {
                      id: vehicleData.id,
                      registrationNumber: vehicleData.registrationNumber,
                      operationalStatus: vehicleData.operationalStatus,
                    };
                  }
                } catch (vehicleError) {
                  console.warn(
                    `Could not fetch vehicle details for rider ${rider.id}:`,
                    vehicleError instanceof Error
                      ? vehicleError.message
                      : "Unknown error"
                  );
                }
              }

              return {
                ...rider,
                // Use actual isActive value from the database, ensure it's a proper boolean
                isActive: rider.isActive === true,
                // Extract the latest verified selfie URL from KYC documents
                selfie:
                  rider.kycDocuments?.[0]?.documentImageUrl ||
                  rider.selfie ||
                  null,
                // Remove kycDocuments from response to avoid sending too much data
                kycDocuments: undefined,
                // Add store information
                assignedStore,
                // Add vehicle information
                assignedVehicle,
                totalOrders: 0,
                averageRating: 0,
                totalEarnings: 0,
                completionRate: 0,
              };
            })
          );

          // Return the first page data but indicate we had a pagination issue
          return res.json({
            success: true,
            data: ridersWithMetrics,
            pagination: {
              page: 1, // Force page 1 for fallback
              limit: limitNum,
              totalItems: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
            },
            message: "Pagination error detected. Returned first page data.",
          });
        }
      }
    }

    // Fetch store information for riders with assigned stores
    const clientStoreServiceUrl =
      process.env.CLIENT_STORE_SERVICE_URL || "client-store-service:3006";
    const vehicleServiceUrl =
      process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

    const ridersWithStoreInfo = await Promise.all(
      riders.map(async (rider: any) => {
        let assignedStore = null;
        let assignedVehicle = null;

        // Fetch store details if rider has an assigned store
        if (rider.assignedStoreId) {
          try {
            const storeResponse = await axios.get(
              `${clientStoreServiceUrl}/internal/stores/${rider.assignedStoreId}`,
              {
                timeout: 3000,
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            );

            if (storeResponse.data.success && storeResponse.data.data) {
              const storeData = storeResponse.data.data;
              assignedStore = {
                id: storeData.id,
                storeName: storeData.storeName,
                storeCode: storeData.storeCode,
                city: storeData.city,
              };
            }
          } catch (storeError) {
            console.warn(
              `Could not fetch store details for rider ${rider.id}:`,
              storeError instanceof Error ? storeError.message : "Unknown error"
            );
            // Don't fail the request, just don't include store details
          }
        }

        // Fetch vehicle details if rider has an assigned vehicle
        if (rider.assignedVehicleId) {
          try {
            const vehicleResponse = await axios.get(
              `${vehicleServiceUrl}/api/v1/vehicles/${rider.assignedVehicleId}`,
              {
                timeout: 3000,
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            );

            if (vehicleResponse.data.success && vehicleResponse.data.data) {
              const vehicleData = vehicleResponse.data.data;
              assignedVehicle = {
                id: vehicleData.id,
                registrationNumber: vehicleData.registrationNumber,
                operationalStatus: vehicleData.operationalStatus,
              };
            }
          } catch (vehicleError) {
            console.warn(
              `Could not fetch vehicle details for rider ${rider.id}:`,
              vehicleError instanceof Error
                ? vehicleError.message
                : "Unknown error"
            );
            // Don't fail the request, just don't include vehicle details
          }
        }

        return {
          ...rider,
          // Use actual isActive value from the database, ensure it's a proper boolean
          isActive: rider.isActive === true,
          // Extract the latest verified selfie URL from KYC documents
          selfie:
            rider.kycDocuments?.[0]?.documentImageUrl || rider.selfie || null,
          // Remove kycDocuments from response to avoid sending too much data
          kycDocuments: undefined,
          // Add store information
          assignedStore,
          // Add vehicle information
          assignedVehicle,
          totalOrders: 0,
          averageRating: 0,
          totalEarnings: 0,
          completionRate: 0,
        };
      })
    );

    res.json({
      success: true,
      data: ridersWithStoreInfo,
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
 * Check if document numbers are unique (for frontend validation)
 */
router.get("/riders/check-unique", async (req: Request, res: Response) => {
  try {
    const { aadhaar, pan, dl, riderId } = req.query;

    const duplicates: { field: string; value: string }[] = [];

    // Check Aadhaar uniqueness
    if (aadhaar) {
      const where: any = { aadhaar: aadhaar as string };
      if (riderId) {
        where.NOT = { id: riderId as string };
      }
      const existing = await prisma.rider.findFirst({ where });
      if (existing) {
        duplicates.push({ field: "aadhaar", value: aadhaar as string });
      }
    }

    // Check PAN uniqueness
    if (pan) {
      const where: any = { pan: pan as string };
      if (riderId) {
        where.NOT = { id: riderId as string };
      }
      const existing = await prisma.rider.findFirst({ where });
      if (existing) {
        duplicates.push({ field: "pan", value: pan as string });
      }
    }

    // Check DL uniqueness
    if (dl) {
      const where: any = { dl: dl as string };
      if (riderId) {
        where.NOT = { id: riderId as string };
      }
      const existing = await prisma.rider.findFirst({ where });
      if (existing) {
        duplicates.push({ field: "dl", value: dl as string });
      }
    }

    res.json({
      success: true,
      isUnique: duplicates.length === 0,
      duplicates,
    });
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check uniqueness",
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
      // EV Rental fields
      needsEvRental,
      vehiclePreference,
      preferredVehicleModelId,
      ownVehicleType,
      // Work schedule field
      workType,
      // Store assignment fields
      assignedStoreId,
      assignedClientId,
      storeAssignmentNotes,
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

    // Check for duplicate Aadhaar
    if (aadharNumber) {
      const existingAadhaar = await prisma.rider.findUnique({
        where: { aadhaar: aadharNumber },
      });

      if (existingAadhaar) {
        return res.status(409).json({
          success: false,
          message: "A rider with this Aadhaar number already exists",
        });
      }
    }

    // Check for duplicate PAN
    if (panNumber) {
      const existingPAN = await prisma.rider.findUnique({
        where: { pan: panNumber },
      });

      if (existingPAN) {
        return res.status(409).json({
          success: false,
          message: "A rider with this PAN number already exists",
        });
      }
    }

    // Check for duplicate Driving License
    if (drivingLicenseNumber) {
      const existingDL = await prisma.rider.findUnique({
        where: { dl: drivingLicenseNumber },
      });

      if (existingDL) {
        return res.status(409).json({
          success: false,
          message: "A rider with this Driving License number already exists",
        });
      }
    }

    // Generate publicRiderId using existing riderIdGenerator service
    const publicRiderId = await generateRiderId({
      city: city,
      createdAt: new Date(),
    });

    console.log(
      `✅ Generated publicRiderId: ${publicRiderId} for rider: ${name} (${city})`
    );

    // Create new rider
    const rider = await prisma.rider.create({
      data: {
        publicRiderId, // Add generated public rider ID
        name,
        phone,
        email: email || null, // Add email field
        dob, // Keep as string to match schema
        address1,
        address2: address2 || null,
        city,
        state,
        pincode,
        aadhaar: aadharNumber || null, // Map to correct field name, null if empty
        pan: panNumber || null, // Map to correct field name, null if empty
        dl: drivingLicenseNumber || null, // Map to correct field name, null if empty
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        registrationStatus: "PENDING", // Registration starts as pending, will update to COMPLETED when KYC is verified
        kycStatus: "incomplete", // KYC is incomplete until documents are uploaded
        phoneVerified: true, // Assume phone is verified when admin creates
        consent: true, // Assume consent when admin creates
        agreementSigned: true,
        // EV Rental fields
        needsEvRental: needsEvRental || false,
        vehiclePreference: vehiclePreference || null,
        preferredVehicleModelId: preferredVehicleModelId || null,
        // Work schedule field
        workType: workType || null,
        // Store assignment fields
        assignedStoreId: assignedStoreId || null,
        assignedClientId: assignedClientId || null,
        storeAssignmentNotes: storeAssignmentNotes || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Rider created successfully",
      data: rider,
    });
  } catch (error: any) {
    console.error("Error creating rider:", error);

    // Check if it's a Prisma unique constraint error
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "unknown field";
      return res.status(409).json({
        success: false,
        message: `A rider with this ${field} already exists`,
        error: `Duplicate ${field}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "Unknown error",
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
      // EV Rental fields
      needsEvRental,
      vehiclePreference,
      preferredVehicleModelId,
      ownVehicleType,
      // Work schedule field
      workType,
      // Store assignment fields
      assignedStoreId,
      assignedClientId,
      storeAssignmentNotes,
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

    // If Aadhaar is being updated, check for conflicts
    if (aadharNumber && aadharNumber !== existingRider.aadhaar) {
      const aadhaarConflict = await prisma.rider.findUnique({
        where: { aadhaar: aadharNumber },
      });

      if (aadhaarConflict) {
        return res.status(409).json({
          success: false,
          message: "Another rider with this Aadhaar number already exists",
        });
      }
    }

    // If PAN is being updated, check for conflicts
    if (panNumber && panNumber !== existingRider.pan) {
      const panConflict = await prisma.rider.findUnique({
        where: { pan: panNumber },
      });

      if (panConflict) {
        return res.status(409).json({
          success: false,
          message: "Another rider with this PAN number already exists",
        });
      }
    }

    // If DL is being updated, check for conflicts
    if (drivingLicenseNumber && drivingLicenseNumber !== existingRider.dl) {
      const dlConflict = await prisma.rider.findUnique({
        where: { dl: drivingLicenseNumber },
      });

      if (dlConflict) {
        return res.status(409).json({
          success: false,
          message:
            "Another rider with this Driving License number already exists",
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      phone,
      email: email || null, // Add email field
      dob,
      address1,
      address2: address2 || null,
      city,
      state,
      pincode,
      aadhaar: aadharNumber || null,
      pan: panNumber || null,
      dl: drivingLicenseNumber || null,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    };

    // Add EV Rental fields if provided
    if (needsEvRental !== undefined) {
      updateData.needsEvRental = needsEvRental;
    }
    if (vehiclePreference !== undefined) {
      updateData.vehiclePreference = vehiclePreference || null;
    }
    if (preferredVehicleModelId !== undefined) {
      updateData.preferredVehicleModelId = preferredVehicleModelId || null;
    }
    // Handle ownVehicleType: when needsEvRental is false, store ownVehicleType in vehiclePreference
    if (ownVehicleType !== undefined && needsEvRental === false) {
      updateData.vehiclePreference = ownVehicleType || null;
    }

    // Add workType field if provided
    if (workType !== undefined) {
      updateData.workType = workType || null;
    }

    // Add store assignment fields if provided
    if (assignedStoreId !== undefined) {
      updateData.assignedStoreId = assignedStoreId;
    }
    if (assignedClientId !== undefined) {
      updateData.assignedClientId = assignedClientId;
    }
    if (storeAssignmentNotes !== undefined) {
      updateData.storeAssignmentNotes = storeAssignmentNotes;
    }

    console.log("[adminRiders] Updating rider with data:", {
      riderId,
      hasVehiclePreference: !!vehiclePreference,
      hasPreferredModel: !!preferredVehicleModelId,
      hasStoreAssignment: !!(assignedStoreId && assignedClientId),
      needsEvRental,
    });

    // Update rider
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: updateData,
    });

    console.log("[adminRiders] ✅ Rider updated successfully:", {
      id: updatedRider.id,
      vehiclePreference: updatedRider.vehiclePreference,
      preferredVehicleModelId: updatedRider.preferredVehicleModelId,
      assignedStoreId: updatedRider.assignedStoreId,
    });

    res.json({
      success: true,
      message: "Rider updated successfully",
      data: updatedRider,
    });
  } catch (error: any) {
    console.error("Error updating rider:", error);

    // Check if it's a Prisma unique constraint error
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "unknown field";
      return res.status(409).json({
        success: false,
        message: `A rider with this ${field} already exists`,
        error: `Duplicate ${field}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});

/**
 * Get rider by public rider ID
 * GET /riders/public/:publicRiderId
 */
router.get(
  "/riders/public/:publicRiderId",
  async (req: Request, res: Response) => {
    try {
      const { publicRiderId } = req.params;

      console.log(`Looking up rider by publicRiderId: ${publicRiderId}`);

      const rider = await prisma.rider.findFirst({
        where: { publicRiderId: publicRiderId },
      });

      if (!rider) {
        console.log(`Rider not found for publicRiderId: ${publicRiderId}`);
        return res.status(404).json({
          success: false,
          message: `Rider with public ID "${publicRiderId}" not found`,
        });
      }

      console.log(
        `Found rider: ${rider.id} for publicRiderId: ${publicRiderId}`
      );

      res.json({
        success: true,
        data: {
          id: rider.id,
          publicRiderId: rider.publicRiderId,
          name: rider.name,
          phone: rider.phone,
          email: rider.email,
          city: rider.city,
          registrationStatus: rider.registrationStatus,
          kycStatus: rider.kycStatus,
        },
      });
    } catch (error) {
      console.error("Error fetching rider by publicRiderId:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch rider",
      });
    }
  }
);

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
    // Using the actual isActive value from the database rather than computing it
    console.log(`Rider ${riderId} data from database:`, {
      id: rider.id,
      registrationStatus: rider.registrationStatus,
      isActive: rider.isActive,
      isActiveType: typeof rider.isActive,
      isActiveValue: rider.isActive === true ? "TRUE" : "FALSE",
      isActiveRaw: String(rider.isActive),
    });

    // Force a strict boolean conversion for isActive
    const strictIsActive = rider.isActive === true;

    let riderWithExtras: any = {
      ...rider,
      // Use actual isActive value from the database, ensure it's a proper boolean
      isActive: strictIsActive,
      email: rider.email, // Email field from database
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
      // Map vehiclePreference to ownVehicleType for frontend compatibility
      // When needsEvRental is false, vehiclePreference contains the own vehicle type
      ownVehicleType: !rider.needsEvRental ? rider.vehiclePreference : null,
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

    // Add debug logging for the response
    console.log(`Sending rider ${riderId} response:`, {
      id: riderWithExtras.id,
      registrationStatus: riderWithExtras.registrationStatus,
      isActive: riderWithExtras.isActive,
      isActiveType: typeof riderWithExtras.isActive,
      isActiveValueCheck: riderWithExtras.isActive === true ? "TRUE" : "FALSE",
      isActiveToString: String(riderWithExtras.isActive),
      isActiveJSON: JSON.stringify(riderWithExtras.isActive),
    });

    // Ensure we're sending a true boolean value, not a string or other type
    riderWithExtras.isActive = riderWithExtras.isActive === true;

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
 * Legacy rider statistics endpoint - DEPRECATED
 * This endpoint is kept for backward compatibility but has been replaced by the
 * more comprehensive stats endpoint at the bottom of this file.
 */
// router.get("/stats", async (req: Request, res: Response) => { ... }
// Endpoint removed to avoid route conflicts

/**
 * Update rider active status (activate/deactivate)
 * This endpoint only modifies the isActive field, not the registration status
 */
router.patch("/riders/:riderId/status", async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;
    const { isActive } = req.body;

    // Get the current rider data
    const currentRider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!currentRider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Check if rider has completed registration before activating
    if (isActive && currentRider.registrationStatus !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Cannot activate rider: Registration is not complete",
      });
    }

    // Ensure we're using a proper boolean value for the update
    // Convert request value to strict boolean
    const strictBooleanIsActive = isActive === true;

    console.log(`Updating rider status in database:`, {
      riderId,
      requestedIsActive: isActive,
      requestedType: typeof isActive,
      strictBooleanIsActive: strictBooleanIsActive,
      strictType: typeof strictBooleanIsActive,
    });

    // Since the Prisma client might not be updated to include isActive field,
    // we'll use the executeRaw approach but fix the syntax and ensure boolean conversion
    await prisma.$executeRaw`
      UPDATE "rider"."Rider"
      SET "isActive" = ${strictBooleanIsActive}
      WHERE "id" = ${riderId}
    `;

    // Fetch the updated rider
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      throw new Error("Failed to retrieve updated rider");
    }

    // Debug logging to verify isActive value
    console.log(`Rider status update - DB value after update:`, {
      riderId,
      requestedIsActive: isActive,
      actualDbIsActive: rider.isActive,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        registrationStatus: rider.registrationStatus,
      },
    });

    // Ensure we're returning a proper boolean value
    const responseIsActive = rider.isActive === true;

    console.log(`Sending response with isActive value:`, {
      rawDbValue: rider.isActive,
      rawDbType: typeof rider.isActive,
      convertedValue: responseIsActive,
      convertedType: typeof responseIsActive,
    });

    res.json({
      success: true,
      data: {
        ...rider,
        isActive: responseIsActive, // Strict boolean conversion before sending
      },
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
      const { activateImmediately = true } = req.body;

      // First, update the registration status
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          registrationStatus: "COMPLETED",
        },
      });

      // Then, update the isActive status separately using raw query during migration
      if (activateImmediately) {
        await prisma.$executeRaw`
          UPDATE "rider"."Rider"
          SET "isActive" = ${true}
          WHERE "id" = ${riderId}
        `;
      }

      // Get the updated rider
      const updatedRider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!updatedRider) {
        throw new Error("Failed to retrieve updated rider");
      }

      res.json({
        success: true,
        data: {
          ...updatedRider,
          isActive: activateImmediately, // Include computed isActive in the response
        },
        message: `Rider approved${
          activateImmediately ? " and activated" : ""
        } successfully`,
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

// Get rider KYC documents
// KYC documents route removed - now handled by kycRoutes.ts with proper pre-signed URL generation

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
    console.log(`🚗 Hub ID filter: ${hubId || "none"}`);

    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log(`🚗 Raw response status: ${response.status}`);
    console.log(`🚗 Raw response data type: ${typeof response.data}`);
    console.log(
      `🚗 Raw response data:`,
      JSON.stringify(response.data).substring(0, 200)
    );

    const vehicleData = response.data as {
      success: boolean;
      vehicles: any[]; // ✅ Changed from 'data' to 'vehicles'
    };

    console.log(
      `✅ Vehicle Service responded with ${
        vehicleData.vehicles?.length || 0
      } vehicles`
    );

    // Check if we got valid data
    if (!vehicleData.vehicles || !Array.isArray(vehicleData.vehicles)) {
      console.warn(
        "⚠️ Vehicle service returned invalid data format:",
        vehicleData
      );
      return res.json({
        success: true,
        data: [],
        message: "No vehicles data received from vehicle service",
      });
    }

    // Transform the data to match frontend expectations
    const vehicles = vehicleData.vehicles.map((vehicle: any) => ({
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
    console.error("Full error:", error);

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
      const {
        vehicleId,
        hubId,
        registrationNumber,
        vehicleMake,
        vehicleModel,
        startMileage,
        batteryPercentageStart,
        conditionOnAssign,
        notes,
        assignedBy,
        updatedBy,
      } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Vehicle ID is required",
        });
      }

      // ✅ NEW: Check rider eligibility for vehicle assignment
      const riderCheck = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!riderCheck) {
        return res.status(404).json({
          success: false,
          message: "Rider not found",
        });
      }

      // Check if registration is completed
      if (riderCheck.registrationStatus !== "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: `Vehicle assignment not allowed. Rider registration status is ${riderCheck.registrationStatus}. Complete the registration first.`,
        });
      }

      // Check if rider is active
      const riderIsActive = await prisma.$queryRaw<
        Array<{ isActive: boolean }>
      >`
        SELECT "isActive" FROM "rider"."Rider" WHERE "id" = ${riderId}
      `;

      const isActive = riderIsActive[0]?.isActive ?? false;

      if (!isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle assignment not allowed. Rider account is deactivated. Please activate the rider first.",
        });
      }

      // Check if rider has EV rental preference enabled
      if (!riderCheck.needsEvRental) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle assignment not allowed. Rider must have vehicle preference set to 'Yes' for EV rental. Please update the vehicle preference first.",
        });
      }

      // Fetch hub information if hubId is provided (for history tracking)
      let hubCode = null;
      let hubName = null;

      console.log(`🔍 [HUB FETCH] hubId provided: ${hubId}`);

      if (hubId) {
        console.log(
          `🔍 [HUB FETCH] Attempting to fetch hub details for hubId: ${hubId}`
        );
        try {
          const vehicleServiceUrl =
            process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

          console.log(
            `🔍 [HUB FETCH] Vehicle Service URL: ${vehicleServiceUrl}`
          );

          const hubResponse = await axios.get(
            `${vehicleServiceUrl}/api/v1/hubs/${hubId}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          console.log(
            `🔍 [HUB FETCH] Hub response received:`,
            hubResponse.data
          );

          if (hubResponse.data?.data) {
            hubCode = hubResponse.data.data.code;
            hubName = hubResponse.data.data.name;
            console.log(
              `✅ [HUB FETCH] Hub info fetched - Code: ${hubCode}, Name: ${hubName}`
            );
          } else {
            console.warn(`⚠️  [HUB FETCH] No data in hub response`);
          }
        } catch (hubError) {
          console.error(
            `❌ [HUB FETCH] Could not fetch hub information from vehicle service:`,
            hubError
          );
        }
      } else {
        console.log(`ℹ️  [HUB FETCH] No hubId provided, skipping hub fetch`);
      }

      console.log(
        `🔍 [HUB FETCH] Final values - hubCode: ${hubCode}, hubName: ${hubName}`
      );

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

        // Create a vehicle history record
        try {
          // Get vehicle details if not provided (especially registration number which is required)
          let vehicleDetails = {
            registrationNumber,
            vehicleMake,
            vehicleModel,
          };

          // If registration number wasn't provided, get it from the vehicle service
          if (!registrationNumber) {
            try {
              const vehicleResponse = await axios.get(
                `${vehicleServiceUrl}/api/v1/vehicles/${vehicleId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const vehicleData = vehicleResponse.data?.data;
              if (vehicleData) {
                vehicleDetails = {
                  registrationNumber: vehicleData.registrationNumber,
                  vehicleMake: vehicleData.make || vehicleMake,
                  vehicleModel: vehicleData.model || vehicleModel,
                };
              }
            } catch (vehicleDetailError) {
              console.warn(
                "Could not get vehicle details:",
                vehicleDetailError
              );
            }
          }

          if (vehicleDetails.registrationNumber) {
            const riderVehicleHistoryServiceUrl = `http://localhost:${
              process.env.PORT || 4005
            }/api/v1/vehicle-history`;

            // Use assignedBy from request body, fallback to "admin" only if not provided
            const finalAssignedBy = assignedBy || updatedBy || "admin";

            // Call the API to create a new vehicle assignment
            await axios.post(
              `${riderVehicleHistoryServiceUrl}/riders/${riderId}/vehicle-assignments`,
              {
                vehicleId,
                registrationNumber: vehicleDetails.registrationNumber,
                vehicleMake: vehicleDetails.vehicleMake,
                vehicleModel: vehicleDetails.vehicleModel,
                notes,
                hubId,
                hubCode,
                hubName,
                startMileage,
                batteryPercentageStart,
                conditionOnAssign,
                assignedBy: finalAssignedBy,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(
              `✅ Vehicle history record created for rider ${riderId}`
            );
          } else {
            console.warn(
              "Could not create vehicle history record: Missing registration number"
            );
          }
        } catch (historyError) {
          console.warn(
            "Could not create vehicle history record:",
            historyError
          );
          // Don't fail the request if history creation fails
        }
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
 * Assign vehicle to rider (duplicate route with admin prefix to handle both URL patterns)
 */
router.post(
  "/admin/riders/:riderId/assign-vehicle",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;
      const {
        vehicleId,
        hubId,
        registrationNumber,
        vehicleMake,
        vehicleModel,
        startMileage,
        batteryPercentageStart,
        conditionOnAssign,
        notes,
        assignedBy,
        updatedBy,
      } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Vehicle ID is required",
        });
      }

      // ✅ NEW: Check rider eligibility for vehicle assignment
      const riderCheck = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!riderCheck) {
        return res.status(404).json({
          success: false,
          message: "Rider not found",
        });
      }

      // Check if registration is completed
      if (riderCheck.registrationStatus !== "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: `Vehicle assignment not allowed. Rider registration status is ${riderCheck.registrationStatus}. Complete the registration first.`,
        });
      }

      // Check if rider is active
      const riderIsActive = await prisma.$queryRaw<
        Array<{ isActive: boolean }>
      >`
        SELECT "isActive" FROM "rider"."Rider" WHERE "id" = ${riderId}
      `;

      const isActive = riderIsActive[0]?.isActive ?? false;

      if (!isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle assignment not allowed. Rider account is deactivated. Please activate the rider first.",
        });
      }

      // Check if rider has EV rental preference enabled
      if (!riderCheck.needsEvRental) {
        return res.status(400).json({
          success: false,
          message:
            "Vehicle assignment not allowed. Rider must have vehicle preference set to 'Yes' for EV rental. Please update the vehicle preference first.",
        });
      }

      // Fetch hub information if hubId is provided (for history tracking)
      let hubCode = null;
      let hubName = null;

      console.log(`🔍 [ADMIN ROUTE - HUB FETCH] hubId provided: ${hubId}`);

      if (hubId) {
        console.log(
          `🔍 [ADMIN ROUTE - HUB FETCH] Attempting to fetch hub details for hubId: ${hubId}`
        );
        try {
          const vehicleServiceUrl =
            process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

          console.log(
            `🔍 [ADMIN ROUTE - HUB FETCH] Vehicle Service URL: ${vehicleServiceUrl}`
          );

          const hubResponse = await axios.get(
            `${vehicleServiceUrl}/api/v1/hubs/${hubId}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          console.log(
            `🔍 [ADMIN ROUTE - HUB FETCH] Hub response received:`,
            hubResponse.data
          );

          if (hubResponse.data?.data) {
            hubCode = hubResponse.data.data.code;
            hubName = hubResponse.data.data.name;
            console.log(
              `✅ [ADMIN ROUTE - HUB FETCH] Hub info fetched - Code: ${hubCode}, Name: ${hubName}`
            );
          } else {
            console.warn(
              `⚠️  [ADMIN ROUTE - HUB FETCH] No data in hub response`
            );
          }
        } catch (hubError) {
          console.error(
            `❌ [ADMIN ROUTE - HUB FETCH] Could not fetch hub information from vehicle service:`,
            hubError
          );
        }
      } else {
        console.log(
          `ℹ️  [ADMIN ROUTE - HUB FETCH] No hubId provided, skipping hub fetch`
        );
      }

      console.log(
        `🔍 [ADMIN ROUTE - HUB FETCH] Final values - hubCode: ${hubCode}, hubName: ${hubName}`
      );

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

        // Create a vehicle history record
        try {
          // Get vehicle details if not provided (especially registration number which is required)
          let vehicleDetails = {
            registrationNumber,
            vehicleMake,
            vehicleModel,
          };

          // If registration number wasn't provided, get it from the vehicle service
          if (!registrationNumber) {
            try {
              const vehicleResponse = await axios.get(
                `${vehicleServiceUrl}/api/v1/vehicles/${vehicleId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const vehicleData = vehicleResponse.data?.data;
              if (vehicleData) {
                vehicleDetails = {
                  registrationNumber: vehicleData.registrationNumber,
                  vehicleMake: vehicleData.make || vehicleMake,
                  vehicleModel: vehicleData.model || vehicleModel,
                };
              }
            } catch (vehicleDetailError) {
              console.warn(
                "Could not get vehicle details:",
                vehicleDetailError
              );
            }
          }

          if (vehicleDetails.registrationNumber) {
            const riderVehicleHistoryServiceUrl = `http://localhost:${
              process.env.PORT || 4005
            }/api/v1/vehicle-history`;

            // Use assignedBy from request body, fallback to "admin" only if not provided
            const finalAssignedBy = assignedBy || updatedBy || "admin";

            // Call the API to create a new vehicle assignment
            await axios.post(
              `${riderVehicleHistoryServiceUrl}/riders/${riderId}/vehicle-assignments`,
              {
                vehicleId,
                registrationNumber: vehicleDetails.registrationNumber,
                vehicleMake: vehicleDetails.vehicleMake,
                vehicleModel: vehicleDetails.vehicleModel,
                notes,
                hubId,
                hubCode,
                hubName,
                startMileage,
                batteryPercentageStart,
                conditionOnAssign,
                assignedBy: finalAssignedBy,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(
              `✅ Vehicle history record created for rider ${riderId}`
            );
          } else {
            console.warn(
              "Could not create vehicle history record: Missing registration number"
            );
          }
        } catch (historyError) {
          console.warn(
            "Could not create vehicle history record:",
            historyError
          );
          // Don't fail the request if history creation fails
        }
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

      console.log(`========== UNASSIGNMENT REQUEST - ROUTE LAYER ==========`);
      console.log(`Rider ID: ${riderId}`);
      console.log(`Request Body:`, JSON.stringify(req.body, null, 2));

      // Extract reason and user info from request body
      const { reason, notes, returnedBy, unassignedBy, updatedBy } = req.body;

      // Use provided values with fallbacks
      const finalNotes = notes || reason || "Unassigned via admin panel";
      const finalReturnedBy =
        returnedBy || unassignedBy || updatedBy || "admin";

      console.log(`Extracted values:`, {
        reason,
        notes,
        returnedBy,
        unassignedBy,
        updatedBy,
        finalNotes,
        finalReturnedBy,
      });

      console.log(`Unassigning vehicle from rider ${riderId}:`, {
        notes: finalNotes,
        returnedBy: finalReturnedBy,
      });

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

          // Additionally, update the vehicle history record using the vehicle history API
          try {
            // Call the vehicle-history API endpoint to return the vehicle
            const riderVehicleHistoryServiceUrl = `http://localhost:${
              process.env.PORT || 4005
            }/api/v1/vehicle-history`;

            // First get the active assignment
            const activeResponse = await axios.get(
              `${riderVehicleHistoryServiceUrl}/riders/${riderId}/vehicle-history/active`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const activeAssignment = activeResponse.data?.data;

            console.log(`Found active assignment:`, {
              id: activeAssignment?.id,
              riderId: activeAssignment?.riderId,
              vehicleId: activeAssignment?.vehicleId,
              hubCode: activeAssignment?.hubCode,
              hubName: activeAssignment?.hubName,
            });

            if (activeAssignment?.id) {
              console.log(`Calling vehicle history API to return vehicle:`, {
                assignmentId: activeAssignment.id,
                notes: finalNotes,
                returnedBy: finalReturnedBy,
              });

              // Return the vehicle using the vehicle history API with user-provided data
              const returnResponse = await axios.patch(
                `${riderVehicleHistoryServiceUrl}/vehicle-assignments/${activeAssignment.id}/return`,
                {
                  notes: finalNotes, // Use from request body
                  returnedBy: finalReturnedBy, // Use from request body
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log(
                `✅ Vehicle history API response:`,
                returnResponse.data
              );

              console.log(
                `✅ Vehicle history updated for rider ${riderId} with notes: "${finalNotes}" by ${finalReturnedBy}`
              );
            }
          } catch (historyError) {
            console.warn("Could not update vehicle history:", historyError);
            // Don't fail the request if history update fails
          }
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
 * Unassign vehicle from rider (duplicate route with admin prefix to handle both URL patterns)
 */
router.delete(
  "/admin/riders/:riderId/assign-vehicle",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      console.log(
        `========== UNASSIGNMENT REQUEST - ROUTE LAYER (ADMIN PREFIX) ==========`
      );
      console.log(`Rider ID: ${riderId}`);
      console.log(`Request Body:`, JSON.stringify(req.body, null, 2));

      // Extract reason and user info from request body
      const { reason, notes, returnedBy, unassignedBy, updatedBy } = req.body;

      // Use provided values with fallbacks
      const finalNotes = notes || reason || "Unassigned via admin panel";
      const finalReturnedBy =
        returnedBy || unassignedBy || updatedBy || "admin";

      console.log(`Extracted values:`, {
        reason,
        notes,
        returnedBy,
        unassignedBy,
        updatedBy,
        finalNotes,
        finalReturnedBy,
      });

      console.log(
        `Unassigning vehicle from rider ${riderId} (admin prefix route):`,
        {
          notes: finalNotes,
          returnedBy: finalReturnedBy,
        }
      );

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

      // We won't use the Prisma client directly for the history update since it might not be loaded yet
      // Instead, we'll call our vehicle history service API endpoint
      try {
        // Call the vehicle-history API endpoint to return the vehicle
        const riderVehicleHistoryServiceUrl = `http://localhost:${
          process.env.PORT || 4005
        }/api/v1/vehicle-history`;

        // First get the active assignment
        const activeResponse = await axios.get(
          `${riderVehicleHistoryServiceUrl}/riders/${riderId}/vehicle-history/active`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const activeAssignment = activeResponse.data?.data;

        if (activeAssignment?.id) {
          // Return the vehicle using the vehicle history API with user-provided data
          await axios.patch(
            `${riderVehicleHistoryServiceUrl}/vehicle-assignments/${activeAssignment.id}/return`,
            {
              notes: finalNotes, // Use from request body
              returnedBy: finalReturnedBy, // Use from request body
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          console.log(
            `✅ Vehicle history updated for rider ${riderId} with notes: "${finalNotes}" by ${finalReturnedBy}`
          );
        }
      } catch (historyError) {
        console.warn("Could not update vehicle history:", historyError);
        // Don't fail the request if history update fails
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

/**
 * Get rider statistics for the dashboard
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    console.log("Fetching rider statistics");

    // Get counts of riders by registration status
    const [
      totalRiders,
      activeRiders,
      inactiveRiders,
      pendingRiders,
      approvedRiders,
      rejectedRiders,
      pendingKycRiders,
      completedRegistrationRiders,
      waitingForApprovalRiders,
      vehicleAssignedRiders,
    ] = await Promise.all([
      prisma.rider.count(),
      prisma.rider.count({ where: { isActive: true } }),
      prisma.rider.count({ where: { isActive: false } }),
      prisma.rider.count({ where: { registrationStatus: "PENDING" } }),
      prisma.rider.count({ where: { registrationStatus: "APPROVED" } }),
      prisma.rider.count({ where: { registrationStatus: "REJECTED" } }),
      prisma.rider.count({ where: { registrationStatus: "KYC_PENDING" } }),
      prisma.rider.count({ where: { registrationStatus: "COMPLETED" } }),
      prisma.rider.count({
        where: { registrationStatus: "WAITING_FOR_APPROVAL" },
      }),
      prisma.rider.count({ where: { assignedVehicleId: { not: null } } }),
    ]);

    // Get registration trend data (mock for now)
    const last7DaysData = {
      labels: [
        "6 days ago",
        "5 days ago",
        "4 days ago",
        "3 days ago",
        "2 days ago",
        "Yesterday",
        "Today",
      ],
      data: [5, 8, 12, 6, 10, 15, 7],
    };

    // Return statistics
    res.json({
      success: true,
      data: {
        totalRiders,
        activeRiders,
        inactiveRiders,
        registrationStatusCounts: {
          pending: pendingRiders,
          approved: approvedRiders,
          rejected: rejectedRiders,
          kycPending: pendingKycRiders,
          completed: completedRegistrationRiders,
          waitingForApproval: waitingForApprovalRiders,
        },
        vehicleAssignedRiders,
        registrationTrend: last7DaysData,
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

export default router;
