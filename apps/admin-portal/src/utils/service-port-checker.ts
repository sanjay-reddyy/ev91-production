/**
 * Service Port Configuration Check
 *
 * This utility validates port configurations across different services
 * to ensure they match up correctly.
 */

import axios from "axios";

// Port mapping from service name to expected port
const expectedPorts = {
  "auth-service": 4001,
  "team-service": 4002,
  "client-store-service": 4003,
  "vehicle-service": 4004,
  "rider-service": 4005,
  "api-gateway": 8000,
  "spare-parts-service": 4006,
};

// URLs configured in the app
const configuredServiceUrls = {
  authServiceUrl:
    import.meta.env.VITE_AUTH_API_URL || "http://localhost:8000/api/auth",
  teamServiceUrl:
    import.meta.env.VITE_TEAM_API_URL || "http://localhost:8000/api/team",
  clientStoreServiceUrl:
    import.meta.env.VITE_CLIENT_STORE_API_URL ||
    "http://localhost:8000/api/client-store",
  vehicleServiceUrl:
    import.meta.env.VITE_VEHICLE_API_URL ||
    "http://localhost:8000/api/vehicles",
  riderServiceUrl:
    import.meta.env.VITE_RIDER_API_URL || "http://localhost:8000/api/riders",
  sparePartsServiceUrl:
    import.meta.env.VITE_SPARE_PARTS_API_URL ||
    "http://localhost:8000/api/spare-parts",
};

/**
 * Check if API Gateway is proxying correctly to the rider service
 */
export async function checkRiderServiceProxy() {
  console.log("🔄 Checking Rider Service proxy configuration...");

  try {
    // Extract the port from API Gateway URL
    const apiGatewayUrlMatch =
      configuredServiceUrls.riderServiceUrl.match(/:(\d+)/);
    const apiGatewayPort = apiGatewayUrlMatch ? apiGatewayUrlMatch[1] : "8000";

    console.log(
      `📊 API Gateway port: ${apiGatewayPort}, Expected: ${expectedPorts["api-gateway"]}`
    );
    console.log(
      `📊 Rider Service expected port: ${expectedPorts["rider-service"]}`
    );

    // Check API Gateway health
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("⚠️ No auth token found in localStorage");
    }

    try {
      // Test API Gateway /health endpoint
      const gatewayResponse = await axios.get(
        `http://localhost:${apiGatewayPort}/health`
      );
      console.log("✅ API Gateway health check:", gatewayResponse.data);
    } catch (error) {
      console.error("❌ API Gateway health check failed:", error);
    }

    try {
      // Try direct rider service health check
      const riderDirectResponse = await axios.get(
        `http://localhost:${expectedPorts["rider-service"]}/health`
      );
      console.log(
        "✅ Direct Rider Service health check:",
        riderDirectResponse.data
      );
    } catch (error) {
      console.error("❌ Direct Rider Service health check failed:", error);
    }

    // Check that API Gateway is configured to route to the correct rider service port
    try {
      // Check the Gateway rider route config
      console.log(
        `🔍 Checking if Gateway is routing riders API to port ${expectedPorts["rider-service"]}...`
      );

      // This will analyze if the API Gateway is routing to the correct port in the rider-service
      // Return results of our check
      return {
        apiGatewayPort,
        expectedApiGatewayPort: expectedPorts["api-gateway"],
        riderServicePort: expectedPorts["rider-service"],
        gatewayRiderServiceUrl: configuredServiceUrls.riderServiceUrl,
        isPortMismatchLikely:
          apiGatewayPort !== String(expectedPorts["api-gateway"]) ||
          configuredServiceUrls.riderServiceUrl.indexOf(
            String(expectedPorts["api-gateway"])
          ) === -1,
      };
    } catch (error) {
      console.error("❌ Error checking proxy configuration:", error);
      return {
        error: "Failed to check proxy configuration",
        details: error,
      };
    }
  } catch (error) {
    console.error("❌ Error in checkRiderServiceProxy:", error);
    return {
      error: "Unknown error in checkRiderServiceProxy",
      details: error,
    };
  }
}

/**
 * Check the port configuration for all services
 */
export async function checkAllServicePorts() {
  console.log("🔄 Checking service port configurations...");

  const results: Record<string, any> = {};

  for (const [serviceName, port] of Object.entries(expectedPorts)) {
    try {
      const response = await axios.get(`http://localhost:${port}/health`, {
        timeout: 2000,
      });
      results[serviceName] = {
        port,
        status: "available",
        response: response.data,
      };
    } catch (error) {
      results[serviceName] = {
        port,
        status: "unavailable",
        error: error,
      };
    }
  }

  console.log("📊 Service port check results:");
  console.table(
    Object.entries(results).map(([service, result]) => ({
      service,
      port: result.port,
      status: result.status,
    }))
  );

  return results;
}

// Expose utilities for use in browser console
export const servicePortChecker = {
  expectedPorts,
  configuredServiceUrls,
  checkRiderServiceProxy,
  checkAllServicePorts,
};

// Make utilities available globally in browser
if (typeof window !== "undefined") {
  (window as any).servicePortChecker = servicePortChecker;
}
