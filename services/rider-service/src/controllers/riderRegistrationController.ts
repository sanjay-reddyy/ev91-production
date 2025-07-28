import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RegistrationService } from '../services/registrationService';
import { KycService, KycDocumentType } from '../services/kycService';
import { twilioService } from '../utils/twilio';
import { prisma } from '../config/database';

const registrationService = new RegistrationService();
const kycService = new KycService();

/**
 * Comprehensive Rider Registration Controller
 * Handles phone verification, profile management, and registration flow
 */

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

/**
 * Validation middleware for start registration
 */
export const startRegistrationValidation = [
  body('phone')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('consent')
    .isBoolean()
    .withMessage('Consent must be a boolean value')
];

/**
 * Validation middleware for OTP verification
 */
export const verifyOTPValidation = [
  body('tempId')
    .notEmpty()
    .withMessage('Temporary ID is required'),
  body('otp')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 4-6 digits')
];

/**
 * Validation middleware for profile data
 */
export const saveProfileValidation = [
  body('name')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name is required and must be 2-100 characters'),
  body('dob')
    .custom((value) => {
      if (!value) return false;
      
      // Accept ISO8601 format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === value;
      }
      
      // Accept DD/MM/YYYY format and validate
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map((num: string) => parseInt(num, 10));
        
        // Basic range checks
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        if (year < 1900 || year > new Date().getFullYear()) return false;
        
        // Create date and validate it's real
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && 
               date.getMonth() === month - 1 && 
               date.getDate() === day;
      }
      
      return false;
    })
    .withMessage('Date of birth must be a valid date in DD/MM/YYYY or YYYY-MM-DD format'),
  body('address1')
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Address line 1 is required'),
  body('city')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('City is required'),
  body('state')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('State is required'),
  body('pincode')
    .isLength({ min: 5, max: 10 })
    .withMessage('Valid pincode is required'),
  // Emergency contact fields are now optional
  body('emergencyName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Emergency contact name must be less than 100 characters'),
  body('emergencyPhone')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true; // Allow empty values
      
      // Clean the phone number (remove spaces, dashes, parentheses)
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      
      // Basic phone number validation (8-15 digits, may start with +)
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      return phoneRegex.test(cleanPhone);
    })
    .withMessage('Valid emergency contact phone is required'),
  body('emergencyRelation')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Emergency contact relation must be less than 50 characters')
];

/**
 * Validation middleware for emergency contact data
 */
export const saveEmergencyContactValidation = [
  body('emergencyName')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name is required'),
  body('emergencyPhone')
    .notEmpty()
    .withMessage('Emergency contact phone is required')
    .custom((value) => {
      if (!value || value.trim() === '') return false; // Required field, cannot be empty
      
      // Clean the phone number (remove spaces, dashes, parentheses)
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      
      // Basic phone number validation (8-15 digits, may start with +)
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      return phoneRegex.test(cleanPhone);
    })
    .withMessage('Valid emergency contact phone is required'),
  body('emergencyRelation')
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('Emergency contact relation is required')
];

// ==========================================
// PHONE VERIFICATION FLOW
// ==========================================

/**
 * Start registration by sending OTP via Twilio
 */
export const startRegistration = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { phone, consent } = req.body;
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Send OTP via Twilio
    const smsResult = await twilioService.sendOTP(phone, otp);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to send OTP: ${smsResult.message}`
      });
    }
    
    // Store OTP verification record
    await prisma.otpVerification.create({
      data: {
        phone,
        otp,
        tempId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        verified: false,
        attempts: 0
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        tempId,
        expiresIn: 600 // 10 minutes in seconds
      },
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Start registration error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * Verify OTP sent via Twilio
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tempId, otp } = req.body;
    
    // Find OTP verification record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { tempId }
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP request'
      });
    }
    
    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP already verified'
      });
    }
    
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }
    
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { tempId },
        data: { attempts: otpRecord.attempts + 1 }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
    
    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { tempId },
      data: { verified: true }
    });
    
    // Verify phone and update rider record
    const result = await registrationService.verifyPhone(otpRecord.phone);
    
    return res.status(200).json({
      success: true,
      data: {
        riderId: result.riderId,
        isNewUser: result.phoneVerified ? false : true
      },
      message: result.message
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * Resend OTP via Twilio
 */
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { tempId } = req.body;
    
    if (!tempId) {
      return res.status(400).json({
        success: false,
        error: 'Temporary ID is required'
      });
    }
    
    // Find existing OTP record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { tempId }
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session'
      });
    }
    
    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP already verified'
      });
    }
    
    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send new OTP
    const smsResult = await twilioService.sendOTP(otpRecord.phone, newOtp);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to send OTP: ${smsResult.message}`
      });
    }
    
    // Update OTP record
    await prisma.otpVerification.update({
      where: { tempId },
      data: {
        otp: newOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'New OTP sent successfully'
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * Get registration status for a phone number
 */
export const getRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    // Find rider by phone
    const rider = await prisma.rider.findUnique({
      where: { phone }
    });
    
    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'No registration found for this phone number'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        riderId: rider.id,
        phoneVerified: rider.phoneVerified,
        registrationStatus: rider.registrationStatus,
        profileCompleted: !!(rider.name && rider.dob && rider.address1)
      }
    });
  } catch (error) {
    console.error('Get registration status error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

/**
 * Save rider profile and emergency contact details
 */
export const saveProfile = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { riderId } = req.params;
    const {
      name,
      dob,
      address1,
      address2,
      city,
      state,
      pincode,
      emergencyName,
      emergencyPhone,
      emergencyRelation
    } = req.body;

    // Check if rider exists and phone is verified
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    if (!rider.phoneVerified) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be verified before saving profile'
      });
    }

    // Save profile data
    const result = await registrationService.saveProfile(riderId, {
      name,
      dob,
      address1,
      address2,
      city,
      state,
      pincode,
      emergencyName,
      emergencyPhone,
      emergencyRelation
    });

    return res.status(200).json({
      success: true,
      data: {
        riderId: result.riderId
      },
      message: 'Profile saved successfully'
    });
  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * Get rider profile information
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        rider: {
          id: rider.id,
          phone: rider.phone,
          phoneVerified: rider.phoneVerified,
          registrationStatus: rider.registrationStatus,
          name: rider.name,
          dob: rider.dob,
          address1: rider.address1,
          address2: rider.address2,
          city: rider.city,
          state: rider.state,
          pincode: rider.pincode,
          emergencyName: rider.emergencyName,
          emergencyPhone: rider.emergencyPhone,
          emergencyRelation: rider.emergencyRelation,
          kycStatus: rider.kycStatus,
          agreementSigned: rider.agreementSigned
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// ==========================================
// KYC MANAGEMENT
// ==========================================

/**
 * Get KYC status for a rider
 */
export const getKycStatus = async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    // Check if rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    // Get KYC status using the service
    const kycStatus = await kycService.getKycStatus(riderId);

    return res.status(200).json({
      success: true,
      data: {
        riderId: rider.id,
        kycStatus: rider.kycStatus,
        kycDetails: kycStatus
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * Upload KYC documents
 */
export const uploadKycDocuments = async (req: Request, res: Response) => {
  try {
    const { riderId, documentType } = req.params;
    
    // Check if rider exists and phone is verified
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    if (!rider.phoneVerified) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be verified before uploading KYC documents'
      });
    }

    // For now, return a placeholder response
    // The actual implementation would handle file uploads using multer middleware
    return res.status(200).json({
      success: true,
      data: {
        riderId: riderId,
        availableDocumentTypes: Object.values(KycDocumentType)
      },
      message: 'KYC document upload endpoint ready - use multipart/form-data'
    });
  } catch (error) {
    console.error('Upload KYC documents error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// ==========================================
// EMERGENCY CONTACT MANAGEMENT
// ==========================================

/**
 * Save emergency contact details
 */
export const saveEmergencyContact = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { riderId } = req.params;
    const { emergencyName, emergencyPhone, emergencyRelation } = req.body;

    // Check if rider exists and phone is verified
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }

    if (!rider.phoneVerified) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be verified before saving emergency contact'
      });
    }

    // Save emergency contact data
    const result = await registrationService.saveEmergencyContact(riderId, {
      emergencyName,
      emergencyPhone,
      emergencyRelation
    });

    return res.status(200).json({
      success: true,
      data: {
        riderId: result.riderId
      },
      message: 'Emergency contact saved successfully'
    });
  } catch (error) {
    console.error('Save emergency contact error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};
