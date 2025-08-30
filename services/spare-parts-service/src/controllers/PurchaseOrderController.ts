import { Request, Response } from 'express';
import { prisma } from '../config';
import { getPaginationParams } from '../utils';

export class PurchaseOrderController {
  /**
   * Get all purchase orders with filtering and pagination
   */
  async getPurchaseOrders(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        status: req.query.status as string,
        supplierId: req.query.supplierId as string,
        from: req.query.from as string,
        to: req.query.to as string,
      };

      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) {
          where.createdAt.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.createdAt.lte = new Date(filters.to);
        }
      }

      const [purchaseOrders, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
          where,
          include: {
            supplier: true,
            items: {
              include: {
                sparePart: true,
              },
            },
          },
          skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
          take: pagination.limit || 10,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.purchaseOrder.count({ where }),
      ]);

      res.json({
        success: true,
        data: purchaseOrders,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total,
          pages: Math.ceil(total / (pagination.limit || 10)),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve purchase orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: {
            include: {
              sparePart: true,
            },
          },
        },
      });

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.json({
        success: true,
        data: purchaseOrder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve purchase order',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create new purchase order
   */
  async createPurchaseOrder(req: Request, res: Response) {
    try {
      const { supplierId, storeId, storeName, items, notes } = req.body;
      const createdBy = req.user?.id || 'system';

      if (!supplierId || !storeId || !storeName || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'supplierId, storeId, storeName, and items array are required',
        });
      }

      // Calculate total
      let totalAmount = 0;
      items.forEach((item: any) => {
        totalAmount += item.unitCost * item.quantity;
      });

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          supplierId,
          storeId,
          storeName,
          orderNumber: `PO-${Date.now()}`,
          totalAmount,
          status: 'PENDING',
          notes,
          createdBy,
          items: {
            create: items.map((item: any) => ({
              sparePartId: item.sparePartId,
              orderedQuantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.unitCost * item.quantity,
            })),
          },
        },
        include: {
          supplier: true,
          items: {
            include: {
              sparePart: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: purchaseOrder,
        message: 'Purchase order created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase order',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update purchase order status
   */
  async updatePurchaseOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      // If status is RECEIVED, update received date
      if (status === 'RECEIVED') {
        updateData.receivedDate = new Date();
      }

      const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          supplier: true,
          items: {
            include: {
              sparePart: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: purchaseOrder,
        message: 'Purchase order status updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update purchase order status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Receive purchase order items
   */
  async receivePurchaseOrderItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { receivedItems } = req.body;
      const receivedBy = req.user?.id || 'system';

      if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'receivedItems array is required',
        });
      }

      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      // Process received items and update inventory
      const stockMovements: any[] = [];
      for (const receivedItem of receivedItems) {
        const orderItem = purchaseOrder.items.find(
          (item: any) => item.sparePartId === receivedItem.sparePartId
        );

        if (orderItem && receivedItem.receivedQuantity > 0) {
          // Create stock movement for received items
          stockMovements.push({
            sparePartId: receivedItem.sparePartId,
            storeId: receivedItem.storeId,
            movementType: 'IN',
            quantity: receivedItem.receivedQuantity,
            referenceType: 'PURCHASE_ORDER',
            referenceId: id,
            notes: `Received from PO ${purchaseOrder.orderNumber}`,
            createdBy: receivedBy,
          });
        }
      }

      // Create stock movements in transaction
      if (stockMovements.length > 0) {
        await prisma.$transaction(async (tx) => {
          // Create stock movements
          await tx.stockMovement.createMany({
            data: stockMovements,
          });

          // Update or create inventory levels
          for (const movement of stockMovements) {
            await tx.inventoryLevel.upsert({
              where: {
                sparePartId_storeId: {
                  sparePartId: movement.sparePartId,
                  storeId: movement.storeId,
                },
              },
              update: {
                currentStock: {
                  increment: movement.quantity,
                },
                updatedAt: new Date(),
              },
              create: {
                sparePartId: movement.sparePartId,
                storeId: movement.storeId,
                storeName: 'Default Store', // You might want to fetch this
                currentStock: movement.quantity,
                minimumStock: 10,
                maximumStock: 100,
                reorderLevel: 20,
              },
            });
          }
        });
      }

      // Update purchase order status
      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
        },
      });

      res.json({
        success: true,
        message: 'Purchase order items received successfully',
        data: {
          purchaseOrderId: id,
          receivedItemsCount: stockMovements.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to receive purchase order items',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
