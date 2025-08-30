import { Router } from "express";
import OutwardFlowController from "../controllers/outwardFlowController";

const router = Router();

/**
 * Routes for Spare Parts Outward Flow Management
 * All routes are prefixed with /api/spare-parts/outward
 */

// ================================
// PART REQUESTS
// ================================

/**
 * @route   POST /api/spare-parts/outward/request
 * @desc    Create a new spare part request from technician
 * @access  Technician, Supervisor
 * @body    SparePartRequestInput
 */
router.post("/request", OutwardFlowController.createPartRequest);

/**
 * @route   GET /api/spare-parts/outward/requests
 * @desc    Get spare part requests with filters and pagination
 * @access  Supervisor, Manager, Admin
 * @query   serviceRequestId, sparePartId, technicianId, storeId, status, urgency, dateFrom, dateTo, page, limit
 */
router.get("/requests", OutwardFlowController.getPartRequests);

/**
 * @route   POST /api/spare-parts/outward/requests/:id/approve
 * @desc    Approve a spare part request
 * @access  Supervisor, Manager, Admin
 * @params  id (request ID)
 * @body    { approverId, comments?, conditions? }
 */
router.post("/requests/:id/approve", OutwardFlowController.approvePartRequest);

/**
 * @route   POST /api/spare-parts/outward/requests/:id/issue
 * @desc    Issue approved parts to technician
 * @access  Store Manager, Admin
 * @params  id (request ID)
 */
router.post(
  "/requests/:id/issue",
  OutwardFlowController.issuePartsToTechnician
);

// ================================
// INSTALLATION & RETURNS
// ================================

/**
 * @route   POST /api/spare-parts/outward/install
 * @desc    Record spare part installation on vehicle
 * @access  Technician, Supervisor
 * @body    PartInstallationInput
 */
router.post("/install", OutwardFlowController.installSparePart);

/**
 * @route   POST /api/spare-parts/outward/return
 * @desc    Return unused parts to inventory
 * @access  Technician, Supervisor
 * @body    { serviceRequestId, returns: PartReturnInput[] }
 */
router.post("/return", OutwardFlowController.returnUnusedParts);

/**
 * @route   GET /api/spare-parts/outward/installed/:serviceRequestId
 * @desc    Get installed parts for a service request
 * @access  Technician, Supervisor, Manager
 * @params  serviceRequestId
 */
router.get(
  "/installed/:serviceRequestId",
  OutwardFlowController.getInstalledParts
);

// ================================
// COST CALCULATION
// ================================

/**
 * @route   GET /api/spare-parts/outward/cost/:serviceRequestId
 * @desc    Calculate service cost breakdown including parts
 * @access  Supervisor, Manager, Admin
 * @params  serviceRequestId
 */
router.get(
  "/cost/:serviceRequestId",
  OutwardFlowController.calculateServiceCost
);

// ================================
// APPROVAL & TRACKING
// ================================

/**
 * @route   GET /api/spare-parts/outward/requests/:id/approval-history
 * @desc    Get approval history for a request
 * @access  Supervisor, Manager, Admin
 * @params  id (request ID)
 */
router.get(
  "/requests/:id/approval-history",
  OutwardFlowController.getApprovalHistory
);

/**
 * @route   GET /api/spare-parts/outward/stock-availability/:sparePartId/:storeId
 * @desc    Check stock availability for a part at a store
 * @access  Technician, Supervisor, Manager
 * @params  sparePartId, storeId
 * @query   quantity (optional, default: 1)
 */
router.get(
  "/stock-availability/:sparePartId/:storeId",
  OutwardFlowController.getStockAvailability
);

// ================================
// ANALYTICS & REPORTING
// ================================

/**
 * @route   GET /api/spare-parts/outward/analytics
 * @desc    Get outward flow analytics and statistics
 * @access  Manager, Admin
 * @query   storeId?, dateFrom?, dateTo?
 */
router.get("/analytics", OutwardFlowController.getOutwardAnalytics);

export default router;
