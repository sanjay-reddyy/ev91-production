import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all OEMs
export const getAllOEMs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active, preferred } = req.query;
    
    const where: any = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (preferred !== undefined) {
      where.isPreferred = preferred === 'true';
    }

    const oems = await prisma.oEM.findMany({
      where,
      include: {
        models: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            displayName: true,
            modelCode: true,
            category: true,
            isActive: true,
            isPopular: true
          }
        }
      },
      orderBy: [
        { isPreferred: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: oems,
      count: oems.length
    });
  } catch (error) {
    console.error('Error fetching OEMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OEMs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get OEM by ID
export const getOEMById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const oem = await prisma.oEM.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: [
            { isPopular: 'desc' },
            { name: 'asc' }
          ]
        }
      }
    });

    if (!oem) {
      res.status(404).json({
        success: false,
        message: 'OEM not found'
      });
      return;
    }

    res.json({
      success: true,
      data: oem
    });
  } catch (error) {
    console.error('Error fetching OEM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new OEM
export const createOEM = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      displayName,
      code,
      country,
      website,
      supportEmail,
      supportPhone,
      gstin,
      panNumber,
      registeredAddress,
      logoUrl,
      brandColor,
      description,
      isActive = true,
      isPreferred = false
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !code) {
      res.status(400).json({
        success: false,
        message: 'Name, display name, and code are required'
      });
      return;
    }

    const oem = await prisma.oEM.create({
      data: {
        name,
        displayName,
        code: code.toUpperCase(),
        country,
        website,
        supportEmail,
        supportPhone,
        gstin,
        panNumber,
        registeredAddress,
        logoUrl,
        brandColor,
        description,
        isActive,
        isPreferred
      }
    });

    res.status(201).json({
      success: true,
      message: 'OEM created successfully',
      data: oem
    });
  } catch (error) {
    console.error('Error creating OEM:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: 'OEM name or code already exists'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create OEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update OEM
export const updateOEM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      displayName,
      code,
      country,
      website,
      supportEmail,
      supportPhone,
      gstin,
      panNumber,
      registeredAddress,
      logoUrl,
      brandColor,
      description,
      isActive,
      isPreferred
    } = req.body;

    // Check if OEM exists
    const existingOEM = await prisma.oEM.findUnique({
      where: { id }
    });

    if (!existingOEM) {
      res.status(404).json({
        success: false,
        message: 'OEM not found'
      });
      return;
    }

    const updatedOEM = await prisma.oEM.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(displayName && { displayName }),
        ...(code && { code: code.toUpperCase() }),
        ...(country !== undefined && { country }),
        ...(website !== undefined && { website }),
        ...(supportEmail !== undefined && { supportEmail }),
        ...(supportPhone !== undefined && { supportPhone }),
        ...(gstin !== undefined && { gstin }),
        ...(panNumber !== undefined && { panNumber }),
        ...(registeredAddress !== undefined && { registeredAddress }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(brandColor !== undefined && { brandColor }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(isPreferred !== undefined && { isPreferred })
      }
    });

    res.json({
      success: true,
      message: 'OEM updated successfully',
      data: updatedOEM
    });
  } catch (error) {
    console.error('Error updating OEM:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: 'OEM name or code already exists'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update OEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete OEM (soft delete by setting isActive to false)
export const deleteOEM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query;

    // Check if OEM exists
    const existingOEM = await prisma.oEM.findUnique({
      where: { id },
      include: {
        models: {
          include: {
            vehicles: true
          }
        }
      }
    });

    if (!existingOEM) {
      res.status(404).json({
        success: false,
        message: 'OEM not found'
      });
      return;
    }

    // Check if OEM has vehicles
    const hasVehicles = existingOEM.models.some((model: any) => model.vehicles.length > 0);
    if (hasVehicles && hard === 'true') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete OEM with existing vehicles. Deactivate instead.'
      });
      return;
    }

    if (hard === 'true') {
      // Hard delete (only if no vehicles)
      await prisma.oEM.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'OEM deleted successfully'
      });
    } else {
      // Soft delete (set isActive to false)
      const updatedOEM = await prisma.oEM.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'OEM deactivated successfully',
        data: updatedOEM
      });
    }
  } catch (error) {
    console.error('Error deleting OEM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete OEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get OEM statistics
export const getOEMStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await prisma.oEM.findMany({
      include: {
        models: {
          include: {
            vehicles: {
              select: {
                id: true,
                operationalStatus: true
              }
            }
          }
        }
      }
    });

    const oemStats = stats.map((oem: any) => {
      const totalModels = oem.models.length;
      const activeModels = oem.models.filter((model: any) => model.isActive).length;
      const totalVehicles = oem.models.reduce((sum: number, model: any) => sum + model.vehicles.length, 0);
      const activeVehicles = oem.models.reduce((sum: number, model: any) => 
        sum + model.vehicles.filter((vehicle: any) => vehicle.operationalStatus === 'Available' || vehicle.operationalStatus === 'Assigned').length, 0);

      return {
        id: oem.id,
        name: oem.name,
        displayName: oem.displayName,
        code: oem.code,
        isActive: oem.isActive,
        isPreferred: oem.isPreferred,
        totalModels,
        activeModels,
        totalVehicles,
        activeVehicles,
        utilizationRate: totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: oemStats
    });
  } catch (error) {
    console.error('Error fetching OEM stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OEM statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
