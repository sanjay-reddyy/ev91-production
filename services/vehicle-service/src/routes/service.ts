import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createServiceRecord,
  getServiceRecords,
  getServiceRecord,
  updateServiceRecord,
  scheduleService,
  getUpcomingServices,
  getServiceAnalytics
} from '../controllers/serviceController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/service:
 *   post:
 *     summary: Create a new service record
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceRecordRequest'
 *     responses:
 *       201:
 *         description: Service record created successfully
 */
router.post(
  '/',
  authMiddleware,
  requireRole(['admin', 'fleet_manager', 'mechanic']),
  [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('serviceType').isIn(['Preventive', 'Corrective', 'Emergency']).withMessage('Valid service type is required'),
    body('serviceDate').isISO8601().withMessage('Valid service date is required'),
    body('description').notEmpty().withMessage('Service description is required'),
    body('workPerformed').notEmpty().withMessage('Work performed is required'),
    body('totalCost').isNumeric().withMessage('Total cost must be a number')
  ],
  validateRequest,
  createServiceRecord
);

/**
 * @swagger
 * /api/v1/service:
 *   get:
 *     summary: Get service records with filtering
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [Preventive, Corrective, Emergency]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of service records
 */
router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('serviceType').optional().isIn(['Preventive', 'Corrective', 'Emergency'])
  ],
  validateRequest,
  getServiceRecords
);

/**
 * @swagger
 * /api/v1/service/{id}:
 *   get:
 *     summary: Get service record by ID
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service record details
 *       404:
 *         description: Service record not found
 */
router.get(
  '/:id',
  authMiddleware,
  [param('id').notEmpty().withMessage('Service record ID is required')],
  validateRequest,
  getServiceRecord
);

/**
 * @swagger
 * /api/v1/service/{id}:
 *   put:
 *     summary: Update service record
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateServiceRecordRequest'
 *     responses:
 *       200:
 *         description: Service record updated successfully
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole(['admin', 'fleet_manager', 'mechanic']),
  [
    param('id').notEmpty().withMessage('Service record ID is required'),
    body('serviceType').optional().isIn(['Preventive', 'Corrective', 'Emergency']),
    body('serviceDate').optional().isISO8601(),
    body('totalCost').optional().isNumeric()
  ],
  validateRequest,
  updateServiceRecord
);

/**
 * @swagger
 * /api/v1/service/schedule:
 *   post:
 *     summary: Schedule upcoming service
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *               serviceType:
 *                 type: string
 *                 enum: [Preventive, Corrective, Emergency]
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service scheduled successfully
 */
router.post(
  '/schedule',
  authMiddleware,
  requireRole(['admin', 'fleet_manager']),
  [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('serviceType').isIn(['Preventive', 'Corrective', 'Emergency']).withMessage('Valid service type is required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
    body('description').notEmpty().withMessage('Service description is required')
  ],
  validateRequest,
  scheduleService
);

/**
 * @swagger
 * /api/v1/service/upcoming:
 *   get:
 *     summary: Get upcoming scheduled services
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: List of upcoming services
 */
router.get(
  '/upcoming',
  authMiddleware,
  [query('days').optional().isInt({ min: 1, max: 365 })],
  validateRequest,
  getUpcomingServices
);

/**
 * @swagger
 * /api/v1/service/analytics:
 *   get:
 *     summary: Get service analytics and statistics
 *     tags: [Service]
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
router.get(
  '/analytics',
  authMiddleware,
  requireRole(['admin', 'fleet_manager']),
  [query('period').optional().isIn(['week', 'month', 'quarter', 'year'])],
  validateRequest,
  getServiceAnalytics
);

export default router;
