import { prisma } from "../index";
import {
  VehicleCreateData,
  VehicleUpdateData,
  VehicleResponse,
  VehicleStatus,
  QueryParams,
} from "../types";
import {
  Validator,
  PaginationHelper,
  ErrorHandler,
  Logger,
  CostCalculator,
  DateCalculator,
  AppError,
} from "../utils";
import { PrismaClient, Prisma } from "@prisma/client";

export class VehicleService {
  /**
   * Create a new vehicle with RC and Insurance details (Fully Transactional)
   */
  static async createVehicle(
    data: VehicleCreateData,
    userId?: string
  ): Promise<VehicleResponse> {
    Logger.info("Creating vehicle", {
      registrationNumber: data.registrationNumber,
    });

    try {
      // Pre-validation for chassis number format (fail fast)
      Logger.debug("Starting pre-validation", {
        chassisNumber: data.chassisNumber,
        modelId: data.modelId,
        hubId: data.hubId,
      });

      if (data.chassisNumber && !Validator.isValidVIN(data.chassisNumber)) {
        Logger.error("Invalid chassis number format", {
          chassisNumber: data.chassisNumber,
        });
        throw ErrorHandler.handleValidationError(
          "chassisNumber",
          "Invalid chassis number format"
        );
      }

      if (!data.hubId) {
        Logger.error("Hub ID missing", { data });
        throw ErrorHandler.handleValidationError(
          "hubId",
          "Hub assignment is mandatory for vehicle creation"
        );
      }

      // Use transaction for ALL database operations and validations
      Logger.debug("Starting comprehensive database transaction");
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Check for duplicate registration number within transaction
          Logger.debug("Checking for existing vehicle in transaction", {
            registrationNumber: data.registrationNumber,
          });
          const existingVehicle = await tx.vehicle.findUnique({
            where: { registrationNumber: data.registrationNumber },
          });

          if (existingVehicle) {
            Logger.error("Duplicate registration number found", {
              registrationNumber: data.registrationNumber,
            });
            throw ErrorHandler.createError(
              "Vehicle with this registration number already exists",
              "DUPLICATE_RECORD",
              409
            );
          }

          // Check for duplicate chassis number if provided
          if (data.chassisNumber) {
            const existingChassis = await tx.vehicle.findFirst({
              where: { chassisNumber: data.chassisNumber },
            });

            if (existingChassis) {
              Logger.error("Duplicate chassis number found", {
                chassisNumber: data.chassisNumber,
              });
              throw ErrorHandler.createError(
                "Vehicle with this chassis number already exists",
                "DUPLICATE_CHASSIS",
                409
              );
            }
          }

          // Check for duplicate RC number if provided
          if (data.rcNumber) {
            const existingRC = await tx.rCDetails.findFirst({
              where: { rcNumber: data.rcNumber },
            });

            if (existingRC) {
              Logger.error("Duplicate RC number found", {
                rcNumber: data.rcNumber,
              });
              throw ErrorHandler.createError(
                "Vehicle with this RC number already exists",
                "DUPLICATE_RC",
                409
              );
            }
          }

          // Check for duplicate insurance policy number if provided
          if (data.insuranceNumber) {
            const existingInsurance = await tx.insuranceDetails.findFirst({
              where: { policyNumber: data.insuranceNumber },
            });

            if (existingInsurance) {
              Logger.error("Duplicate insurance policy number found", {
                policyNumber: data.insuranceNumber,
              });
              throw ErrorHandler.createError(
                "Vehicle with this insurance policy number already exists",
                "DUPLICATE_INSURANCE",
                409
              );
            }
          }

          // Validate that model exists within transaction
          Logger.debug("Validating vehicle model in transaction", {
            modelId: data.modelId,
          });
          const vehicleModel = await tx.vehicleModel.findUnique({
            where: { id: data.modelId },
            include: { oem: true },
          });

          if (!vehicleModel) {
            Logger.error("Vehicle model not found", { modelId: data.modelId });
            throw ErrorHandler.handleNotFoundError("Vehicle model");
          }

          // TODO: Add hub validation within transaction
          // const hub = await tx.hub.findUnique({
          //   where: { id: data.hubId },
          //   include: { city: true }
          // });
          // if (!hub) {
          //   throw ErrorHandler.handleNotFoundError('Hub');
          // }
          // if (hub.status !== 'Active') {
          //   throw ErrorHandler.createError('Cannot assign vehicle to inactive hub', 'HUB_INACTIVE', 400);
          // }

          // Calculate age
          Logger.debug("Calculating vehicle age", {
            registrationDate: data.registrationDate,
            purchaseDate: data.purchaseDate,
          });
          const registrationDateToUse = data.registrationDate
            ? new Date(data.registrationDate)
            : new Date();
          const ageInMonths = DateCalculator.calculateVehicleAge(
            registrationDateToUse,
            data.purchaseDate ? new Date(data.purchaseDate) : undefined
          );

          // Prepare vehicle data
          Logger.debug("Preparing vehicle data", { ageInMonths });
          const vehicleData = this.prepareVehicleData(
            data,
            vehicleModel,
            ageInMonths,
            registrationDateToUse
          );

          Logger.debug("Final vehicle data prepared", vehicleData);

          // Create the vehicle
          Logger.debug("Creating vehicle record in transaction");
          const vehicle = await tx.vehicle.create({
            data: vehicleData,
            include: {
              model: {
                include: { oem: true },
              },
            },
          });

          Logger.debug("Vehicle created successfully", {
            vehicleId: vehicle.id,
          });

          // Create RC Details if provided (within same transaction)
          let rcDetails = null;
          if (this.hasRCData(data)) {
            Logger.debug("Creating RC details in transaction");
            rcDetails = await this.createRCDetails(
              tx,
              vehicle.id,
              data,
              registrationDateToUse,
              vehicleModel
            );
            Logger.debug("RC details created", { rcDetailsId: rcDetails?.id });
          }

          // Create Insurance Details if provided (within same transaction)
          let insuranceDetails = null;
          if (this.hasInsuranceData(data)) {
            Logger.debug("Creating insurance details in transaction");
            insuranceDetails = await this.createInsuranceDetails(
              tx,
              vehicle.id,
              data
            );
            Logger.debug("Insurance details created", {
              insuranceDetailsId: insuranceDetails?.id,
            });
          }

          // Create initial status history entry (within same transaction)
          Logger.debug("Creating status history entry in transaction");
          await tx.vehicleStatusHistory.create({
            data: {
              vehicleId: vehicle.id,
              newStatus: data.operationalStatus || "Available",
              changeReason: "Vehicle created",
              changedBy: userId || "system",
            },
          });

          Logger.debug("Status history entry created");

          // Return vehicle with all related data
          Logger.debug("Fetching complete vehicle data");
          return await tx.vehicle.findUnique({
            where: { id: vehicle.id },
            include: {
              model: {
                include: { oem: true },
              },
              hub: {
                include: { city: true },
              },
              rcDetails: true,
              insuranceDetails: true,
              statusHistory: true,
            },
          });
        },
        {
          maxWait: 10000, // 10 seconds
          timeout: 30000, // 30 seconds
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      Logger.info("Vehicle created successfully", { vehicleId: result?.id });

      // Transform the response to match VehicleResponse interface
      if (result) {
        Logger.debug("Transforming vehicle response");
        const response: VehicleResponse = {
          id: result.id,
          modelId: result.modelId,
          hubId: result.hubId,
          registrationNumber: result.registrationNumber,
          chassisNumber: result.chassisNumber || undefined,
          engineNumber: result.engineNumber || undefined,
          variant: result.variant || undefined,
          color: result.color,
          year: result.year || undefined,
          vehicleType: result.vehicleType || undefined,
          batteryType: result.batteryType || undefined,
          batteryCapacity: result.batteryCapacity || undefined,
          maxRange: result.maxRange || undefined,
          maxSpeed: result.maxSpeed || undefined,
          purchaseDate: result.purchaseDate || undefined,
          registrationDate: result.registrationDate,
          purchasePrice: result.purchasePrice || undefined,
          currentValue: result.currentValue || undefined,
          ageInMonths: result.ageInMonths || undefined,
          fleetOperatorId: result.fleetOperatorId || undefined,
          currentRiderId: result.currentRiderId || undefined,
          assignmentDate: result.assignmentDate || undefined,
          operationalStatus: result.operationalStatus,
          serviceStatus: result.serviceStatus,
          location: result.location || undefined,
          mileage: result.mileage,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          hub: result.hub
            ? {
                id: result.hub.id,
                hubName: result.hub.name,
                hubCode: result.hub.code,
                address: result.hub.address,
                city: {
                  id: result.hub.city.id,
                  name: result.hub.city.name,
                  displayName: result.hub.city.displayName,
                },
              }
            : undefined,
        };
        Logger.debug("Vehicle response transformed successfully");
        return response;
      }

      throw new Error("Failed to create vehicle - transaction returned null");
    } catch (error) {
      Logger.error("Failed to create vehicle", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        registrationNumber: data.registrationNumber,
        chassisNumber: data.chassisNumber,
      });

      // Enhanced error handling for better user feedback
      if (error instanceof AppError) {
        throw error; // Re-throw AppError as-is
      }

      // Handle transaction timeout or deadlock
      if (error instanceof Error && error.message.includes("transaction")) {
        Logger.error("Transaction failed", { error: error.message });
        throw ErrorHandler.createError(
          "Transaction failed. Please try again.",
          "TRANSACTION_FAILED",
          500
        );
      }

      // Default error handling
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Cleanup orphaned vehicle data (for failed transactions)
   * This method can be called periodically to clean up any data that might be left behind
   */
  static async cleanupOrphanedData(): Promise<void> {
    Logger.info("Starting cleanup of orphaned vehicle data");

    try {
      await prisma.$transaction(async (tx) => {
        // Find vehicles created in the last hour with no related records
        const recentVehicles = await tx.vehicle.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
            },
          },
          include: {
            rcDetails: true,
            insuranceDetails: true,
            statusHistory: true,
          },
        });

        const orphanedVehicles = recentVehicles.filter(
          (vehicle) =>
            !vehicle.rcDetails &&
            !vehicle.insuranceDetails &&
            vehicle.statusHistory.length === 0
        );

        if (orphanedVehicles.length > 0) {
          Logger.warn(
            `Found ${orphanedVehicles.length} potentially orphaned vehicles`
          );

          // Note: Be very careful with automatic cleanup
          // For now, just log them for manual review
          orphanedVehicles.forEach((vehicle) => {
            Logger.warn("Orphaned vehicle found", {
              id: vehicle.id,
              registrationNumber: vehicle.registrationNumber,
              createdAt: vehicle.createdAt,
            });
          });
        }
      });
    } catch (error) {
      Logger.error("Failed to cleanup orphaned data", error);
    }
  }

  /**
   * Get vehicles with filtering and pagination
   */
  static async getVehicles(params: QueryParams): Promise<{
    vehicles: VehicleResponse[];
    pagination: any;
  }> {
    const { page, limit, skip } = PaginationHelper.sanitizeQueryParams(params);

    // Build filter conditions
    const where = this.buildVehicleFilters(params);

    try {
      // Get total count for pagination
      const total = await prisma.vehicle.count({ where });

      // Get vehicles
      const vehicles = await prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
        include: {
          model: {
            include: { oem: true },
          },
          hub: {
            include: { city: true },
          },
          rcDetails: true,
          insuranceDetails: true,
          statusHistory: {
            orderBy: { changeDate: "desc" },
            take: 1,
          },
          damageRecords: {
            orderBy: { reportedDate: "desc" },
          },
        },
      });

      const pagination = PaginationHelper.calculatePagination(
        total,
        page,
        limit
      );

      return { vehicles: vehicles as any[], pagination };
    } catch (error) {
      Logger.error("Failed to fetch vehicles", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicleById(id: string): Promise<VehicleResponse> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          model: {
            include: { oem: true },
          },
          hub: {
            include: { city: true },
          },
          rcDetails: true,
          insuranceDetails: true,
          statusHistory: {
            orderBy: { changeDate: "desc" },
          },
          damageRecords: {
            orderBy: { reportedDate: "desc" },
          },
          serviceHistory: {
            orderBy: { serviceDate: "desc" },
            take: 5,
          },
        },
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError("Vehicle");
      }

      // Transform the response to match VehicleResponse interface
      const response: VehicleResponse = {
        ...vehicle,
        chassisNumber: vehicle.chassisNumber || undefined,
        engineNumber: vehicle.engineNumber || undefined,
        variant: vehicle.variant || undefined,
        year: vehicle.year || undefined,
        vehicleType: vehicle.vehicleType || undefined,
        batteryType: vehicle.batteryType || undefined,
        batteryCapacity: vehicle.batteryCapacity || undefined,
        maxRange: vehicle.maxRange || undefined,
        maxSpeed: vehicle.maxSpeed || undefined,
        purchaseDate: vehicle.purchaseDate || undefined,
        purchasePrice: vehicle.purchasePrice || undefined,
        currentValue: vehicle.currentValue || undefined,
        ageInMonths: vehicle.ageInMonths || undefined,
        fleetOperatorId: vehicle.fleetOperatorId || undefined,
        currentRiderId: vehicle.currentRiderId || undefined,
        assignmentDate: vehicle.assignmentDate || undefined,
        location: vehicle.location || undefined,
        hub: vehicle.hub
          ? {
              id: vehicle.hub.id,
              hubName: vehicle.hub.name,
              hubCode: vehicle.hub.code,
              address: vehicle.hub.address,
              city: {
                id: vehicle.hub.city.id,
                name: vehicle.hub.city.name,
                displayName: vehicle.hub.city.displayName,
              },
            }
          : undefined,
      };

      return response;
    } catch (error) {
      Logger.error("Failed to fetch vehicle", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(
    id: string,
    data: VehicleUpdateData,
    userId?: string
  ): Promise<VehicleResponse> {
    try {
      console.log("🔄 Updating vehicle:", { id, data, userId });

      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: { model: true },
      });

      if (!existingVehicle) {
        throw ErrorHandler.handleNotFoundError("Vehicle");
      }

      // Create a clean update object, removing any undefined or null values
      const cleanUpdateData: any = {};
      const rcUpdateData: any = {};
      const insuranceUpdateData: any = {};

      // Copy only valid fields with proper validation
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Vehicle table fields
          const vehicleFields = [
            "modelId",
            "hubId",
            "registrationNumber",
            "chassisNumber",
            "engineNumber",
            "variant",
            "color",
            "year",
            "vehicleType",
            "batteryType",
            "batteryCapacity",
            "maxRange",
            "maxSpeed",
            "purchaseDate",
            "registrationDate",
            "purchasePrice",
            "currentValue",
            "ageInMonths",
            "fleetOperatorId",
            "currentRiderId",
            "operationalStatus",
            "serviceStatus",
            "location",
            "mileage",
          ];

          // RC Details fields
          const rcFields = [
            "rcNumber",
            "rcExpiryDate",
            "ownerName",
            "ownerAddress",
            "seatingCapacity",
          ];

          // Insurance Details fields
          const insuranceFields = [
            "insuranceNumber",
            "insuranceProvider",
            "insuranceExpiryDate",
            "insuranceType",
            "premiumAmount",
            "coverageAmount",
          ];

          if (vehicleFields.includes(key)) {
            cleanUpdateData[key] = value;
          } else if (rcFields.includes(key)) {
            rcUpdateData[key] = value;
          } else if (insuranceFields.includes(key)) {
            insuranceUpdateData[key] = value;
          } else {
            console.warn(`Skipping unknown field: ${key} = ${value}`);
          }
        }
      });

      console.log("🔄 Clean update data (before date conversion):", {
        vehicle: cleanUpdateData,
        rc: rcUpdateData,
        insurance: insuranceUpdateData,
      });

      // Update age if dates changed
      if (cleanUpdateData.registrationDate || cleanUpdateData.purchaseDate) {
        const regDate = cleanUpdateData.registrationDate
          ? new Date(cleanUpdateData.registrationDate)
          : existingVehicle.registrationDate;
        const purchaseDate = cleanUpdateData.purchaseDate
          ? new Date(cleanUpdateData.purchaseDate)
          : existingVehicle.purchaseDate;
        cleanUpdateData.ageInMonths = DateCalculator.calculateVehicleAge(
          regDate,
          purchaseDate || undefined
        );
      }

      // Convert date strings to Date objects and validate numeric fields
      const updateData = this.prepareDateFields(cleanUpdateData);

      console.log("🔄 Final update data (after date conversion):", updateData);

      // Use transaction to update vehicle and related data
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Update the vehicle
          const vehicle = await tx.vehicle.update({
            where: { id },
            data: {
              ...updateData,
              updatedAt: new Date(),
            },
            include: {
              model: {
                include: { oem: true },
              },
              rcDetails: true,
              insuranceDetails: true,
            },
          });

          // Update RC Details if provided
          if (Object.keys(rcUpdateData).length > 0) {
            console.log("🔄 Updating RC details:", rcUpdateData);

            // Prepare RC data with proper field mapping
            const rcData: any = {};
            if (rcUpdateData.rcNumber) rcData.rcNumber = rcUpdateData.rcNumber;
            if (rcUpdateData.rcExpiryDate)
              rcData.validUpto = new Date(rcUpdateData.rcExpiryDate);
            if (rcUpdateData.ownerName)
              rcData.ownerName = rcUpdateData.ownerName;
            if (rcUpdateData.ownerAddress)
              rcData.ownerAddress = rcUpdateData.ownerAddress;
            if (rcUpdateData.seatingCapacity)
              rcData.seatingCapacity = Number(rcUpdateData.seatingCapacity);

            // Check if RC details exist
            const existingRC = await tx.rCDetails.findUnique({
              where: { vehicleId: id },
            });

            if (existingRC) {
              // Update existing RC details
              await tx.rCDetails.update({
                where: { vehicleId: id },
                data: rcData,
              });
            } else {
              // Create new RC details
              await tx.rCDetails.create({
                data: {
                  vehicleId: id,
                  registrationDate:
                    existingVehicle.registrationDate || new Date(),
                  fuelType: "Electric", // Default for electric vehicles
                  ...rcData,
                },
              });
            }
          }

          // Update Insurance Details if provided
          if (Object.keys(insuranceUpdateData).length > 0) {
            console.log("🔄 Updating insurance details:", insuranceUpdateData);

            // Prepare insurance data with proper field mapping
            const insuranceData: any = {};
            if (insuranceUpdateData.insuranceNumber)
              insuranceData.policyNumber = insuranceUpdateData.insuranceNumber;
            if (insuranceUpdateData.insuranceProvider)
              insuranceData.providerName =
                insuranceUpdateData.insuranceProvider;
            if (insuranceUpdateData.insuranceType)
              insuranceData.insuranceType = insuranceUpdateData.insuranceType;
            if (insuranceUpdateData.insuranceExpiryDate)
              insuranceData.policyEndDate = new Date(
                insuranceUpdateData.insuranceExpiryDate
              );
            if (insuranceUpdateData.premiumAmount)
              insuranceData.premiumAmount = Number(
                insuranceUpdateData.premiumAmount
              );
            if (insuranceUpdateData.coverageAmount)
              insuranceData.coverageAmount = Number(
                insuranceUpdateData.coverageAmount
              );

            // Check if insurance details exist
            const existingInsurance = await tx.insuranceDetails.findFirst({
              where: { vehicleId: id },
            });

            if (existingInsurance) {
              // Update existing insurance details
              await tx.insuranceDetails.update({
                where: { id: existingInsurance.id },
                data: insuranceData,
              });
            } else {
              // Create new insurance details
              await tx.insuranceDetails.create({
                data: {
                  vehicleId: id,
                  policyStartDate: new Date(),
                  ...insuranceData,
                },
              });
            }
          }

          // Return updated vehicle with all related data
          return await tx.vehicle.findUnique({
            where: { id },
            include: {
              model: {
                include: { oem: true },
              },
              rcDetails: true,
              insuranceDetails: true,
              statusHistory: {
                orderBy: { changeDate: "desc" },
              },
            },
          });
        }
      );

      // Create status history if status changed
      if (
        data.operationalStatus &&
        data.operationalStatus !== existingVehicle.operationalStatus
      ) {
        await this.createStatusHistory(
          id,
          existingVehicle.operationalStatus,
          data.operationalStatus,
          userId
        );
      }

      console.log("✅ Vehicle updated successfully:", result?.id);
      Logger.info("Vehicle updated successfully", { vehicleId: id });
      return result as VehicleResponse;
    } catch (error) {
      console.error("❌ Failed to update vehicle:", error);
      Logger.error("Failed to update vehicle", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Delete vehicle
   */
  static async deleteVehicle(id: string): Promise<void> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError("Vehicle");
      }

      await prisma.vehicle.delete({
        where: { id },
      });

      Logger.info("Vehicle deleted successfully", { vehicleId: id });
    } catch (error) {
      Logger.error("Failed to delete vehicle", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Update vehicle status
   */
  static async updateVehicleStatus(
    id: string,
    newStatus: VehicleStatus,
    changeReason: string,
    userId?: string
  ): Promise<VehicleResponse> {
    try {
      // Validate newStatus parameter
      if (!newStatus) {
        throw ErrorHandler.handleValidationError(
          "newStatus",
          "New status is required"
        );
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!vehicle) {
        throw ErrorHandler.handleNotFoundError("Vehicle");
      }

      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Update vehicle status
          const updatedVehicle = await tx.vehicle.update({
            where: { id },
            data: {
              operationalStatus: newStatus,
              updatedAt: new Date(),
            },
            include: {
              model: {
                include: { oem: true },
              },
              rcDetails: true,
              insuranceDetails: true,
            },
          });

          // Create status history entry
          await tx.vehicleStatusHistory.create({
            data: {
              vehicleId: id,
              previousStatus: vehicle.operationalStatus,
              newStatus: newStatus,
              changeReason: changeReason || "",
              changedBy: userId || "system",
            },
          });

          return updatedVehicle;
        }
      );

      Logger.info("Vehicle status updated", { vehicleId: id, newStatus });
      return result as VehicleResponse;
    } catch (error) {
      Logger.error("Failed to update vehicle status", error);
      throw ErrorHandler.handlePrismaError(error);
    }
  }

  // Private helper methods
  private static prepareVehicleData(
    data: VehicleCreateData,
    vehicleModel: any,
    ageInMonths: number,
    registrationDate: Date
  ) {
    const vehicleData: any = {
      modelId: data.modelId,
      hubId: data.hubId, // Include hubId as it's mandatory
      registrationNumber: data.registrationNumber,
      color: data.color,
      year: data.year,
      vehicleType: data.vehicleType || vehicleModel.vehicleType,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      registrationDate,
      ageInMonths,
      operationalStatus: data.operationalStatus || "Available",
      serviceStatus: data.serviceStatus || "Active",
      mileage: data.mileage || 0,
    };

    // Handle numeric fields with proper conversion
    if (data.batteryCapacity) {
      vehicleData.batteryCapacity = CostCalculator.parseNumericValue(
        data.batteryCapacity
      );
    } else if (vehicleModel.batteryCapacity) {
      vehicleData.batteryCapacity = CostCalculator.parseNumericValue(
        vehicleModel.batteryCapacity
      );
    }

    // Add optional fields only if they have values
    const optionalFields = [
      "chassisNumber",
      "engineNumber",
      "variant",
      "batteryType",
      "maxRange",
      "maxSpeed",
      "purchasePrice",
      "currentValue",
      "fleetOperatorId",
      "location",
    ];

    optionalFields.forEach((field) => {
      if (data[field as keyof VehicleCreateData]) {
        vehicleData[field] = data[field as keyof VehicleCreateData];
      }
    });

    return vehicleData;
  }

  private static hasRCData(data: VehicleCreateData): boolean {
    return !!(
      data.rcNumber ||
      data.rcExpiryDate ||
      data.ownerName ||
      data.ownerAddress
    );
  }

  private static hasInsuranceData(data: VehicleCreateData): boolean {
    return !!(
      data.insuranceNumber ||
      data.insuranceProvider ||
      data.insuranceExpiryDate
    );
  }

  private static async createRCDetails(
    tx: Prisma.TransactionClient,
    vehicleId: string,
    data: VehicleCreateData,
    registrationDate: Date,
    vehicleModel: any
  ) {
    return await tx.rCDetails.create({
      data: {
        vehicleId,
        rcNumber: data.rcNumber || data.registrationNumber,
        ownerName: data.ownerName || "Fleet Owner",
        ownerAddress: data.ownerAddress || "Fleet Address",
        registrationDate,
        validUpto: data.rcExpiryDate ? new Date(data.rcExpiryDate) : null,
        fuelType: vehicleModel.fuelType || "Electric",
        seatingCapacity:
          data.seatingCapacity || vehicleModel.seatingCapacity || 2,
      },
    });
  }

  private static async createInsuranceDetails(
    tx: Prisma.TransactionClient,
    vehicleId: string,
    data: VehicleCreateData
  ) {
    return await tx.insuranceDetails.create({
      data: {
        vehicleId,
        insuranceType: data.insuranceType || "Comprehensive",
        providerName: data.insuranceProvider || "TBD",
        policyNumber: data.insuranceNumber || "TBD",
        policyStartDate: new Date(),
        policyEndDate: data.insuranceExpiryDate
          ? new Date(data.insuranceExpiryDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        premiumAmount: data.premiumAmount || 0,
        coverageAmount: data.coverageAmount || 0,
      },
    });
  }

  private static buildVehicleFilters(params: QueryParams) {
    const where: any = {};

    if (params.oemId || params.modelId) {
      where.model = {};
      if (params.oemId) where.model.oemId = params.oemId;
      if (params.modelId) where.modelId = params.modelId;
    }

    if (params.operationalStatus)
      where.operationalStatus = params.operationalStatus;
    if (params.serviceStatus) where.serviceStatus = params.serviceStatus;
    if (params.assignedRider) where.currentRiderId = params.assignedRider;
    if (params.fleetOperatorId) where.fleetOperatorId = params.fleetOperatorId;
    if (params.hubId) where.hubId = params.hubId;
    if (params.location)
      where.location = { contains: params.location, mode: "insensitive" };

    if (params.minAge || params.maxAge) {
      where.ageInMonths = {};
      if (params.minAge) where.ageInMonths.gte = Number(params.minAge);
      if (params.maxAge) where.ageInMonths.lte = Number(params.maxAge);
    }

    return where;
  }

  private static prepareDateFields(data: VehicleUpdateData) {
    const updateData = { ...data };

    // Convert date strings to Date objects safely
    const dateFields = ["purchaseDate", "registrationDate"] as const;
    dateFields.forEach((field) => {
      const value = updateData[field];
      if (value && typeof value === "string") {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            updateData[field] = date as any;
          } else {
            console.warn(`Invalid date for field ${field}:`, value);
            // Remove invalid date field
            delete updateData[field];
          }
        } catch (error) {
          console.warn(`Error parsing date for field ${field}:`, value, error);
          // Remove invalid date field
          delete updateData[field];
        }
      }
    });

    // Ensure numeric fields are properly converted
    const numericFields = [
      "batteryCapacity",
      "maxRange",
      "maxSpeed",
      "mileage",
      "purchasePrice",
      "currentValue",
      "year",
    ] as const;
    numericFields.forEach((field) => {
      const value = updateData[field as keyof VehicleUpdateData];
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          (updateData as any)[field] = numValue;
        } else {
          console.warn(`Invalid numeric value for field ${field}:`, value);
          // Remove invalid numeric field
          delete (updateData as any)[field];
        }
      }
    });

    return updateData;
  }

  /**
   * Assign vehicle to a rider
   */
  static async assignVehicle(
    id: string,
    riderId: string,
    userId?: string
  ): Promise<VehicleResponse> {
    Logger.info("Assigning vehicle", { vehicleId: id, riderId });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError("Vehicle");
    }

    if (vehicle.operationalStatus !== "Available") {
      throw ErrorHandler.createError(
        "Vehicle is not available for assignment",
        "INVALID_OPERATION",
        400
      );
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        operationalStatus: "Assigned",
        currentRiderId: riderId,
        assignmentDate: new Date(),
      },
      include: {
        model: {
          include: {
            oem: true,
          },
        },
        rcDetails: true,
        insuranceDetails: true,
        statusHistory: {
          orderBy: { changeDate: "desc" },
          take: 5,
        },
      },
    });

    // Add status history entry
    await this.createStatusHistory(id, "Available", "Assigned", userId);

    return updatedVehicle as VehicleResponse;
  }

  /**
   * Unassign vehicle from rider
   */
  static async unassignVehicle(
    id: string,
    userId?: string
  ): Promise<VehicleResponse> {
    Logger.info("Unassigning vehicle", { vehicleId: id });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError("Vehicle");
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        operationalStatus: "Available",
        currentRiderId: null,
        assignmentDate: null,
      },
      include: {
        model: {
          include: {
            oem: true,
          },
        },
        rcDetails: true,
        insuranceDetails: true,
        statusHistory: {
          orderBy: { changeDate: "desc" },
          take: 5,
        },
      },
    });

    // Add status history entry
    await this.createStatusHistory(
      id,
      vehicle.operationalStatus,
      "Available",
      userId
    );

    return updatedVehicle as VehicleResponse;
  }

  /**
   * Get vehicle history (status changes, services, damages)
   */
  static async getVehicleHistory(
    id: string,
    params: { page: number; limit: number; type?: string }
  ) {
    Logger.info("Getting vehicle history", { vehicleId: id, params });

    const { page, limit, type } = params;
    const skip = (page - 1) * limit;

    let history = [];
    let totalCount = 0;

    if (!type || type === "status") {
      const statusHistory = await prisma.vehicleStatusHistory.findMany({
        where: { vehicleId: id },
        orderBy: { changeDate: "desc" },
        skip: type ? skip : 0,
        take: type ? limit : 10,
      });
      history.push(
        ...statusHistory.map((item: any) => ({ ...item, type: "status" }))
      );
    }

    if (!type || type === "service") {
      const serviceHistory = await prisma.serviceRecord.findMany({
        where: { vehicleId: id },
        orderBy: { serviceDate: "desc" },
        skip: type ? skip : 0,
        take: type ? limit : 10,
      });
      history.push(
        ...serviceHistory.map((item: any) => ({ ...item, type: "service" }))
      );
    }

    if (!type || type === "damage") {
      const damageHistory = await prisma.damageRecord.findMany({
        where: { vehicleId: id },
        orderBy: { damageDate: "desc" },
        skip: type ? skip : 0,
        take: type ? limit : 10,
      });
      history.push(
        ...damageHistory.map((item: any) => ({ ...item, type: "damage" }))
      );
    }

    // Sort by date if showing all types
    if (!type) {
      history.sort((a, b) => {
        const dateA =
          (a as any).changeDate ||
          (a as any).serviceDate ||
          (a as any).damageDate;
        const dateB =
          (b as any).changeDate ||
          (b as any).serviceDate ||
          (b as any).damageDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      totalCount = history.length;
      history = history.slice(skip, skip + limit);
    } else {
      totalCount = history.length;
    }

    const pagination = PaginationHelper.calculatePagination(
      page,
      limit,
      totalCount
    );

    return {
      history,
      pagination,
    };
  }

  /**
   * Get vehicle statistics
   */
  static async getVehicleStats(id: string) {
    Logger.info("Getting vehicle stats", { vehicleId: id });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceHistory: true,
            damageRecords: true,
            handoverRecords: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw ErrorHandler.handleNotFoundError("Vehicle");
    }

    // Get total service cost
    const serviceStats = await prisma.serviceRecord.aggregate({
      where: { vehicleId: id },
      _sum: {
        totalCost: true,
        laborCost: true,
        partsCost: true,
      },
      _avg: {
        totalCost: true,
      },
    });

    // Get damage stats
    const damageStats = await prisma.damageRecord.aggregate({
      where: { vehicleId: id },
      _sum: {
        actualCost: true,
        estimatedCost: true,
      },
      _count: {
        id: true,
      },
    });

    const stats = {
      vehicle: {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        ageInMonths: vehicle.ageInMonths,
        mileage: vehicle.mileage,
        operationalStatus: vehicle.operationalStatus,
      },
      services: {
        totalServices: vehicle._count.serviceHistory,
        totalServiceCost: serviceStats._sum.totalCost || 0,
        averageServiceCost: serviceStats._avg.totalCost || 0,
        totalLaborCost: serviceStats._sum.laborCost || 0,
        totalPartsCost: serviceStats._sum.partsCost || 0,
      },
      damages: {
        totalDamages: damageStats._count.id,
        totalDamageCost: damageStats._sum.actualCost || 0,
        estimatedDamageCost: damageStats._sum.estimatedCost || 0,
      },
      handovers: {
        totalHandovers: vehicle._count.handoverRecords,
      },
      totalMaintenanceCost:
        (serviceStats._sum.totalCost || 0) + (damageStats._sum.actualCost || 0),
      costPerKm:
        vehicle.mileage > 0
          ? ((serviceStats._sum.totalCost || 0) +
              (damageStats._sum.actualCost || 0)) /
            vehicle.mileage
          : 0,
    };

    return stats;
  }

  private static async createStatusHistory(
    vehicleId: string,
    previousStatus: string,
    newStatus: string,
    userId?: string
  ) {
    await prisma.vehicleStatusHistory.create({
      data: {
        vehicleId,
        previousStatus,
        newStatus,
        changeReason: "Status updated",
        changedBy: userId || "system",
      },
    });
  }
}
