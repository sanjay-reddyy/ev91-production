import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get usage analytics
router.get('/usage-analytics', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Mock data for usage analytics
    const mockData = {
      success: true,
      data: {
        monthlyTrends: [
          { month: '2025-01', totalUsage: 120, totalCost: 15000, orderCount: 8 },
          { month: '2025-02', totalUsage: 95, totalCost: 12000, orderCount: 6 },
          { month: '2025-03', totalUsage: 140, totalCost: 18000, orderCount: 10 },
          { month: '2025-04', totalUsage: 110, totalCost: 14000, orderCount: 7 },
          { month: '2025-05', totalUsage: 160, totalCost: 20000, orderCount: 12 },
          { month: '2025-06', totalUsage: 130, totalCost: 16000, orderCount: 9 },
        ],
        categoryBreakdown: [
          { category: 'ENGINE', count: 45, totalValue: 25000 },
          { category: 'BRAKE', count: 32, totalValue: 18000 },
          { category: 'ELECTRICAL', count: 28, totalValue: 15000 },
          { category: 'BODY', count: 20, totalValue: 12000 },
          { category: 'SUSPENSION', count: 18, totalValue: 10000 },
          { category: 'TRANSMISSION', count: 12, totalValue: 8000 },
        ],
        topUsedParts: [
          { name: 'Brake Pads - Front', usage: 25, trend: 15.2 },
          { name: 'Oil Filter', usage: 22, trend: 8.5 },
          { name: 'Air Filter', usage: 18, trend: -3.1 },
          { name: 'Spark Plugs', usage: 16, trend: 12.7 },
          { name: 'Brake Discs', usage: 14, trend: 5.9 },
        ]
      }
    };
    res.json(mockData);
  })
);

// Get cost analysis
router.get('/cost-analysis', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ 
      success: true, 
      data: {
        totalSpent: 95000,
        avgOrderValue: 2500,
        costTrends: [
          { month: '2025-01', amount: 15000 },
          { month: '2025-02', amount: 12000 },
          { month: '2025-03', amount: 18000 },
          { month: '2025-04', amount: 14000 },
          { month: '2025-05', amount: 20000 },
          { month: '2025-06', amount: 16000 },
        ]
      }
    });
  })
);

// Get inventory trends
router.get('/inventory-trends', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ 
      success: true, 
      data: {
        turnoverRate: 4.2,
        stockAccuracy: 0.95,
        trends: [
          { month: '2025-01', inflow: 200, outflow: 180 },
          { month: '2025-02', inflow: 150, outflow: 170 },
          { month: '2025-03', inflow: 250, outflow: 220 },
          { month: '2025-04', inflow: 180, outflow: 160 },
          { month: '2025-05', inflow: 300, outflow: 280 },
          { month: '2025-06', inflow: 220, outflow: 200 },
        ]
      }
    });
  })
);

// Get supplier performance
router.get('/supplier-performance', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ 
      success: true, 
      data: [
        { supplier: 'AutoParts Pro', orders: 25, totalValue: 45000, avgDeliveryTime: 3.2, rating: 4.8 },
        { supplier: 'Quality Motors', orders: 18, totalValue: 32000, avgDeliveryTime: 2.8, rating: 4.6 },
        { supplier: 'Express Parts', orders: 12, totalValue: 18000, avgDeliveryTime: 1.5, rating: 4.3 },
      ]
    });
  })
);

// Get all analytics
router.get('/', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Analytics endpoints available at /usage-analytics, /cost-analysis, /inventory-trends, /supplier-performance' });
  })
);

export default router;
