/**
 * Standardized constants for status values used throughout the Rider Service
 * This helps maintain consistency across different files and endpoints
 */

// KYC Status Values
export const KYC_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  UNDER_REVIEW: "under_review",
};

// Registration Status Values
export const REGISTRATION_STATUS = {
  PENDING: "PENDING",
  PHONE_VERIFIED: "PHONE_VERIFIED",
  KYC_COMPLETED: "KYC_COMPLETED",
  COMPLETED: "COMPLETED",
};

// Vehicle Assignment Status
export const VEHICLE_ASSIGNMENT_STATUS = {
  ACTIVE: "ACTIVE",
  RETURNED: "RETURNED",
};
