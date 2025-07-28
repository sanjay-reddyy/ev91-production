/**
 * OTP Generation Utility
 * Generates secure numeric OTP codes
 */

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

/**
 * Generate a numeric OTP with better randomness using crypto
 */
export function generateSecureOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environments
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      array[i] = randomBytes[i];
    }
  }
  
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += (array[i] % 10).toString();
  }
  
  return otp;
}

/**
 * Validate OTP format
 */
export function validateOTP(otp: string, expectedLength: number = 6): boolean {
  if (!otp || typeof otp !== 'string') {
    return false;
  }
  
  // Check if it's numeric and has correct length
  const otpRegex = new RegExp(`^\\d{${expectedLength}}$`);
  return otpRegex.test(otp);
}

/**
 * Generate alphanumeric OTP (for special cases)
 */
export function generateAlphanumericOTP(length: number = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return otp;
}
