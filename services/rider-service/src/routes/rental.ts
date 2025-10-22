import { Router } from "express";
import {
  updateVehiclePreference,
  getCurrentRental,
  createRental,
  updateRental,
  terminateRental,
  getRentalHistory,
  getRentalPayments,
  updateRentalPayment,
  updateVehiclePreferenceValidation,
  createRentalValidation,
  updateRentalValidation,
  updatePaymentValidation,
  // Phase 4: Automated Business Logic Endpoints
  calculateRentalCost,
  comparePricing,
  getRiderBalance,
  processPaymentDeduction,
  getPaymentStatistics,
  sendTestNotification,
} from "../controllers/rentalController";

const router = Router();

/**
 * Rider EV Rental Management Routes
 *
 * Base path: /api/riders
 */

// ==========================================
// VEHICLE PREFERENCE ROUTES
// ==========================================

/**
 * Update rider's vehicle preference
 * @route PATCH /api/riders/:id/vehicle-preference
 * @description Update whether rider needs EV rental and their preference
 * @body {
 *   needsEvRental: boolean,
 *   vehiclePreference?: string,
 *   preferredVehicleModelId?: string
 * }
 */
router.patch(
  "/:id/vehicle-preference",
  updateVehiclePreferenceValidation,
  updateVehiclePreference
);

// ==========================================
// RENTAL MANAGEMENT ROUTES
// ==========================================

/**
 * Get current active rental for rider
 * @route GET /api/riders/:id/rental
 * @description Get details of rider's current active rental
 */
router.get("/:id/rental", getCurrentRental);

/**
 * Create new rental (assign vehicle to rider)
 * @route POST /api/riders/:id/rental
 * @description Create a new rental and assign vehicle to rider
 * @body {
 *   vehicleModelId: string,
 *   vehicleId: string,
 *   monthlyRentalCost: number,
 *   startDate: string (ISO date),
 *   securityDeposit?: number,
 *   notes?: string,
 *   adminNotes?: string
 * }
 */
router.post("/:id/rental", createRentalValidation, createRental);

/**
 * Update rental details
 * @route PATCH /api/riders/:id/rental/:rentalId
 * @description Update rental status or other details
 * @body {
 *   status?: string,
 *   terminationReason?: string,
 *   adminNotes?: string
 * }
 */
router.patch("/:id/rental/:rentalId", updateRentalValidation, updateRental);

/**
 * Terminate rental
 * @route DELETE /api/riders/:id/rental/:rentalId
 * @description Terminate an active rental
 * @body {
 *   terminationReason?: string,
 *   terminatedBy?: string
 * }
 */
router.delete("/:id/rental/:rentalId", terminateRental);

// ==========================================
// RENTAL HISTORY ROUTES
// ==========================================

/**
 * Get rental history for rider
 * @route GET /api/riders/:id/rental-history
 * @description Get all past and current rentals for a rider
 */
router.get("/:id/rental-history", getRentalHistory);

// ==========================================
// PAYMENT ROUTES
// ==========================================

/**
 * Get rental payments for rider
 * @route GET /api/riders/:id/rental-payments
 * @description Get all rental payments for a rider
 * @query {
 *   status?: string,
 *   rentalId?: string
 * }
 */
router.get("/:id/rental-payments", getRentalPayments);

/**
 * Update rental payment status
 * @route PATCH /api/riders/:id/rental-payments/:paymentId
 * @description Update payment status (paid, waived, etc.)
 * @body {
 *   status?: string,
 *   paidDate?: string (ISO date),
 *   paymentMethod?: string,
 *   transactionId?: string,
 *   isWaived?: boolean,
 *   waiverReason?: string,
 *   adminNotes?: string
 * }
 */
router.patch(
  "/:id/rental-payments/:paymentId",
  updatePaymentValidation,
  updateRentalPayment
);

// ==========================================
// PHASE 4: AUTOMATED BUSINESS LOGIC ROUTES
// ==========================================

/**
 * Calculate rental cost with depreciation
 * @route POST /api/rentals/calculate-cost
 * @description Calculate rental cost based on vehicle age and depreciation
 * @body {
 *   vehicleModelId: string,
 *   vehicleAge?: number (in months, default: 0),
 *   rentalPeriodMonths?: number (default: 12)
 * }
 */
router.post("/calculate-cost", calculateRentalCost);

/**
 * Compare pricing for new vs used vehicles
 * @route POST /api/rentals/compare-pricing
 * @description Compare rental costs between new and used vehicles
 * @body {
 *   vehicleModelId: string,
 *   newVehicleAge?: number (default: 0),
 *   usedVehicleAge?: number (default: 12),
 *   rentalPeriodMonths?: number (default: 12)
 * }
 */
router.post("/compare-pricing", comparePricing);

/**
 * Get rider balance and payment eligibility
 * @route GET /api/riders/:id/balance
 * @description Get rider's earnings balance and payment deduction eligibility
 */
router.get("/:id/balance", getRiderBalance);

/**
 * Process payment deduction manually
 * @route POST /api/rentals/payments/:paymentId/deduct
 * @description Manually trigger payment deduction from rider earnings
 */
router.post("/payments/:paymentId/deduct", processPaymentDeduction);

/**
 * Get payment statistics for a rental
 * @route GET /api/rentals/:rentalId/payment-stats
 * @description Get comprehensive payment statistics for a rental
 */
router.get("/:rentalId/payment-stats", getPaymentStatistics);

/**
 * Send test notification (Admin only)
 * @route POST /api/rentals/notifications/test
 * @description Send test notification for testing purposes
 * @body {
 *   riderId: string,
 *   type: string (PAYMENT_REMINDER | PAYMENT_OVERDUE | PAYMENT_CONFIRMED),
 *   paymentId: string
 * }
 */
router.post("/notifications/test", sendTestNotification);

export default router;
