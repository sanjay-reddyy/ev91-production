import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const RIDER_SERVICE_URL =
  process.env.RIDER_SERVICE_URL || "http://localhost:4005";

// Special route for stats (fixing the URL path issue)
router.get("/riders/stats", async (req: Request, res: Response) => {
  try {
    console.log(
      `Proxying rider stats request -> ${RIDER_SERVICE_URL}/api/v1/stats`
    );

    const response = await axios({
      method: "GET",
      url: `${RIDER_SERVICE_URL}/api/v1/stats`,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      timeout: 10000,
    });

    // Transform the response to match what the frontend expects
    if (response.data && response.data.success && response.data.data) {
      const backendData = response.data.data;

      // Map the data to the frontend expected structure
      const transformedData = {
        totalRiders: backendData.totalRiders || 0,
        activeRiders: backendData.activeRiders || 0,
        pendingRegistrations:
          backendData.registrationStatusCounts?.pending || 0,
        pendingKYC: backendData.registrationStatusCounts?.kycPending || 0,
        verifiedRiders: backendData.registrationStatusCounts?.completed || 0,
        totalEarnings: 0, // Not provided by the backend currently
        averageRating: 0, // Not provided by the backend currently
        completionRate: 0, // Not provided by the backend currently
      };

      console.log("Transformed rider stats:", transformedData);

      // Send the transformed data
      res.status(response.status).json({
        ...response.data,
        data: transformedData,
      });
    } else {
      // If there's no valid data, just pass through the original response
      res.status(response.status).json(response.data);
    }
  } catch (error: any) {
    console.error(`Rider stats proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Rider service unavailable",
        error: error.message,
      });
    }
  }
});

// Proxy all rider requests to rider service
router.all("/*", async (req: Request, res: Response) => {
  try {
    // Route admin endpoints directly to the admin routes
    const targetUrl = `${RIDER_SERVICE_URL}/api/v1${req.path}`;

    // Properly forward query parameters
    const queryParams = new URLSearchParams(req.query as any).toString();
    const fullUrl = queryParams ? `${targetUrl}?${queryParams}` : targetUrl;

    console.log(
      `Proxying rider request: ${req.method} ${req.originalUrl} -> ${fullUrl}`
    );

    // Add detailed logging for rider status requests
    if (req.path.includes("/status")) {
      console.log(`Rider status request details:`, {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
      });
    }

    // Log request details for debug purposes
    if (req.path.includes("/status")) {
      console.log("Rider status update request:", {
        method: req.method,
        path: req.path,
        queryParams: req.query,
        body: req.body,
        headers: {
          ...req.headers,
          authorization: req.headers.authorization
            ? "Bearer <token>"
            : undefined,
        },
      });
    }

    // Add cache busting for GET requests
    const headers = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
    };

    // Do not add custom cache control headers to avoid CORS issues
    // We're using URL cache busters instead

    // Process the request body for PATCH requests to rider status
    if (req.method === "PATCH" && req.path.includes("/status")) {
      // Ensure isActive is sent as a proper boolean if it exists
      if (req.body && "isActive" in req.body) {
        const originalIsActive = req.body.isActive;
        // Use strict comparison to ensure true Boolean
        req.body.isActive = originalIsActive === true;

        console.log("Processed status update request:", {
          originalValue: originalIsActive,
          originalType: typeof originalIsActive,
          processedValue: req.body.isActive,
          processedType: typeof req.body.isActive,
        });
      }
    }

    // Set a longer timeout for KYC document uploads
    const isKycUpload = req.path.includes("/kyc") && req.method === "POST";
    const timeout = isKycUpload ? 60000 : 10000; // 60 seconds for KYC uploads, 10 seconds for other requests

    console.log(
      `Request timeout set to ${timeout}ms for ${
        isKycUpload ? "KYC upload" : "standard request"
      }`
    );

    const response = await axios({
      method: req.method as any,
      url: fullUrl,
      data: req.body,
      headers,
      timeout: timeout,
    });

    // Log response details for status updates
    if (req.path.includes("/status")) {
      console.log("Rider status update response:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
    }

    // Forward response headers
    Object.keys(response.headers).forEach((key) => {
      if (
        !["content-encoding", "transfer-encoding", "connection"].includes(key)
      ) {
        res.set(key, response.headers[key]);
      }
    });

    // Do not add custom cache control headers to avoid CORS issues
    // We're using URL cache busters instead

    // Log and process the response for GET requests to a specific rider
    // This is to ensure the isActive field is properly handled
    if (req.method === "GET" && req.path.match(/\/riders\/[^/]+$/)) {
      const rawIsActive = response.data?.data?.isActive;

      console.log("GET specific rider response:", {
        path: req.path,
        isActive: rawIsActive,
        isActiveType: typeof rawIsActive,
        isActiveStringified: JSON.stringify(rawIsActive),
        isActiveToBool: rawIsActive === true,
        responseHeaders: response.headers,
      });

      // Ensure the isActive property is a proper boolean before sending it to the client
      if (response.data?.data) {
        // Force strict boolean conversion
        response.data.data.isActive = rawIsActive === true;

        console.log("Processed rider data:", {
          rawIsActive: rawIsActive,
          processedIsActive: response.data.data.isActive,
          processedIsActiveType: typeof response.data.data.isActive,
          isActiveToString: String(response.data.data.isActive),
          isActiveFinal: response.data.data.isActive ? "TRUE" : "FALSE",
        });
      }
    }

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Rider proxy error: ${error.message}`);
    console.error(`Target URL: ${RIDER_SERVICE_URL}/api/v1${req.path}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Rider service unavailable",
        error: error.message,
      });
    }
  }
});

export default router;
