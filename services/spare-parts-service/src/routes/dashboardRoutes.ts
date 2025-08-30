import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get dashboard stats
router.get('/stats', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Mock dashboard statistics
    const mockStats = {
      success: true,
      data: {
        totalUsage: 755,
        usageTrend: 12.5,
        totalCost: 95000,
        costTrend: -5.2,
        purchaseOrders: 38,
        ordersTrend: 8.7,
        inventoryTurnover: 4.2,
        stockAvailability: 0.87,
        orderFulfillmentRate: 0.94,
        costEfficiency: 0.78,
        supplierPerformance: 0.85,
        totalParts: 156,
        totalValue: 450000,
        lowStockAlerts: 8,
        pendingOrders: 5,
        monthlyUsage: 130,
        supplierCount: 12,
        topCategories: [
          { category: 'ENGINE', count: 45, value: 125000 },
          { category: 'BRAKE', count: 32, value: 89000 },
          { category: 'ELECTRICAL', count: 28, value: 67000 },
          { category: 'BODY', count: 20, value: 45000 },
          { category: 'SUSPENSION', count: 18, value: 78000 },
          { category: 'TRANSMISSION', count: 13, value: 46000 },
        ],
        recentMovements: [
          {
            id: 1,
            sparePartId: 'sp001',
            storeId: 'store001',
            movementType: 'OUT',
            quantity: 5,
            reason: 'Vehicle Service',
            createdAt: '2025-08-06T10:30:00Z'
          },
          {
            id: 2,
            sparePartId: 'sp002',
            storeId: 'store001',
            movementType: 'IN',
            quantity: 20,
            reason: 'Purchase Order',
            createdAt: '2025-08-06T09:15:00Z'
          }
        ],
        lowStockItems: [
          {
            sparePart: { id: 'sp001', name: 'Brake Pads - Front', partNumber: 'BP-001' },
            currentQuantity: 3,
            minThreshold: 10,
            store: 'Main Warehouse'
          },
          {
            sparePart: { id: 'sp005', name: 'Oil Filter', partNumber: 'OF-005' },
            currentQuantity: 2,
            minThreshold: 15,
            store: 'Main Warehouse'
          }
        ]
      }
    };
    res.json(mockStats);
  })
);

// Get recent activities
router.get('/recent-activities', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const mockActivities = {
      success: true,
      data: [
        {
          id: 1,
          type: 'STOCK_MOVEMENT',
          description: 'Brake Pads - Front (5 units) moved out for Vehicle Service',
          timestamp: '2025-08-06T10:30:00Z',
          user: 'John Mechanic'
        },
        {
          id: 2,
          type: 'PURCHASE_ORDER',
          description: 'New purchase order created for Oil Filters (50 units)',
          timestamp: '2025-08-06T09:15:00Z',
          user: 'Sarah Manager'
        },
        {
          id: 3,
          type: 'LOW_STOCK_ALERT',
          description: 'Low stock alert for Spark Plugs (Current: 8, Min: 20)',
          timestamp: '2025-08-06T08:45:00Z',
          user: 'System'
        },
        {
          id: 4,
          type: 'STOCK_MOVEMENT',
          description: 'Air Filter (10 units) moved in from Purchase Order',
          timestamp: '2025-08-06T08:00:00Z',
          user: 'Mike Warehouse'
        },
        {
          id: 5,
          type: 'PART_ADDED',
          description: 'New spare part added: Transmission Fluid Filter',
          timestamp: '2025-08-05T16:30:00Z',
          user: 'Admin User'
        }
      ].slice(0, limit)
    };
    res.json(mockActivities);
  })
);

// Default dashboard route
router.get('/', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Dashboard endpoints available at /stats, /recent-activities' });
  })
);

export default router;
