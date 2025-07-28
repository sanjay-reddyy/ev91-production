import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all vehicle models
export const getAllVehicleModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oemId, active, popular, category, segment } = req.query;
    
    const where: any = {};
    if (oemId) {
      where.oemId = oemId;
    }
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (popular !== undefined) {
      where.isPopular = popular === 'true';
    }
    if (category) {
      where.category = category;
    }
    if (segment) {
      where.segment = segment;
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
            logoUrl: true
          }
        },
        vehicles: {
          select: {
            id: true,
            registrationNumber: true,
            operationalStatus: true
          }
        }
      },
      orderBy: [
        { isPopular: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle models',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get vehicle model by ID
export const getVehicleModelById = async (req: Request, res: Response): Promise<void> => {
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
            purchaseDate: true
          }
        }
      }
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: 'Vehicle model not found'
      });
      return;
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error fetching vehicle model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get vehicle models by OEM ID
export const getVehicleModelsByOEM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oemId } = req.params;
    const { active = 'true', popular } = req.query;

    const where: any = { oemId };
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (popular !== undefined) {
      where.isPopular = popular === 'true';
    }

    const models = await prisma.vehicleModel.findMany({
      where,
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true
          }
        },
        _count: {
          select: {
            vehicles: true
          }
        }
      },
      orderBy: [
        { isPopular: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    console.error('Error fetching vehicle models by OEM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle models by OEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new vehicle model
export const createVehicleModel = async (req: Request, res: Response): Promise<void> => {
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
      isPopular = false
    } = req.body;

    // Validate required fields
    if (!oemId || !name || !displayName || !modelCode || !category || !fuelType) {
      res.status(400).json({
        success: false,
        message: 'OEM ID, name, display name, model code, category, and fuel type are required'
      });
      return;
    }

    // Check if OEM exists
    const oem = await prisma.oEM.findUnique({
      where: { id: oemId }
    });

    if (!oem) {
      res.status(400).json({
        success: false,
        message: 'Invalid OEM ID'
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
        isPopular
      },
      include: {
        oem: {
          select: {
            id: true,
            name: true,
            displayName: true,
            code: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle model created successfully',
      data: model
    });
  } catch (error) {
    console.error('Error creating vehicle model:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: 'Model code already exists for this OEM'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update vehicle model
export const updateVehicleModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id }
    });

    if (!existingModel) {
      res.status(404).json({
        success: false,
        message: 'Vehicle model not found'
      });
      return;
    }

    // If oemId is being updated, check if new OEM exists
    if (updateData.oemId && updateData.oemId !== existingModel.oemId) {
      const oem = await prisma.oEM.findUnique({
        where: { id: updateData.oemId }
      });

      if (!oem) {
        res.status(400).json({
          success: false,
          message: 'Invalid OEM ID'
        });
        return;
      }
    }

    // Clean update data to only include defined values
    const cleanedData: any = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'modelCode') {
          cleanedData[key] = updateData[key].toUpperCase();
        } else if (key === 'oemId') {
          // Handle OEM relationship properly
          cleanedData.oem = {
            connect: { id: updateData[key] }
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
            code: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Vehicle model updated successfully',
      data: updatedModel
    });
  } catch (error) {
    console.error('Error updating vehicle model:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: 'Model code already exists for this OEM'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete vehicle model (soft delete by setting isActive to false)
export const deleteVehicleModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query;

    // Check if model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        vehicles: true
      }
    });

    if (!existingModel) {
      res.status(404).json({
        success: false,
        message: 'Vehicle model not found'
      });
      return;
    }

    // Check if model has vehicles
    if (existingModel.vehicles.length > 0 && hard === 'true') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle model with existing vehicles. Deactivate instead.'
      });
      return;
    }

    if (hard === 'true') {
      // Hard delete (only if no vehicles)
      await prisma.vehicleModel.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Vehicle model deleted successfully'
      });
    } else {
      // Soft delete (set isActive to false)
      const updatedModel = await prisma.vehicleModel.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'Vehicle model deactivated successfully',
        data: updatedModel
      });
    }
  } catch (error) {
    console.error('Error deleting vehicle model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get vehicle model specifications (for autofill)
export const getVehicleModelSpecs = async (req: Request, res: Response): Promise<void> => {
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
            code: true
          }
        }
      }
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: 'Vehicle model not found'
      });
      return;
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error fetching vehicle model specs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle model specifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get model categories and segments (for dropdowns)
export const getModelMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.vehicleModel.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { isActive: true }
    });

    const segments = await prisma.vehicleModel.findMany({
      select: { segment: true },
      distinct: ['segment'],
      where: { isActive: true, segment: { not: '' } }
    });

    const fuelTypes = await prisma.vehicleModel.findMany({
      select: { fuelType: true },
      distinct: ['fuelType'],
      where: { isActive: true }
    });

    const vehicleTypes = await prisma.vehicleModel.findMany({
      select: { vehicleType: true },
      distinct: ['vehicleType'],
      where: { isActive: true }
    });

    res.json({
      success: true,
      data: {
        categories: categories.map((c: any) => c.category),
        segments: segments.map((s: any) => s.segment).filter(Boolean),
        fuelTypes: fuelTypes.map((f: any) => f.fuelType),
        vehicleTypes: vehicleTypes.map((v: any) => v.vehicleType)
      }
    });
  } catch (error) {
    console.error('Error fetching model metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model metadata',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
