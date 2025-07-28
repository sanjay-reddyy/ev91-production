/**
 * Data Transfer Objects for API requests and responses
 */

// Registration DTOs
export interface StartRegistrationRequest {
  phone: string;
  consent: boolean;
}

export interface StartRegistrationResponse {
  success: boolean;
  riderId: string;
  message: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  riderId: string;
  message: string;
}

// Profile DTOs
export interface SaveProfileRequest {
  name: string;
  dob: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

export interface SaveProfileResponse {
  success: boolean;
  riderId: string;
  message: string;
}

export interface GetProfileResponse {
  success: boolean;
  rider: {
    id: string;
    phone: string;
    name: string;
    dob: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
    kycStatus: string;
    agreementSigned: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

// KYC DTOs
export interface UploadKycDocumentResponse {
  success: boolean;
  documentType: string;
  url: string;
  message: string;
}

export interface KycStatusResponse {
  success: boolean;
  status: string;
  aadhaar: boolean;
  pan: boolean;
  dl: boolean;
  selfie: boolean;
  rc?: boolean;
}

export interface SubmitKycResponse {
  success: boolean;
  message: string;
  kycStatus: string;
}

// E-sign DTOs
export interface EsignRequest {
  riderId: string;
  agreementData: {
    terms: string;
    duration: number;
    amount: number;
    vehicleType: string;
  };
}

export interface EsignResponse {
  success: boolean;
  riderId: string;
  message: string;
  providerResult: any;
}

// Generic DTOs
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: Date;
  uptime: number;
  checks: {
    database: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
    external_services: {
      twilio: 'connected' | 'disconnected';
      s3: 'connected' | 'disconnected';
      kyc_provider: 'connected' | 'disconnected';
    };
  };
}
