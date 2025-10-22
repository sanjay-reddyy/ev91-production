import express, { Request, Response } from "express";
import {
  startRegistration,
  verifyOTP,
  resendOTP,
  getRegistrationStatus,
  saveProfile,
  getProfile,
  saveEmergencyContact,
  getKycStatus,
  startRegistrationValidation,
  verifyOTPValidation,
  saveProfileValidation,
  saveEmergencyContactValidation,
} from "../controllers/riderRegistrationController";
import { KycController } from "../controllers/kycController";
import { registrationCompletionService } from "../services/registrationCompletionService";

const router = express.Router();
const kycController = new KycController();

/**
 * Comprehensive Rider Registration Routes
 * Handles phone verification, profile management, and complete registration flow
 */

// ==========================================
// PHONE VERIFICATION ENDPOINTS
// ==========================================

// Start registration by sending OTP via Twilio
router.post("/start", startRegistrationValidation, startRegistration);

// Verify OTP sent via Twilio
router.post("/verify-otp", verifyOTPValidation, verifyOTP);

// Resend OTP via Twilio
router.post("/resend-otp", resendOTP);

// Get registration status by phone
router.get("/status/:phone", getRegistrationStatus);

// ==========================================
// PROFILE MANAGEMENT ENDPOINTS
// ==========================================

// Save rider profile and emergency contact details
router.post("/profile/:riderId", saveProfileValidation, saveProfile);

// Get rider profile information
router.get("/profile/:riderId", getProfile);

// ==========================================
// EMERGENCY CONTACT ENDPOINTS
// ==========================================

// Save emergency contact details
router.post(
  "/emergency-contact/:riderId",
  saveEmergencyContactValidation,
  saveEmergencyContact
);

// ==========================================
// KYC MANAGEMENT ENDPOINTS
// ==========================================

// Get KYC status for a rider
router.get("/kyc-status/:riderId", getKycStatus);

// Upload KYC documents (multipart/form-data with proper S3 storage)
router.post(
  "/kyc/document/:riderId/:documentType",
  kycController.uploadMiddleware,
  kycController.uploadDocument.bind(kycController)
);

// Submit KYC for review
router.post("/kyc/submit/:riderId", (req: Request, res: Response) => {
  // Simple endpoint to mark KYC as submitted for review
  res.json({
    success: true,
    message: "KYC submitted for review",
    status: "under_review",
  });
});

// ==========================================
// KYC VERIFICATION & MANAGEMENT (Admin/Dashboard)
// ==========================================

// Get all pending KYC submissions for manual review
router.get(
  "/admin/kyc/pending",
  kycController.getPendingKycSubmissions.bind(kycController)
);

// Get KYC documents for a specific rider (for manual review)
router.get(
  "/admin/kyc/:riderId/documents",
  kycController.getKycDocuments.bind(kycController)
);

// Verify/Reject KYC documents (manual verification by admin)
router.post(
  "/admin/kyc/:riderId/verify",
  kycController.verifyKycDocuments.bind(kycController)
);

// Auto-verify using external KYC service (Digilocker integration)
router.post(
  "/admin/kyc/:riderId/auto-verify",
  kycController.autoVerifyKyc.bind(kycController)
);

// ==========================================
// REGISTRATION STATUS & COMPLETION ENDPOINTS
// ==========================================

/**
 * Get detailed registration status with step-by-step progress
 * Returns comprehensive breakdown of all registration requirements
 */
router.get(
  "/registration-status/:riderId",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const status = await registrationCompletionService.getDetailedStatus(
        riderId
      );

      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Get registration status error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
);

/**
 * Manually trigger registration completion check
 * Useful for edge cases or retrying after errors
 */
router.post(
  "/complete-registration/:riderId",
  async (req: Request, res: Response) => {
    try {
      const { riderId } = req.params;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          error: "Rider ID is required",
        });
      }

      const result =
        await registrationCompletionService.tryCompleteRegistration(riderId);

      if (result.completed) {
        return res.status(200).json({
          success: true,
          data: result,
          message: result.message,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.message,
          data: {
            missing: result.missing,
          },
        });
      }
    } catch (error) {
      console.error("Complete registration error:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
);

export { router as riderRegistrationRouter };
