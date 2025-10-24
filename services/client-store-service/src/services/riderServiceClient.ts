import axios from "axios";

const RIDER_SERVICE_URL =
  process.env.RIDER_SERVICE_URL || "http://localhost:4005";

/**
 * Resolve publicRiderId to internal rider ID
 * @param publicRiderId - The public rider ID (e.g., DEL-25-R000044)
 * @returns Internal rider ID or null if not found
 */
export async function resolvePublicRiderIdToRiderId(
  publicRiderId: string
): Promise<string | null> {
  try {
    console.log(
      `[RiderServiceClient] Resolving publicRiderId: ${publicRiderId}`
    );

    // Use internal endpoint (no auth required for service-to-service)
    const response = await axios.get(
      `${RIDER_SERVICE_URL}/internal/riders/public/${publicRiderId}`,
      {
        timeout: 5000,
      }
    );

    console.log(
      `[RiderServiceClient] Response:`,
      response.data?.success,
      response.data?.data?.id
    );

    if (response.data?.success && response.data?.data?.id) {
      console.log(
        `[RiderServiceClient] Resolved ${publicRiderId} → ${response.data.data.id}`
      );
      return response.data.data.id;
    }

    console.log(
      `[RiderServiceClient] Could not resolve publicRiderId: ${publicRiderId}`
    );
    return null;
  } catch (error: any) {
    console.error(
      `[RiderServiceClient] Error resolving publicRiderId ${publicRiderId}:`,
      error.message
    );
    if (error.response) {
      console.error(
        `[RiderServiceClient] Response status:`,
        error.response.status
      );
      console.error(`[RiderServiceClient] Response data:`, error.response.data);
    }
    return null;
  }
}

/**
 * Get rider details by internal ID
 * @param riderId - Internal rider ID
 * @returns Rider details or null
 */
export async function getRiderById(riderId: string): Promise<any> {
  try {
    console.log(`[RiderServiceClient] Fetching rider by ID: ${riderId}`);

    // Use internal endpoint (no auth required for service-to-service)
    const response = await axios.get(
      `${RIDER_SERVICE_URL}/internal/riders/${riderId}`,
      {
        timeout: 5000,
      }
    );

    if (response.data?.success) {
      console.log(
        `[RiderServiceClient] Found rider: ${response.data.data?.name}`
      );
      return response.data.data;
    }

    console.log(`[RiderServiceClient] Rider not found for ID: ${riderId}`);
    return null;
  } catch (error: any) {
    console.error(
      `[RiderServiceClient] Error fetching rider ${riderId}:`,
      error.message
    );
    return null;
  }
}

/**
 * Validate if publicRiderId exists
 * @param publicRiderId - The public rider ID
 * @returns boolean
 */
export async function validatePublicRiderId(
  publicRiderId: string
): Promise<boolean> {
  const riderId = await resolvePublicRiderIdToRiderId(publicRiderId);
  return riderId !== null;
}
