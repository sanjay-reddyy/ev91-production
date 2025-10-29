import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createServiceRecord = async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      serviceType,
      description,
      workPerformed = "",
    } = req.body;

    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        vehicleId,
        serviceType,
        serviceDate: new Date(),
        description,
        workPerformed,
        serviceStatus: "Scheduled",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service record created successfully",
      data: { serviceRecord },
    });
  } catch (error) {
    console.error("Error creating service record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getServiceRecords = async (req: Request, res: Response) => {
  try {
    const serviceRecords = await prisma.serviceRecord.findMany({
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            model: {
              select: {
                id: true,
                name: true,
                oem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        serviceDate: "desc",
      },
    });
    return res.json({
      success: true,
      message: "Service records retrieved successfully",
      data: { serviceRecords },
    });
  } catch (error) {
    console.error("Error fetching service records:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getServiceRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const serviceRecord = await prisma.serviceRecord.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            model: {
              select: {
                id: true,
                name: true,
                oem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!serviceRecord) {
      return res.status(404).json({
        success: false,
        message: "Service record not found",
      });
    }

    return res.json({
      success: true,
      data: { serviceRecord },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateServiceRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const serviceRecord = await prisma.serviceRecord.update({
      where: { id },
      data: req.body,
    });
    return res.json({ success: true, data: { serviceRecord } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteServiceRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.serviceRecord.delete({ where: { id } });
    return res.json({
      success: true,
      message: "Service record deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getVehicleServiceHistory = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const serviceHistory = await prisma.serviceRecord.findMany({
      where: { vehicleId },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            model: {
              select: {
                id: true,
                name: true,
                oem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        serviceDate: "desc",
      },
    });
    return res.json({ success: true, data: { serviceHistory } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.body;
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { operationalStatus: status },
    });
    return res.json({ success: true, data: { vehicle: updatedVehicle } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getServiceStatistics = async (req: Request, res: Response) => {
  try {
    const totalServices = await prisma.serviceRecord.count();
    return res.json({ success: true, data: { totalServices } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getDueServices = async (req: Request, res: Response) => {
  try {
    const dueServices = await prisma.serviceRecord.findMany({
      where: { serviceStatus: "Scheduled" },
    });
    return res.json({ success: true, data: { dueServices } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const generateServiceReport = async (req: Request, res: Response) => {
  try {
    const serviceRecords = await prisma.serviceRecord.findMany();
    return res.json({ success: true, data: { serviceRecords } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const scheduleService = async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      serviceType,
      scheduledDate,
      description,
      workPerformed = "",
    } = req.body;
    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        vehicleId,
        serviceType,
        serviceDate: new Date(scheduledDate),
        description,
        workPerformed,
        serviceStatus: "Scheduled",
      },
    });
    return res.status(201).json({ success: true, data: { serviceRecord } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const uploadServiceMedia = async (req: Request, res: Response) => {
  return res.json({ success: true, message: "Media upload endpoint" });
};

export const getServiceMedia = async (req: Request, res: Response) => {
  return res.json({ success: true, message: "Media retrieval endpoint" });
};

export const deleteServiceMedia = async (req: Request, res: Response) => {
  return res.json({ success: true, message: "Media deletion endpoint" });
};
