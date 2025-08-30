import { Router } from 'express';
import { getVehicleAnalytics, getServiceAnalytics, getDamageAnalytics, getFleetPerformance } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/vehicles:
 *   get:
 *     summary: Get comprehensive vehicle analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for analytics
 *       - in: query
 *         name: hubId
 *         schema:
 *           type: string
 *         description: Filter by specific hub
 *     responses:
 *       200:
 *         description: Vehicle analytics data
 */
router.get('/vehicles', getVehicleAnalytics);

/**
 * @swagger
 * /api/v1/analytics/services:
 *   get:
 *     summary: Get service analytics and statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Service analytics data
 */
router.get('/services', getServiceAnalytics);

/**
 * @swagger
 * /api/v1/analytics/damages:
 *   get:
 *     summary: Get damage analytics and statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Damage analytics data
 */
router.get('/damages', getDamageAnalytics);

/**
 * @swagger
 * /api/v1/analytics/fleet-performance:
 *   get:
 *     summary: Get overall fleet performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Fleet performance data
 */
router.get('/fleet-performance', getFleetPerformance);

export default router;
