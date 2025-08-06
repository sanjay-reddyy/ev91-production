import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { prisma } from '../config';
import { getPaginationParams } from '../utils';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService(prisma);
  }

  /**
   * Get stock levels with filtering and pagination
   */
  async getStockLevels(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query);
      const filters = {
        storeId: req.query.storeId as string,
        sparePartId: req.query.sparePartId as string,
        lowStock: req.query.lowStock === 'true',
        outOfStock: req.query.outOfStock === 'true',
        minQuantity: req.query.minQuantity ? parseInt(req.query.minQuantity as string) : undefined,
        maxQuantity: req.query.maxQuantity ? parseInt(req.query.maxQuantity as string) : undefined,
      };

      const result = await this.inventoryService.getStockLevels(filters, pagination);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stock levels',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get specific stock level
   */
  async getStockLevel(req: Request, res: Response) {
    try {
      const { storeId, sparePartId } = req.params;
      const result = await this.inventoryService.getStockLevel(storeId, sparePartId);
      
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stock level',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Initialize stock for new spare part
   */
  async initializeStock(req: Request, res: Response) {
    try {
      const { 
        sparePartId, 
        storeId, 
        storeName, 
        initialStock = 0, 
        minimumStock = 10, 
        maximumStock = 100, 
        reorderLevel = 20 
      } = req.body;

      if (!sparePartId || !storeId || !storeName) {
        return res.status(400).json({
          success: false,
          message: 'sparePartId, storeId, and storeName are required',
        });
      }

      const result = await this.inventoryService.initializeStock(
        sparePartId,
        storeId,
        storeName,
        initialStock,
        minimumStock,
        maximumStock,
        reorderLevel
      );
      
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create stock movement
   */
  async createStockMovement(req: Request, res: Response) {
    try {
      const movementRequest = req.body;
      const createdBy = req.user?.id || 'system';

      if (!movementRequest.sparePartId || !movementRequest.storeId || !movementRequest.movementType || !movementRequest.quantity) {
        return res.status(400).json({
          success: false,
          message: 'sparePartId, storeId, movementType, and quantity are required',
        });
      }

      const result = await this.inventoryService.createStockMovement(movementRequest, createdBy);
      
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create stock movement',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reserve stock
   */
  async reserveStock(req: Request, res: Response) {
    try {
      const { sparePartId, storeId, quantity, referenceType, referenceId } = req.body;
      const createdBy = req.user?.id || 'system';

      if (!sparePartId || !storeId || !quantity || !referenceType || !referenceId) {
        return res.status(400).json({
          success: false,
          message: 'sparePartId, storeId, quantity, referenceType, and referenceId are required',
        });
      }

      const result = await this.inventoryService.reserveStock(
        sparePartId,
        storeId,
        quantity,
        referenceType,
        referenceId,
        createdBy
      );
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reserve stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Release reserved stock
   */
  async releaseReservedStock(req: Request, res: Response) {
    try {
      const { sparePartId, storeId, quantity, referenceType, referenceId } = req.body;
      const createdBy = req.user?.id || 'system';

      if (!sparePartId || !storeId || !quantity || !referenceType || !referenceId) {
        return res.status(400).json({
          success: false,
          message: 'sparePartId, storeId, quantity, referenceType, and referenceId are required',
        });
      }

      const result = await this.inventoryService.releaseReservedStock(
        sparePartId,
        storeId,
        quantity,
        referenceType,
        referenceId,
        createdBy
      );
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to release reserved stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const storeId = req.query.storeId as string;
      const result = await this.inventoryService.getLowStockAlerts(storeId);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve low stock alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Perform stock count
   */
  async performStockCount(req: Request, res: Response) {
    try {
      const { storeId, countData } = req.body;
      const countedBy = req.user?.id || 'system';

      if (!storeId || !Array.isArray(countData) || countData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'storeId and countData array are required',
        });
      }

      const result = await this.inventoryService.performStockCount(storeId, countData, countedBy);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to perform stock count',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
