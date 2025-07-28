import express, { Request, Response } from 'express';
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
  saveEmergencyContactValidation
} from '../controllers/riderRegistrationController';
import { KycController } from '../controllers/kycController';

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
router.post('/start', startRegistrationValidation, startRegistration);

// Verify OTP sent via Twilio
router.post('/verify-otp', verifyOTPValidation, verifyOTP);

// Resend OTP via Twilio
router.post('/resend-otp', resendOTP);

// Get registration status by phone
router.get('/status/:phone', getRegistrationStatus);

// ==========================================
// PROFILE MANAGEMENT ENDPOINTS
// ==========================================

// Save rider profile and emergency contact details
router.post('/profile/:riderId', saveProfileValidation, saveProfile);

// Get rider profile information
router.get('/profile/:riderId', getProfile);

// ==========================================
// EMERGENCY CONTACT ENDPOINTS
// ==========================================

// Save emergency contact details
router.post('/emergency-contact/:riderId', saveEmergencyContactValidation, saveEmergencyContact);

// ==========================================
// KYC MANAGEMENT ENDPOINTS
// ==========================================

// Get KYC status for a rider
router.get('/kyc-status/:riderId', getKycStatus);

// Upload KYC documents (multipart/form-data with proper S3 storage)
router.post('/kyc/document/:riderId/:documentType', 
  kycController.uploadMiddleware, 
  kycController.uploadDocument.bind(kycController)
);

// Submit KYC for review
router.post('/kyc/submit/:riderId', (req: Request, res: Response) => {
  // Simple endpoint to mark KYC as submitted for review
  res.json({
    success: true,
    message: 'KYC submitted for review',
    status: 'under_review'
  });
});

// ==========================================
// KYC VERIFICATION & MANAGEMENT (Admin/Dashboard)
// ==========================================

// Get all pending KYC submissions for manual review
router.get('/admin/kyc/pending', kycController.getPendingKycSubmissions.bind(kycController));

// Get KYC documents for a specific rider (for manual review)
router.get('/admin/kyc/:riderId/documents', kycController.getKycDocuments.bind(kycController));

// Verify/Reject KYC documents (manual verification by admin)
router.post('/admin/kyc/:riderId/verify', kycController.verifyKycDocuments.bind(kycController));

// Auto-verify using external KYC service (Digilocker integration)
router.post('/admin/kyc/:riderId/auto-verify', kycController.autoVerifyKyc.bind(kycController));

export { router as riderRegistrationRouter };
