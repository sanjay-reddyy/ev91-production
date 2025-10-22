import { Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import {
  bankDetailsService,
  BankProofDocumentType,
} from "../services/bankDetailsService";
import multer from "multer";

// Configure multer for file upload (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only images and PDFs are allowed") as any
      );
    }
  },
});

/**
 * Validation middleware for adding bank details
 */
export const addBankDetailsValidation = [
  body("riderId").notEmpty().withMessage("Rider ID is required"),
  body("accountHolderName")
    .trim()
    .notEmpty()
    .withMessage("Account holder name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Account holder name must be 2-100 characters"),
  body("accountNumber")
    .trim()
    .notEmpty()
    .withMessage("Account number is required")
    .isLength({ min: 9, max: 18 })
    .withMessage("Account number must be 9-18 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Account number must contain only digits"),
  body("accountType")
    .isIn(["SAVINGS", "CURRENT"])
    .withMessage("Account type must be SAVINGS or CURRENT"),
  body("ifscCode")
    .trim()
    .notEmpty()
    .withMessage("IFSC code is required")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code format"),
  body("bankName")
    .trim()
    .notEmpty()
    .withMessage("Bank name is required")
    .isLength({ max: 200 })
    .withMessage("Bank name must be maximum 200 characters"),
  body("branchName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Branch name must be maximum 200 characters"),
  body("branchAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Branch address must be maximum 500 characters"),
  body("isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("proofType")
    .optional()
    .isIn(["PASSBOOK", "CANCELLED_CHEQUE", "BANK_STATEMENT"])
    .withMessage("Invalid proof document type"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be maximum 1000 characters"),
];

/**
 * Validation middleware for updating bank details
 */
export const updateBankDetailsValidation = [
  param("bankDetailsId").notEmpty().withMessage("Bank details ID is required"),
  body("accountHolderName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Account holder name must be 2-100 characters"),
  body("accountNumber")
    .optional()
    .trim()
    .isLength({ min: 9, max: 18 })
    .withMessage("Account number must be 9-18 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Account number must contain only digits"),
  body("accountType")
    .optional()
    .isIn(["SAVINGS", "CURRENT"])
    .withMessage("Account type must be SAVINGS or CURRENT"),
  body("ifscCode")
    .optional()
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code format"),
  body("bankName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Bank name must be maximum 200 characters"),
  body("isPrimary")
    .optional()
    .isBoolean()
    .withMessage("isPrimary must be a boolean"),
  body("verificationStatus")
    .optional()
    .isIn(["pending", "verified", "rejected"])
    .withMessage("Invalid verification status"),
  body("verificationNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Verification notes must be maximum 1000 characters"),
];

/**
 * Add bank account details for a rider
 */
export const addBankDetails = [
  upload.single("proofDocument"),
  ...addBankDetailsValidation,
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        riderId,
        accountHolderName,
        accountNumber,
        accountType,
        ifscCode,
        bankName,
        branchName,
        branchAddress,
        isPrimary,
        proofType,
        notes,
      } = req.body;

      // Get admin user ID from auth middleware (if available)
      const addedBy = (req as any).user?.id || "system";

      // Prepare bank data
      const bankData = {
        accountHolderName,
        accountNumber,
        accountType,
        ifscCode,
        bankName,
        branchName,
        branchAddress,
        isPrimary: isPrimary === "true" || isPrimary === true,
        notes,
        addedBy,
      };

      // Get uploaded file
      const proofFile = req.file;
      const proofDocType = proofType
        ? (proofType as BankProofDocumentType)
        : undefined;

      // Add bank details
      const result = await bankDetailsService.addBankDetails(
        riderId,
        bankData,
        proofFile,
        proofDocType
      );

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("❌ Error in addBankDetails controller:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to add bank details",
      });
    }
  },
];

/**
 * Update bank account details
 */
export const updateBankDetails = [
  upload.single("proofDocument"),
  ...updateBankDetailsValidation,
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { bankDetailsId } = req.params;
      const updateData = req.body;

      // Get admin user ID from auth middleware
      const lastEditedBy = (req as any).user?.id || "system";
      updateData.lastEditedBy = lastEditedBy;

      // If verifying or rejecting, add verifiedBy
      if (updateData.verificationStatus && !updateData.verifiedBy) {
        updateData.verifiedBy = lastEditedBy;
      }

      // Get uploaded file
      const proofFile = req.file;
      const proofDocType = updateData.proofType
        ? (updateData.proofType as BankProofDocumentType)
        : undefined;

      // Convert isPrimary to boolean if it's a string
      if (updateData.isPrimary !== undefined) {
        updateData.isPrimary =
          updateData.isPrimary === "true" || updateData.isPrimary === true;
      }

      // Update bank details
      const result = await bankDetailsService.updateBankDetails(
        bankDetailsId,
        updateData,
        proofFile,
        proofDocType
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("❌ Error in updateBankDetails controller:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update bank details",
      });
    }
  },
];

/**
 * Get all bank accounts for a rider
 */
export const getRiderBankDetails = async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "Rider ID is required",
      });
    }

    const result = await bankDetailsService.getRiderBankDetails(riderId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in getRiderBankDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bank details",
    });
  }
};

/**
 * Get specific bank account details by ID
 */
export const getBankDetailsById = async (req: Request, res: Response) => {
  try {
    const { bankDetailsId } = req.params;

    if (!bankDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Bank details ID is required",
      });
    }

    const result = await bankDetailsService.getBankDetailsById(bankDetailsId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in getBankDetailsById controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bank details",
    });
  }
};

/**
 * Delete (deactivate) bank account details
 */
export const deleteBankDetails = async (req: Request, res: Response) => {
  try {
    const { bankDetailsId } = req.params;

    if (!bankDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Bank details ID is required",
      });
    }

    // Get admin user ID from auth middleware
    const deletedBy = (req as any).user?.id || "system";

    const result = await bankDetailsService.deleteBankDetails(
      bankDetailsId,
      deletedBy
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in deleteBankDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete bank details",
    });
  }
};

/**
 * Set a bank account as primary
 */
export const setPrimaryAccount = async (req: Request, res: Response) => {
  try {
    const { bankDetailsId } = req.params;

    if (!bankDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Bank details ID is required",
      });
    }

    const result = await bankDetailsService.setPrimaryAccount(bankDetailsId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in setPrimaryAccount controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to set primary account",
    });
  }
};

/**
 * Verify bank account details
 */
export const verifyBankDetails = async (req: Request, res: Response) => {
  try {
    const { bankDetailsId } = req.params;
    const { verificationNotes } = req.body;

    if (!bankDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Bank details ID is required",
      });
    }

    // Get admin user ID from auth middleware
    const verifiedBy = (req as any).user?.id || "system";

    const result = await bankDetailsService.verifyBankDetails(
      bankDetailsId,
      verifiedBy,
      verificationNotes
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in verifyBankDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify bank details",
    });
  }
};

/**
 * Reject bank account details
 */
export const rejectBankDetails = async (req: Request, res: Response) => {
  try {
    const { bankDetailsId } = req.params;
    const { verificationNotes } = req.body;

    if (!bankDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Bank details ID is required",
      });
    }

    if (!verificationNotes) {
      return res.status(400).json({
        success: false,
        message: "Verification notes are required for rejection",
      });
    }

    // Get admin user ID from auth middleware
    const verifiedBy = (req as any).user?.id || "system";

    const result = await bankDetailsService.rejectBankDetails(
      bankDetailsId,
      verifiedBy,
      verificationNotes
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error in rejectBankDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject bank details",
    });
  }
};
