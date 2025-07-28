import { body, param, query } from 'express-validator';

/**
 * Validation schemas for rider registration endpoints
 */

export const validateStartRegistration = [
  body('phone')
    .matches(/^\+91[1-9]\d{9}$/)
    .withMessage('Phone must be a valid Indian mobile number starting with +91'),
  body('consent')
    .isBoolean()
    .withMessage('Consent must be a boolean value'),
];

export const validateVerifyOtp = [
  body('phone')
    .matches(/^\+91[1-9]\d{9}$/)
    .withMessage('Phone must be a valid Indian mobile number starting with +91'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
];

export const validateRiderProfile = [
  param('riderId')
    .isUUID()
    .withMessage('Rider ID must be a valid UUID'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must be 2-100 characters and contain only letters'),
  body('dob')
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage('Date of birth must be in DD/MM/YYYY format'),
  body('address1')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be 5-200 characters'),
  body('address2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be max 200 characters'),
  body('city')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City must be 2-50 characters and contain only letters'),
  body('state')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State must be 2-50 characters and contain only letters'),
  body('pincode')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be a 6-digit number'),
  body('emergencyName')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Emergency contact name must be 2-100 characters and contain only letters'),
  body('emergencyPhone')
    .matches(/^\d{10}$/)
    .withMessage('Emergency phone must be a 10-digit number'),
  body('emergencyRelation')
    .isIn(['Parent', 'Spouse', 'Sibling', 'Friend', 'Relative', 'Other'])
    .withMessage('Emergency relation must be one of: Parent, Spouse, Sibling, Friend, Relative, Other'),
];

export const validateKycDocument = [
  param('riderId')
    .isUUID()
    .withMessage('Rider ID must be a valid UUID'),
  param('documentType')
    .isIn(['aadhaar', 'pan', 'dl', 'selfie', 'rc'])
    .withMessage('Document type must be one of: aadhaar, pan, dl, selfie, rc'),
];

export const validateRiderId = [
  param('riderId')
    .isUUID()
    .withMessage('Rider ID must be a valid UUID'),
];

export const validateEsign = [
  body('riderId')
    .isUUID()
    .withMessage('Rider ID must be a valid UUID'),
  body('agreementData')
    .isObject()
    .withMessage('Agreement data must be an object'),
];
