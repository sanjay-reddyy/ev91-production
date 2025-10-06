/**
 * New service methods to support the updated rider activation and registration flow
 * These methods handle the decoupled registration status and active status
 */

// Add this to the RiderService class in riderService.ts

/**
 * Complete rider registration and verify KYC in one step
 */
async completeRiderRegistration(
  riderId: string,
  options: {
    kycVerified?: boolean;
    activateRider?: boolean;
  } = {}
): Promise<APIResponse<Rider>> {
  const response = await api.patch(`/registration/riders/${riderId}/complete-registration`, options);
  return response.data;
}

/**
 * Approve rider registration with option to activate
 */
async approveRiderWithActivation(
  riderId: string,
  activateImmediately: boolean = true
): Promise<APIResponse<Rider>> {
  const response = await api.patch(`/riders/${riderId}/approve`, {
    activateImmediately
  });
  return response.data;
}

/**
 * Get rider registration status details
 * This returns additional information about the registration progress
 */
async getRiderRegistrationStatus(
  riderId: string
): Promise<APIResponse<{
  registrationStatus: string;
  isActive: boolean;
  kycStatus: string;
  missingFields: string[];
  completionPercentage: number;
}>> {
  const response = await api.get(`/registration/riders/${riderId}/status`);
  return response.data;
}
