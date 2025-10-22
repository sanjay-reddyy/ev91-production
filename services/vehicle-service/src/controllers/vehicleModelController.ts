import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all vehicle models
export const getAllVehicleModels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      oemId,
      active,
      popular,
      category,
      segment,
      isAvailableForRent,
      rentalCategory,
    } = req.query;

    const where: any = {};
    if (oemId) {
      where.oemId = oemId;
    }
    if (active !== undefined) {
      where.isActive = active === "true";
    }
    if (popular !== undefined) {
      where.isPopular = popular === "true";
    }
    if (category) {
      where.category = category;
    }
    if (segment) {
      where.segment = segment;
    }
    // EV Rental filters
    if (isAvailableForRent !== undefined) {
      where.isAvailableForRent = isAvailableForRent === "true";
    }
    if (rentalCategory) {
      where.rentalCategory = rentalCategory;
    }

    const models = await prisma.vehicleModel.findMany({
      where,
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
            logoUrl: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            registrationNumber: true,
            operationalStatus: true,
          },
        },
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle models",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get vehicle model by ID
export const getVehicleModelById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const model = await prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        oem: true,
        vehicles: {
          select: {
            id: true,
            registrationNumber: true,
            variant: true,
            color: true,
            year: true,
            operationalStatus: true,
            mileage: true,
            purchaseDate: true,
          },
        },
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error("Error fetching vehicle model:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle model",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get vehicle models by OEM ID
export const getVehicleModelsByOEM = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { oemId } = req.params;
    const { active = "true", popular } = req.query;

    const where: any = { oemId };
    if (active !== undefined) {
      where.isActive = active === "true";
    }
    if (popular !== undefined) {
      where.isPopular = popular === "true";
    }

    const models = await prisma.vehicleModel.findMany({
      where,
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error) {
    console.error("Error fetching vehicle models by OEM:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle models by OEM",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new vehicle model
export const createVehicleModel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      oemId,
      name,
      displayName,
      modelCode,
      category,
      segment,
      launchYear,
      discontinuedYear,
      vehicleType = "2-Wheeler",
      fuelType,
      engineCapacity,
      batteryCapacity,
      maxSpeed,
      range,
      chargingTime,
      seatingCapacity = 2,
      weight,
      dimensions,
      availableVariants,
      availableColors,
      standardFeatures,
      optionalFeatures,
      basePrice,
      priceRange,
      serviceInterval,
      warrantyPeriod,
      spareParts,
      imageUrl,
      brochureUrl,
      isActive = true,
      isPopular = false,
    } = req.body;

    // Validate required fields
    if (
      !oemId ||
      !name ||
      !displayName ||
      !modelCode ||
      !category ||
      !fuelType
    ) {
      res.status(400).json({
        success: false,
        message:
          "OEM ID, name, display name, model code, category, and fuel type are required",
      });
      return;
    }

    // Check if OEM exists
    const oem = await prisma.oEM.findUnique({
      where: { id: oemId },
    });

    if (!oem) {
      res.status(400).json({
        success: false,
        message: "Invalid OEM ID",
      });
      return;
    }

    const model = await prisma.vehicleModel.create({
      data: {
        oemId,
        name,
        displayName,
        modelCode: modelCode.toUpperCase(),
        category,
        segment,
        launchYear,
        discontinuedYear,
        vehicleType,
        fuelType,
        engineCapacity,
        batteryCapacity,
        maxSpeed,
        range,
        chargingTime,
        seatingCapacity,
        weight,
        dimensions,
        availableVariants,
        availableColors,
        standardFeatures,
        optionalFeatures,
        basePrice,
        priceRange,
        serviceInterval,
        warrantyPeriod,
        spareParts,
        imageUrl,
        brochureUrl,
        isActive,
        isPopular,
      },
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Vehicle model created successfully",
      data: model,
    });
  } catch (error) {
    console.error("Error creating vehicle model:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      res.status(409).json({
        success: false,
        message: "Model code already exists for this OEM",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create vehicle model",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update vehicle model
export const updateVehicleModel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id },
    });

    if (!existingModel) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    // If oemId is being updated, check if new OEM exists
    if (updateData.oemId && updateData.oemId !== existingModel.oemId) {
      const oem = await prisma.oEM.findUnique({
        where: { id: updateData.oemId },
      });

      if (!oem) {
        res.status(400).json({
          success: false,
          message: "Invalid OEM ID",
        });
        return;
      }
    }

    // Clean update data to only include defined values
    const cleanedData: any = {};
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        if (key === "modelCode") {
          cleanedData[key] = updateData[key].toUpperCase();
        } else if (key === "oemId") {
          // Handle OEM relationship properly
          cleanedData.oem = {
            connect: { id: updateData[key] },
          };
        } else {
          cleanedData[key] = updateData[key];
        }
      }
    });

    const updatedModel = await prisma.vehicleModel.update({
      where: { id },
      data: cleanedData,
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Vehicle model updated successfully",
      data: updatedModel,
    });
  } catch (error) {
    console.error("Error updating vehicle model:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      res.status(409).json({
        success: false,
        message: "Model code already exists for this OEM",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update vehicle model",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete vehicle model (soft delete by setting isActive to false)
export const deleteVehicleModel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query;

    // Check if model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        vehicles: true,
      },
    });

    if (!existingModel) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    // Check if model has vehicles
    if (existingModel.vehicles.length > 0 && hard === "true") {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete vehicle model with existing vehicles. Deactivate instead.",
      });
      return;
    }

    if (hard === "true") {
      // Hard delete (only if no vehicles)
      await prisma.vehicleModel.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Vehicle model deleted successfully",
      });
    } else {
      // Soft delete (set isActive to false)
      const updatedModel = await prisma.vehicleModel.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: "Vehicle model deactivated successfully",
        data: updatedModel,
      });
    }
  } catch (error) {
    console.error("Error deleting vehicle model:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle model",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get vehicle model specifications (for autofill)
export const getVehicleModelSpecs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const model = await prisma.vehicleModel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        modelCode: true,
        vehicleType: true,
        fuelType: true,
        engineCapacity: true,
        batteryCapacity: true,
        maxSpeed: true,
        range: true,
        chargingTime: true,
        seatingCapacity: true,
        weight: true,
        dimensions: true,
        availableVariants: true,
        availableColors: true,
        standardFeatures: true,
        basePrice: true,
        serviceInterval: true,
        warrantyPeriod: true,
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
          },
        },
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error("Error fetching vehicle model specs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle model specifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get model categories and segments (for dropdowns)
export const getModelMetadata = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.vehicleModel.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { isActive: true },
    });

    const segments = await prisma.vehicleModel.findMany({
      select: { segment: true },
      distinct: ["segment"],
      where: { isActive: true, segment: { not: "" } },
    });

    const fuelTypes = await prisma.vehicleModel.findMany({
      select: { fuelType: true },
      distinct: ["fuelType"],
      where: { isActive: true },
    });

    const vehicleTypes = await prisma.vehicleModel.findMany({
      select: { vehicleType: true },
      distinct: ["vehicleType"],
      where: { isActive: true },
    });

    res.json({
      success: true,
      data: {
        categories: categories.map((c: any) => c.category),
        segments: segments.map((s: any) => s.segment).filter(Boolean),
        fuelTypes: fuelTypes.map((f: any) => f.fuelType),
        vehicleTypes: vehicleTypes.map((v: any) => v.vehicleType),
      },
    });
  } catch (error) {
    console.error("Error fetching model metadata:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch model metadata",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ========================================
// EV RENTAL SPECIFIC ENDPOINTS
// ========================================

/**
 * Get vehicle models available for EV rental
 * GET /vehicle-models/available-for-rent
 * Query params: rentalCategory (Economy, Standard, Premium, Cargo)
 */
export const getAvailableRentalModels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rentalCategory } = req.query;

    const where: any = {
      isActive: true,
      isAvailableForRent: true,
      fuelType: "Electric", // Only electric vehicles for rental program
    };

    if (rentalCategory) {
      where.rentalCategory = rentalCategory;
    }

    const models = await prisma.vehicleModel.findMany({
      where,
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true,
            logoUrl: true,
          },
        },
        vehicles: {
          where: {
            operationalStatus: "Available",
          },
          select: {
            id: true,
            registrationNumber: true,
            ageInMonths: true,
          },
        },
      },
      orderBy: [
        { baseRentalCost: "asc" }, // Cheapest first
      ],
    });

    // Add calculated rental cost and availability
    const modelsWithDetails = models.map((model) => ({
      ...model,
      availableVehiclesCount: model.vehicles.length,
      // Calculate average monthly cost considering vehicle ages
      averageMonthlyRentalCost:
        model.vehicles.length > 0
          ? model.vehicles.reduce((sum, v) => {
              const depreciation = Math.min((v.ageInMonths || 0) * 0.02, 0.3);
              const actualCost =
                (model.baseRentalCost || 0) * (1 - depreciation);
              return sum + actualCost;
            }, 0) / model.vehicles.length
          : model.baseRentalCost,
    }));

    // Group by category
    const categoryStats = {
      Economy: modelsWithDetails.filter((m) => m.rentalCategory === "Economy")
        .length,
      Standard: modelsWithDetails.filter((m) => m.rentalCategory === "Standard")
        .length,
      Premium: modelsWithDetails.filter((m) => m.rentalCategory === "Premium")
        .length,
      Cargo: modelsWithDetails.filter((m) => m.rentalCategory === "Cargo")
        .length,
    };

    res.json({
      success: true,
      data: modelsWithDetails,
      count: modelsWithDetails.length,
      categories: categoryStats,
      message: `Found ${modelsWithDetails.length} vehicle models available for rent`,
    });
  } catch (error) {
    console.error("Error fetching available rental models:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available rental models",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Calculate rental cost for a specific vehicle
 * GET /vehicle-models/:id/rental-cost
 * Query params: vehicleAgeInMonths (optional, for estimation)
 */
export const calculateRentalCost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { vehicleAgeInMonths } = req.query;

    const model = await prisma.vehicleModel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        baseRentalCost: true,
        rentalCategory: true,
        isAvailableForRent: true,
        minimumRentalPeriod: true,
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    if (!model.isAvailableForRent || !model.baseRentalCost) {
      res.status(400).json({
        success: false,
        message: "This vehicle model is not available for rent",
      });
      return;
    }

    const ageInMonths = vehicleAgeInMonths
      ? parseInt(vehicleAgeInMonths as string)
      : 0;

    // Calculate depreciation (2% per month, max 30%)
    const DEPRECIATION_RATE = 0.02;
    const MAX_DEPRECIATION = 0.3;

    const totalDepreciation = ageInMonths * DEPRECIATION_RATE;
    const cappedDepreciation = Math.min(totalDepreciation, MAX_DEPRECIATION);
    const actualMonthlyCost = Math.round(
      model.baseRentalCost * (1 - cappedDepreciation)
    );

    res.json({
      success: true,
      data: {
        modelId: model.id,
        modelName: model.displayName,
        baseRentalCost: model.baseRentalCost,
        vehicleAgeInMonths: ageInMonths,
        depreciationPercentage: Math.round(cappedDepreciation * 100),
        actualMonthlyCost,
        minimumRentalPeriod: model.minimumRentalPeriod || 12,
        totalCostFor12Months: actualMonthlyCost * 12,
        category: model.rentalCategory,
        savings: model.baseRentalCost - actualMonthlyCost,
      },
      formula: {
        description: "Monthly Cost = Base Cost × (1 - depreciation)",
        depreciationRate: "2% per month",
        maxDepreciation: "30%",
      },
    });
  } catch (error) {
    console.error("Error calculating rental cost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate rental cost",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get available vehicles for a specific model
 * GET /vehicle-models/:id/available-vehicles
 * Returns list of available vehicles that can be assigned for rental
 */
export const getAvailableVehiclesForModel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const model = await prisma.vehicleModel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        isAvailableForRent: true,
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Vehicle model not found",
      });
      return;
    }

    if (!model.isAvailableForRent) {
      res.status(400).json({
        success: false,
        message: "This vehicle model is not available for rent",
      });
      return;
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        modelId: id,
        operationalStatus: "Available",
        currentRiderId: null, // Not assigned to anyone
      },
      select: {
        id: true,
        registrationNumber: true,
        variant: true,
        color: true,
        year: true,
        ageInMonths: true,
        mileage: true,
        purchaseDate: true,
        hub: {
          select: {
            id: true,
            name: true,
            code: true,
            city: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        ageInMonths: "asc", // Newer vehicles first
      },
    });

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
      message: `Found ${vehicles.length} available vehicles for ${model.displayName}`,
    });
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available vehicles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
