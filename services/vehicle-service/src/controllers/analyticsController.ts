import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Logger } from '../utils';

/**
 * Get comprehensive vehicle analytics
 */
export const getVehicleAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get vehicle analytics request received', { userId: req.user?.id });
  
  const { period = 'month', hubId } = req.query;
  
  try {
    // Calculate date range based on period
    const now = new Date();
    const dateRanges = getDateRange(period as string, now);
    
    // Build where clause for filtering
    const whereClause: any = {};
    if (hubId) {
      whereClause.hubId = hubId;
    }
    
    // Get basic vehicle counts
    const totalVehicles = await prisma.vehicle.count({ where: whereClause });
    
    // Get vehicle status distribution
    const statusDistribution = await prisma.vehicle.groupBy({
      by: ['operationalStatus'],
      where: whereClause,
      _count: {
        id: true
      }
    });
    
    // Get service status distribution
    const serviceStatusDistribution = await prisma.vehicle.groupBy({
      by: ['serviceStatus'],
      where: whereClause,
      _count: {
        id: true
      }
    });
    
    // Get vehicle age distribution
    const ageDistribution = await prisma.vehicle.groupBy({
      by: ['ageInMonths'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        ageInMonths: 'asc'
      }
    });
    
    // Get vehicles by OEM
    const oemDistribution = await prisma.vehicle.groupBy({
      by: ['modelId'],
      where: whereClause,
      _count: {
        id: true
      },
      _avg: {
        mileage: true,
        ageInMonths: true
      }
    });
    
    // Get detailed OEM info
    const oemDetails = await prisma.vehicleModel.findMany({
      include: {
        oem: true,
        _count: {
          select: {
            vehicles: {
              where: whereClause
            }
          }
        }
      }
    });
    
    // Calculate utilization metrics
    const utilizationData = await calculateUtilizationMetrics(whereClause, dateRanges);
    
    // Calculate maintenance metrics
    const maintenanceMetrics = await calculateMaintenanceMetrics(whereClause, dateRanges);
    
    const analytics = {
      summary: {
        totalVehicles,
        activeVehicles: statusDistribution.find(s => s.operationalStatus === 'Available')?._count.id || 0,
        assignedVehicles: statusDistribution.find(s => s.operationalStatus === 'Assigned')?._count.id || 0,
        underMaintenance: statusDistribution.find(s => s.operationalStatus === 'Under Maintenance')?._count.id || 0,
        retiredVehicles: statusDistribution.find(s => s.operationalStatus === 'Retired')?._count.id || 0
      },
      statusDistribution: statusDistribution.map(item => ({
        status: item.operationalStatus,
        count: item._count.id,
        percentage: ((item._count.id / totalVehicles) * 100).toFixed(1)
      })),
      serviceStatusDistribution: serviceStatusDistribution.map(item => ({
        status: item.serviceStatus,
        count: item._count.id,
        percentage: ((item._count.id / totalVehicles) * 100).toFixed(1)
      })),
      ageDistribution: processAgeDistribution(ageDistribution),
      oemAnalytics: processOemAnalytics(oemDetails),
      utilization: utilizationData,
      maintenance: maintenanceMetrics,
      period,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    Logger.error('Failed to get vehicle analytics', error);
    throw error;
  }
});

/**
 * Get service analytics and statistics
 */
export const getServiceAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get service analytics request received', { userId: req.user?.id });
  
  const { period = 'month' } = req.query;
  const dateRanges = getDateRange(period as string, new Date());
  
  try {
    // Get service records within period
    const serviceRecords = await prisma.serviceRecord.findMany({
      where: {
        serviceDate: {
          gte: dateRanges.start,
          lte: dateRanges.end
        }
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
    
    // Calculate service metrics
    const totalServices = serviceRecords.length;
    const totalCost = serviceRecords.reduce((sum, record) => sum + (record.totalCost || 0), 0);
    const averageCost = totalServices > 0 ? totalCost / totalServices : 0;
    
    // Service type distribution
    const serviceTypeDistribution = serviceRecords.reduce((acc: any, record) => {
      const type = record.serviceType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly trend
    const monthlyTrend = generateMonthlyTrend(serviceRecords, 'serviceDate');
    
    // Cost analysis
    const costAnalysis = {
      totalCost,
      averageCost,
      laborCost: serviceRecords.reduce((sum, record) => sum + (record.laborCost || 0), 0),
      partsCost: serviceRecords.reduce((sum, record) => sum + (record.partsCost || 0), 0)
    };
    
    const analytics = {
      summary: {
        totalServices,
        totalCost,
        averageCost: parseFloat(averageCost.toFixed(2))
      },
      serviceTypeDistribution,
      monthlyTrend,
      costAnalysis,
      period,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    Logger.error('Failed to get service analytics', error);
    throw error;
  }
});

/**
 * Get damage analytics and statistics
 */
export const getDamageAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get damage analytics request received', { userId: req.user?.id });
  
  const { period = 'month' } = req.query;
  const dateRanges = getDateRange(period as string, new Date());
  
  try {
    // Get damage records within period
    const damageRecords = await prisma.damageRecord.findMany({
      where: {
        damageDate: {
          gte: dateRanges.start,
          lte: dateRanges.end
        }
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
    
    const totalDamages = damageRecords.length;
    const totalCost = damageRecords.reduce((sum, record) => sum + (record.actualCost || record.estimatedCost || 0), 0);
    
    // Damage type distribution
    const damageTypeDistribution = damageRecords.reduce((acc: any, record) => {
      const type = record.damageType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Severity distribution
    const severityDistribution = damageRecords.reduce((acc: any, record) => {
      const severity = record.severity || 'Unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly trend
    const monthlyTrend = generateMonthlyTrend(damageRecords, 'damageDate');
    
    const analytics = {
      summary: {
        totalDamages,
        totalCost,
        averageCost: totalDamages > 0 ? parseFloat((totalCost / totalDamages).toFixed(2)) : 0
      },
      damageTypeDistribution,
      severityDistribution,
      monthlyTrend,
      period,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    Logger.error('Failed to get damage analytics', error);
    throw error;
  }
});

/**
 * Get overall fleet performance metrics
 */
export const getFleetPerformance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  Logger.info('Get fleet performance request received', { userId: req.user?.id });
  
  const { period = 'month' } = req.query;
  const dateRanges = getDateRange(period as string, new Date());
  
  try {
    // Get all vehicles with related data
    const vehicles = await prisma.vehicle.findMany({
      include: {
        model: {
          include: {
            oem: true
          }
        },
        serviceHistory: {
          where: {
            serviceDate: {
              gte: dateRanges.start,
              lte: dateRanges.end
            }
          }
        },
        damageRecords: {
          where: {
            damageDate: {
              gte: dateRanges.start,
              lte: dateRanges.end
            }
          }
        }
      }
    });
    
    // Calculate fleet KPIs
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.operationalStatus === 'Available').length;
    const utilizationRate = totalVehicles > 0 ? ((totalVehicles - availableVehicles) / totalVehicles * 100) : 0;
    
    // Calculate maintenance costs
    const maintenanceCosts = vehicles.reduce((sum, vehicle) => {
      const vehicleServiceCost = vehicle.serviceHistory.reduce((s, service) => s + (service.totalCost || 0), 0);
      const vehicleDamageCost = vehicle.damageRecords.reduce((s, damage) => s + (damage.actualCost || damage.estimatedCost || 0), 0);
      return sum + vehicleServiceCost + vehicleDamageCost;
    }, 0);
    
    // Calculate average age and mileage
    const totalAge = vehicles.reduce((sum, v) => sum + (v.ageInMonths || 0), 0);
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
    const averageAge = totalVehicles > 0 ? totalAge / totalVehicles : 0;
    const averageMileage = totalVehicles > 0 ? totalMileage / totalVehicles : 0;
    
    // Calculate cost per vehicle and cost per km
    const costPerVehicle = totalVehicles > 0 ? maintenanceCosts / totalVehicles : 0;
    const costPerKm = totalMileage > 0 ? maintenanceCosts / totalMileage : 0;
    
    const performance = {
      fleet: {
        totalVehicles,
        availableVehicles,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        averageAge: parseFloat(averageAge.toFixed(1)),
        averageMileage: parseFloat(averageMileage.toFixed(0))
      },
      costs: {
        totalMaintenanceCosts: parseFloat(maintenanceCosts.toFixed(2)),
        costPerVehicle: parseFloat(costPerVehicle.toFixed(2)),
        costPerKm: parseFloat(costPerKm.toFixed(4))
      },
      efficiency: {
        serviceFrequency: vehicles.reduce((sum, v) => sum + v.serviceHistory.length, 0),
        damageFrequency: vehicles.reduce((sum, v) => sum + v.damageRecords.length, 0),
        maintenanceRatio: parseFloat(((maintenanceCosts / totalVehicles) * 100).toFixed(2))
      },
      period,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    Logger.error('Failed to get fleet performance', error);
    throw error;
  }
});

// Helper functions
function getDateRange(period: string, now: Date) {
  const end = new Date(now);
  const start = new Date(now);
  
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }
  
  return { start, end };
}

function processAgeDistribution(ageData: any[]) {
  const ageRanges = {
    '0-12 months': 0,
    '1-2 years': 0,
    '2-3 years': 0,
    '3-5 years': 0,
    '5+ years': 0
  };
  
  ageData.forEach(item => {
    const months = item.ageInMonths || 0;
    if (months <= 12) ageRanges['0-12 months'] += item._count.id;
    else if (months <= 24) ageRanges['1-2 years'] += item._count.id;
    else if (months <= 36) ageRanges['2-3 years'] += item._count.id;
    else if (months <= 60) ageRanges['3-5 years'] += item._count.id;
    else ageRanges['5+ years'] += item._count.id;
  });
  
  return ageRanges;
}

function processOemAnalytics(oemDetails: any[]) {
  return oemDetails
    .filter(model => model._count.vehicles > 0)
    .map(model => ({
      oem: model.oem.name,
      model: model.name,
      vehicleCount: model._count.vehicles,
      vehicleType: model.vehicleType
    }))
    .sort((a, b) => b.vehicleCount - a.vehicleCount);
}

async function calculateUtilizationMetrics(whereClause: any, dateRanges: any) {
  // This is a simplified calculation - you might want to enhance based on actual usage data
  const assignedVehicles = await prisma.vehicle.count({
    where: {
      ...whereClause,
      operationalStatus: 'Assigned'
    }
  });
  
  const totalVehicles = await prisma.vehicle.count({ where: whereClause });
  
  return {
    utilizationRate: totalVehicles > 0 ? parseFloat(((assignedVehicles / totalVehicles) * 100).toFixed(2)) : 0,
    assignedVehicles,
    availableVehicles: totalVehicles - assignedVehicles
  };
}

async function calculateMaintenanceMetrics(whereClause: any, dateRanges: any) {
  const underMaintenance = await prisma.vehicle.count({
    where: {
      ...whereClause,
      operationalStatus: 'Under Maintenance'
    }
  });
  
  const recentServices = await prisma.serviceRecord.count({
    where: {
      serviceDate: {
        gte: dateRanges.start,
        lte: dateRanges.end
      }
    }
  });
  
  const totalVehicles = await prisma.vehicle.count({ where: whereClause });
  
  return {
    vehiclesUnderMaintenance: underMaintenance,
    maintenanceRate: totalVehicles > 0 ? parseFloat(((underMaintenance / totalVehicles) * 100).toFixed(2)) : 0,
    recentServices
  };
}

function generateMonthlyTrend(records: any[], dateField: string) {
  const monthlyData: { [key: string]: number } = {};
  
  records.forEach(record => {
    const date = new Date(record[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });
  
  return Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
