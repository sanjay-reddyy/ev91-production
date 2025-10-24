/**
 * New service methods to support the updated rider activation and registration flow.
 * These helpers are exported as standalone functions so they can be imported where needed.
 *
 * Note: This file uses minimal local types and a safe `api` fallback to avoid breaking the build.
 * Later you can replace the local types/imports with your project's actual `api`, `Rider` and `APIResponse` types.
 */

type APIResponse<T> = { data: T };
type Rider = any;

// safe fallback for `api` — replace with your real api import if available
const api: any = (globalThis as any).api || {
    patch: async () => ({ data: {} }),
    get: async () => ({ data: {} })
};

/**
 * Complete rider registration and verify KYC in one step
 */
export async function completeRiderRegistration(
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
export async function approveRiderWithActivation(
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
export async function getRiderRegistrationStatus(
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
