import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const VEHICLE_SERVICE_URL =
  process.env.VEHICLE_SERVICE_URL || "http://localhost:4004";

// Proxy all vehicle requests to vehicle service
router.all("/*", async (req: Request, res: Response) => {
  try {
    // Special handling for health endpoint
    let targetPath: string;
    if (req.path === "/health" || req.path === "/vehicles/health") {
      targetPath = "/health";
    } else {
      let cleanPath = req.path;

      // Handle duplicate /vehicles in path (e.g., /vehicles/vehicles/stats -> /vehicles/stats)
      if (cleanPath.startsWith("/vehicles/")) {
        cleanPath = cleanPath.substring(9); // Remove the duplicate '/vehicles'
      }

      // Determine the correct target path based on the cleaned path
      if (cleanPath === "" || cleanPath === "/") {
        // /api/vehicles -> /api/v1/vehicles
        targetPath = `/api/v1/vehicles`;
      } else if (cleanPath === "/vehicles" || cleanPath === "/vehicles/") {
        // /api/vehicles/vehicles -> /api/v1/vehicles (handle duplicate vehicles in path)
        targetPath = `/api/v1/vehicles`;
      } else if (
        cleanPath.startsWith("/stats") ||
        cleanPath.startsWith("/analytics")
      ) {
        // /api/vehicles/stats -> /api/v1/vehicles/stats
        // /api/vehicles/analytics -> /api/v1/vehicles/analytics
        targetPath = `/api/v1/vehicles${cleanPath}`;
      } else if (cleanPath.startsWith("/services")) {
        // /api/vehicles/services/schedule -> /api/v1/service/schedule (note: service not services)
        // /api/vehicles/services/vehicles/123/history -> /api/v1/service/vehicles/123/history
        const servicePath = cleanPath.replace("/services", "/service");
        targetPath = `/api/v1${servicePath}`;
      } else if (
        cleanPath.startsWith("/oems") ||
        cleanPath.startsWith("/vehicle-models") ||
        cleanPath.startsWith("/service") ||
        cleanPath.startsWith("/damage") ||
        cleanPath.startsWith("/handover") ||
        cleanPath.startsWith("/media") ||
        cleanPath.startsWith("/documents") ||
        cleanPath.startsWith("/hubs") ||
        cleanPath.startsWith("/cities")
      ) {
        // /api/vehicles/oems -> /api/v1/oems
        // /api/vehicles/hubs -> /api/v1/hubs
        // /api/vehicles/cities -> /api/v1/cities
        // /api/vehicles/documents -> /api/v1/documents
        targetPath = `/api/v1${cleanPath}`;
      } else {
        // Default: assume it's a vehicle-specific endpoint
        // /api/vehicles/123 -> /api/v1/vehicles/123
        targetPath = `/api/v1/vehicles${cleanPath}`;
      }
    }

    const targetUrl = `${VEHICLE_SERVICE_URL}${targetPath}`;

    // Check if this is a file upload request (multipart/form-data)
    const isFileUpload = req.headers["content-type"]?.includes(
      "multipart/form-data"
    );

    let axiosConfig: any = {
      method: req.method as any,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      timeout: 30000, // Increased timeout for file uploads
    };

    if (isFileUpload) {
      // For file uploads, stream the request data directly
      axiosConfig.data = req;
      axiosConfig.maxContentLength = 50 * 1024 * 1024; // 50MB max
      axiosConfig.maxBodyLength = 50 * 1024 * 1024; // 50MB max
    } else {
      // For regular requests, use req.body
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);

    // Forward response headers
    Object.keys(response.headers).forEach((key) => {
      if (
        !["content-encoding", "transfer-encoding", "connection"].includes(key)
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Vehicle proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Vehicle service unavailable",
        error: error.message,
      });
    }
  }
});

export default router;
