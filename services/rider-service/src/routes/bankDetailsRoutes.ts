import express from "express";
import {
  addBankDetails,
  updateBankDetails,
  getRiderBankDetails,
  getBankDetailsById,
  deleteBankDetails,
  setPrimaryAccount,
  verifyBankDetails,
  rejectBankDetails,
} from "../controllers/bankDetailsController";

const router = express.Router();

/**
 * Bank Details Routes
 * Base path: /api/riders/bank-details
 */

// Add new bank account details for a rider
router.post("/", addBankDetails);

// Get all bank accounts for a rider
router.get("/rider/:riderId", getRiderBankDetails);

// Get specific bank account details by ID
router.get("/:bankDetailsId", getBankDetailsById);

// Update bank account details
router.put("/:bankDetailsId", updateBankDetails);

// Delete (deactivate) bank account details
router.delete("/:bankDetailsId", deleteBankDetails);

// Set a bank account as primary
router.patch("/:bankDetailsId/set-primary", setPrimaryAccount);

// Verify bank account details
router.patch("/:bankDetailsId/verify", verifyBankDetails);

// Reject bank account details
router.patch("/:bankDetailsId/reject", rejectBankDetails);

export default router;
