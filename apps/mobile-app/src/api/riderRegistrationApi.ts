// Rider Registration API Service for React Native (Expo) + React Query
// Updated to use unified rider-register endpoints with Twilio OTP
// Professional SMS solution with complete registration flow

import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import apiClient from './client';

// --- Types ---
export interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    riderId?: string;
    tempId?: string;
    expiresIn?: number;
    isNewUser?: boolean;
  };
}

export interface StartRegistrationRequest {
  phone: string;
  consent: boolean;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  tempId: string;
}

export interface RiderProfileData {
  name: string;
  dob: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

export interface EmergencyContactData {
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

export interface KycStatusResponse {
  success: boolean;
  status: string;
  aadhaar: boolean;
  pan: boolean;
  dl: boolean;
  selfie: boolean;
}

export interface KycDocumentUploadResponse {
  success: boolean;
  documentType: string;
  url: string;
  message: string;
}

export interface EsignResponse {
  success: boolean;
  message: string;
  providerResult: any;
}

// --- API Functions ---

/**
 * Start registration and send OTP via unified rider registration endpoint
 */
export function useStartRegistration() {
  return useMutation({
    mutationFn: async (data: StartRegistrationRequest) => {
      const response = await apiClient.post('/api/v1/rider-register/start', data);
      return response.data as RegistrationResponse;
    }
  });
}

/**
 * Verify OTP sent via unified rider registration
 */
export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await apiClient.post('/api/v1/rider-register/verify-otp', data);
      return response.data as RegistrationResponse;
    }
  });
}

/**
 * Resend OTP via unified rider registration
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: async ({ tempId }: { tempId: string }) => {
      const response = await apiClient.post('/api/v1/rider-register/resend-otp', { tempId });
      return response.data as RegistrationResponse;
    }
  });
}

/**
 * Convert DD/MM/YYYY to ISO8601 YYYY-MM-DD format
 */
function convertDateToISO(dateStr: string): string {
  if (!dateStr) return dateStr;
  
  // Check if already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert DD/MM/YYYY to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
}

/**
 * Parse validation errors from API response
 */
function parseValidationError(error: any): string {
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    const validationErrors = error.response.data.details
      .map((detail: any) => detail.msg || detail.message)
      .filter(Boolean)
      .join(', ');
    
    if (validationErrors) {
      return `Validation error: ${validationErrors}`;
    }
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  return error.message || 'An unexpected error occurred';
}

/**
 * Save rider profile
 */
export function useSaveProfile() {
  return useMutation({
    mutationFn: async ({ riderId, ...profileData }: RiderProfileData & { riderId: string }) => {
      try {
        // Convert DOB format before sending
        const convertedData = {
          ...profileData,
          dob: convertDateToISO(profileData.dob)
        };
        
        const response = await apiClient.post(`/api/v1/rider-register/profile/${riderId}`, convertedData);
        return response.data as RegistrationResponse;
      } catch (error) {
        // Enhanced error handling for better user experience
        const errorMessage = parseValidationError(error);
        throw new Error(errorMessage);
      }
    }
  });
}

/**
 * Save emergency contact details
 */
export function useSaveEmergencyContact() {
  return useMutation({
    mutationFn: async ({ riderId, ...emergencyData }: EmergencyContactData & { riderId: string }) => {
      try {
        const response = await apiClient.post(`/api/v1/rider-register/emergency-contact/${riderId}`, emergencyData);
        return response.data as RegistrationResponse;
      } catch (error) {
        // Enhanced error handling for better user experience
        const errorMessage = parseValidationError(error);
        throw new Error(errorMessage);
      }
    }
  });
}

/**
 * Get rider profile
 */
export function useGetProfile(riderId: string, enabled = true) {
  return useQuery({
    queryKey: ['riderProfile', riderId],
    queryFn: async () => {
      if (!riderId) {
        throw new Error('Rider ID is required');
      }
      
      try {
        const response = await apiClient.get(`/api/v1/rider-register/profile/${riderId}`);
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch profile');
        }
        
        return response.data.data.rider;
      } catch (error: any) {
        // If profile doesn't exist yet (404), return null instead of throwing
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && !!riderId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors (profile not found)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Upload KYC document
 */
export function useUploadKycDocument() {
  return useMutation({
    mutationFn: async ({ 
      riderId, 
      documentType, 
      file 
    }: { 
      riderId: string; 
      documentType: string; 
      file: any; // Accept React Native file object
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(
        `/api/v1/rider-register/kyc/document/${riderId}/${documentType}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data as KycDocumentUploadResponse;
    }
  });
}

/**
 * Get KYC status
 */
export function useKycStatus(riderId: string, enabled = true) {
  return useQuery({
    queryKey: ['kycStatus', riderId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/rider-register/kyc-status/${riderId}`);
      return response.data as KycStatusResponse;
    },
    enabled,
    refetchInterval: 5000, // Poll every 5 seconds when in view
  });
}

/**
 * Submit KYC for verification
 */
export function useSubmitKyc() {
  return useMutation({
    mutationFn: async ({ riderId }: { riderId: string }) => {
      const response = await apiClient.post(`/api/v1/rider-register/kyc/submit/${riderId}`);
      return response.data;
    }
  });
}

/**
 * E-sign rental agreement
 */
export function useEsignAgreement() {
  return useMutation({
    mutationFn: async ({ riderId, agreementData }: { riderId: string, agreementData: any }) => {
      const response = await apiClient.post('/api/v1/register/esign', { riderId, agreementData });
      return response.data as EsignResponse;
    }
  });
}
