import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleStatus,
  updateVehicleStatus,
  assignVehicle,
  unassignVehicle,
  getVehicleHistory,
  getVehicleStats,
  getAnalytics,
} from "../controllers/vehicleController";
import { authMiddleware, optionalAuth, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";

const router = Router();

/**
 * @swagger
 * /api/v1/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVehicleRequest'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  optionalAuth,
  // requireRole(['admin', 'fleet_manager', 'super_admin']), // Temporarily disabled for testing
  [
    body("modelId").notEmpty().withMessage("Model ID is required"),
    body("registrationNumber")
      .notEmpty()
      .withMessage("Registration Number is required"),
    body("color").notEmpty().withMessage("Color is required"),
    body("operationalStatus")
      .optional()
      .isIn([
        "Available",
        "Assigned",
        "Under Maintenance",
        "Retired",
        "Damaged",
      ]),
    body("serviceStatus")
      .optional()
      .isIn(["Active", "Inactive", "Scheduled for Service"]),
    body("registrationDate")
      .optional()
      .isISO8601()
      .withMessage("Valid registration date is required"),
    body("purchaseDate")
      .optional()
      .isISO8601()
      .withMessage("Valid purchase date is required"),
    body("year")
      .optional()
      .isInt({ min: 2000, max: 2030 })
      .withMessage("Year must be between 2000 and 2030"),
    body("mileage")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Mileage must be a positive number"),
  ],
  validateRequest,
  createVehicle
);

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     summary: Get all vehicles with filtering and pagination
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: oemType
 *         schema:
 *           type: string
 *       - in: query
 *         name: operationalStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedRider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get(
  "/",
  // Temporarily removing all middleware for testing
  getVehicles
);

router.get("/analytics", optionalAuth, getAnalytics);

/**
 * @swagger
 * /api/v1/vehicles/stats:
 *   get:
 *     summary: Get vehicle analytics/stats (legacy)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle analytics data
 */
router.get("/stats", optionalAuth, getAnalytics);

/**
 * @swagger
 * /api/v1/vehicles/{id}/stats:
 *   get:
 *     summary: Get individual vehicle statistics
 *     tags: [Vehicles]
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
 *         description: Individual vehicle statistics including service and damage history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *                     services:
 *                       type: object
 *                     damages:
 *                       type: object
 *                     handovers:
 *                       type: object
 */
router.get(
  "/:id/stats",
  optionalAuth,
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  getVehicleStats
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
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
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 */
router.get(
  "/:id",
  optionalAuth,
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  getVehicleById
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
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
 *             $ref: '#/components/schemas/UpdateVehicleRequest'
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       404:
 *         description: Vehicle not found
 */
router.put(
  "/:id",
  optionalAuth, // Allow updates without auth for testing
  // requireRole(["admin", "fleet_manager", "super_admin"]), // Temporarily disabled for testing
  [
    param("id").notEmpty().withMessage("Vehicle ID is required"),
    body("modelId").optional().notEmpty(),
    body("hubId").optional().notEmpty(),
    body("registrationNumber").optional().notEmpty(),
    body("chassisNumber").optional(),
    body("engineNumber").optional(),
    body("variant").optional(),
    body("color").optional(),
    body("year")
      .optional()
      .isInt({ min: 2000, max: 2030 })
      .withMessage("Year must be between 2000 and 2030"),
    body("batteryCapacity")
      .optional()
      .isNumeric()
      .withMessage("Battery capacity must be numeric"),
    body("maxRange")
      .optional()
      .isNumeric()
      .withMessage("Max range must be numeric"),
    body("maxSpeed")
      .optional()
      .isNumeric()
      .withMessage("Max speed must be numeric"),
    body("mileage")
      .optional()
      .isNumeric()
      .withMessage("Mileage must be numeric"),
    body("purchasePrice")
      .optional()
      .isNumeric()
      .withMessage("Purchase price must be numeric"),
    body("currentValue")
      .optional()
      .isNumeric()
      .withMessage("Current value must be numeric"),
    body("purchaseDate")
      .optional()
      .isISO8601()
      .withMessage("Purchase date must be valid ISO date"),
    body("registrationDate")
      .optional()
      .isISO8601()
      .withMessage("Registration date must be valid ISO date"),
    body("operationalStatus")
      .optional()
      .isIn([
        "Available",
        "Assigned",
        "Under Maintenance",
        "Retired",
        "Damaged",
      ]),
    body("serviceStatus")
      .optional()
      .isIn(["Active", "Inactive", "Scheduled for Service"]),
  ],
  validateRequest,
  updateVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle (soft delete)
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin", "super_admin"]),
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  deleteVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/status:
 *   get:
 *     summary: Get vehicle status
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle status
 */
router.get(
  "/:id/status",
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  getVehicleStatus
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/status:
 *   patch:
 *     summary: Update vehicle status
 *     tags: [Vehicles]
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
 *             type: object
 *             properties:
 *               operationalStatus:
 *                 type: string
 *                 enum: [Available, Assigned, Under Maintenance, Retired, Damaged]
 *               serviceStatus:
 *                 type: string
 *                 enum: [Active, Inactive, Scheduled for Service]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  [
    param("id").notEmpty().withMessage("Vehicle ID is required"),
    body("operationalStatus")
      .notEmpty()
      .withMessage("Operational status is required")
      .isIn([
        "Available",
        "Assigned",
        "Under Maintenance",
        "Retired",
        "Damaged",
      ])
      .withMessage("Invalid operational status"),
    body("serviceStatus")
      .optional()
      .isIn(["Active", "Inactive", "Scheduled for Service"]),
    body("reason").optional().isString(),
  ],
  validateRequest,
  updateVehicleStatus
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/assign:
 *   post:
 *     summary: Assign vehicle to rider
 *     tags: [Vehicles]
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
 *             type: object
 *             properties:
 *               riderId:
 *                 type: string
 *               assignmentNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle assigned successfully
 */
router.post(
  "/:id/assign",
  [
    param("id").notEmpty().withMessage("Vehicle ID is required"),
    body("riderId").notEmpty().withMessage("Rider ID is required"),
  ],
  validateRequest,
  assignVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/unassign:
 *   post:
 *     summary: Unassign vehicle from rider
 *     tags: [Vehicles]
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
 *         description: Vehicle unassigned successfully
 */
router.post(
  "/:id/unassign",
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  unassignVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/history:
 *   get:
 *     summary: Get vehicle history (status changes, assignments, etc.)
 *     tags: [Vehicles]
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
 *         description: Vehicle history
 */
router.get(
  "/:id/history",
  authMiddleware,
  [param("id").notEmpty().withMessage("Vehicle ID is required")],
  validateRequest,
  getVehicleHistory
);

export default router;
