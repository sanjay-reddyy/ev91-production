import { Request, Response } from "express";
import { prisma } from "../config";
import { getPaginationParams } from "../utils";

export class SupplierController {
  /**
   * Get all suppliers with filtering and pagination
   */
  async getSuppliers(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        rating: req.query.rating
          ? parseFloat(req.query.rating as string)
          : undefined,
      };

      const where: any = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { contactPerson: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.rating) {
        where.rating = { gte: filters.rating };
      }

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
          take: pagination.limit || 10,
          orderBy: { name: "asc" },
        }),
        prisma.supplier.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          suppliers,
          pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / (pagination.limit || 10)),
            currentPage: pagination.page || 1,
            pageSize: pagination.limit || 10,
            hasNext: (pagination.page || 1) * (pagination.limit || 10) < total,
            hasPrev: (pagination.page || 1) > 1,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve suppliers",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          spareParts: {
            take: 10,
            select: {
              id: true,
              name: true,
              partNumber: true,
            },
          },
          purchaseOrders: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve supplier",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(req: Request, res: Response) {
    try {
      const supplierData = req.body;

      if (
        !supplierData.name ||
        !supplierData.contactPerson ||
        !supplierData.email
      ) {
        return res.status(400).json({
          success: false,
          message: "name, contactPerson, and email are required",
        });
      }

      const supplier = await prisma.supplier.create({
        data: supplierData,
      });

      res.status(201).json({
        success: true,
        data: supplier,
        message: "Supplier created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create supplier",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate required fields for update
      if (
        !updateData.name ||
        !updateData.displayName ||
        !updateData.code ||
        !updateData.supplierType
      ) {
        return res.status(400).json({
          success: false,
          message: "name, displayName, code, and supplierType are required",
        });
      }

      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: supplier,
        message: "Supplier updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update supplier",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.supplier.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete supplier",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
