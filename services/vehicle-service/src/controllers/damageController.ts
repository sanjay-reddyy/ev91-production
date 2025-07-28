import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Get all damage records with filtering and pagination
export const getDamageRecords = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortBy = 'reportedDate',
      sortOrder = 'desc',
      resolutionStatus,
      severity,
      damageType,
      vehicleId,
      reportedBy,
      search
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};

    if (resolutionStatus) {
      where.resolutionStatus = resolutionStatus;
    }

    if (severity) {
      where.severity = severity;
    }

    if (damageType) {
      where.damageType = damageType;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (reportedBy) {
      where.reportedBy = {
        contains: reportedBy as string,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { reportedBy: { contains: search as string, mode: 'insensitive' } },
        { vehicle: { registrationNumber: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    // Get damage records with vehicle details
    const [damageRecords, totalCount] = await Promise.all([
      prisma.damageRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          vehicle: {
            include: {
              model: {
                include: {
                  oem: true
                }
              }
            }
          },
          mediaFiles: true
        }
      }),
      prisma.damageRecord.count({ where })
    ]);

    res.json({
      data: damageRecords,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalItems: totalCount,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching damage records:', error);
    res.status(500).json({ error: 'Failed to fetch damage records' });
  }
};

// Get single damage record by ID
export const getDamageRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const damageRecord = await prisma.damageRecord.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            model: {
              include: {
                oem: true
              }
            }
          }
        },
        mediaFiles: true
      }
    });

    if (!damageRecord) {
      res.status(404).json({ error: 'Damage record not found' });
      return;
    }

    res.json(damageRecord);
  } catch (error) {
    console.error('Error fetching damage record:', error);
    res.status(500).json({ error: 'Failed to fetch damage record' });
  }
};

// Create new damage record
export const createDamageRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      vehicleId,
      damageType,
      severity,
      location,
      description,
      estimatedCost,
      actualCost,
      reportedBy,
      assignedTechnician,
      damageStatus = 'Reported',
      resolutionNotes
    } = req.body;

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const damageRecord = await prisma.damageRecord.create({
      data: {
        vehicleId,
        damageType,
        severity,
        description,
        damageLocation: location, // Map to schema field
        damageDate: new Date(),
        reportedBy,
        resolutionStatus: damageStatus, // Map to schema field
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        actualCost: actualCost ? parseFloat(actualCost) : null,
        repairDetails: resolutionNotes, // Map to schema field
        repairDate: damageStatus === 'Resolved' ? new Date() : null
      },
      include: {
        vehicle: {
          include: {
            model: {
              include: {
                oem: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(damageRecord);
  } catch (error) {
    console.error('Error creating damage record:', error);
    res.status(500).json({ error: 'Failed to create damage record' });
  }
};

// Update damage record
export const updateDamageRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const {
      damageType,
      severity,
      location,
      description,
      estimatedCost,
      actualCost,
      assignedTechnician,
      damageStatus,
      resolutionNotes
    } = req.body;

    // Check if damage record exists
    const existingRecord = await prisma.damageRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      res.status(404).json({ error: 'Damage record not found' });
      return;
    }

    const updateData: any = {
      damageType,
      severity,
      location,
      description,
      estimatedCost: estimatedCost !== undefined ? (estimatedCost ? parseFloat(estimatedCost) : null) : existingRecord.estimatedCost,
      actualCost: actualCost !== undefined ? (actualCost ? parseFloat(actualCost) : null) : existingRecord.actualCost,
      assignedTechnician,
      damageStatus,
      resolutionNotes
    };

    // Set resolved date if status changed to Resolved
    if (damageStatus === 'Resolved' && existingRecord.resolutionStatus !== 'Resolved') {
      updateData.resolvedDate = new Date();
    } else if (damageStatus !== 'Resolved') {
      updateData.resolvedDate = null;
    }

    const updatedRecord = await prisma.damageRecord.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: {
          include: {
            model: {
              include: {
                oem: true
              }
            }
          }
        }
      }
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating damage record:', error);
    res.status(500).json({ error: 'Failed to update damage record' });
  }
};

// Update damage status only
export const updateDamageStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, technician } = req.body;

    const updateData: any = {
      damageStatus: status
    };

    if (notes) {
      updateData.resolutionNotes = notes;
    }

    if (technician) {
      updateData.assignedTechnician = technician;
    }

    if (status === 'Resolved') {
      updateData.resolvedDate = new Date();
    }

    const updatedRecord = await prisma.damageRecord.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: {
          include: {
            model: {
              include: {
                oem: true
              }
            }
          }
        }
      }
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating damage status:', error);
    res.status(500).json({ error: 'Failed to update damage status' });
  }
};

// Delete damage record
export const deleteDamageRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const damageRecord = await prisma.damageRecord.findUnique({
      where: { id }
    });

    if (!damageRecord) {
      res.status(404).json({ error: 'Damage record not found' });
      return;
    }

    await prisma.damageRecord.delete({
      where: { id }
    });

    res.json({ message: 'Damage record deleted successfully' });
  } catch (error) {
    console.error('Error deleting damage record:', error);
    res.status(500).json({ error: 'Failed to delete damage record' });
  }
};

// Get damage statistics
export const getDamageStats = async (req: Request, res: Response) => {
  try {
    const [totalDamage, byStatus, bySeverity, byType] = await Promise.all([
      prisma.damageRecord.count(),
      prisma.damageRecord.groupBy({
        by: ['resolutionStatus'],
        _count: true
      }),
      prisma.damageRecord.groupBy({
        by: ['severity'],
        _count: true
      }),
      prisma.damageRecord.groupBy({
        by: ['damageType'],
        _count: true
      })
    ]);

    const stats = {
      total: totalDamage,
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.resolutionStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: bySeverity.reduce((acc: Record<string, number>, item: any) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.damageType] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching damage statistics:', error);
    res.status(500).json({ error: 'Failed to fetch damage statistics' });
  }
};
