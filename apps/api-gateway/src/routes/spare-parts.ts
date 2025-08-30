import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const SPARE_PARTS_SERVICE_URL =
  process.env.SPARE_PARTS_SERVICE_URL || "http://localhost:4006";

// Proxy all spare parts requests to spare parts service
router.all("/*", async (req: Request, res: Response) => {
  try {
    // Special handling for health endpoint
    let targetPath: string;
    if (req.path === "/health" || req.path === "/spare-parts/health") {
      targetPath = "/health";
    } else {
      let cleanPath = req.path;

      // Handle duplicate /spare-parts in path (e.g., /spare-parts/spare-parts -> /spare-parts)
      if (cleanPath.startsWith("/spare-parts/")) {
        cleanPath = cleanPath.substring(12); // Remove the duplicate '/spare-parts'
      }

      // Determine the correct target path based on the cleaned path
      if (cleanPath === "" || cleanPath === "/") {
        // /api/spare-parts -> /api/v1/spare-parts
        targetPath = `/api/v1/spare-parts`;
      } else if (cleanPath.startsWith("/inventory")) {
        // /api/spare-parts/inventory -> /api/v1/inventory
        targetPath = `/api/v1${cleanPath}`;
      } else if (cleanPath.startsWith("/suppliers")) {
        // /api/spare-parts/suppliers -> /api/v1/suppliers
        targetPath = `/api/v1${cleanPath}`;
      } else if (cleanPath.startsWith("/purchase-orders")) {
        // /api/spare-parts/purchase-orders -> /api/v1/purchase-orders
        targetPath = `/api/v1${cleanPath}`;
      } else if (cleanPath.startsWith("/analytics")) {
        // /api/spare-parts/analytics -> /api/v1/analytics
        targetPath = `/api/v1${cleanPath}`;
      } else if (cleanPath.startsWith("/dashboard")) {
        // /api/spare-parts/dashboard -> /api/v1/dashboard
        targetPath = `/api/v1${cleanPath}`;
      } else {
        // Default: assume it's a spare-parts-specific endpoint
        // /api/spare-parts/123 -> /api/v1/spare-parts/123
        targetPath = `/api/v1/spare-parts${cleanPath}`;
      }
    }

    const targetUrl = `${SPARE_PARTS_SERVICE_URL}${targetPath}`;

    console.log(
      `[Spare Parts Gateway] ${req.method} ${req.originalUrl} -> ${targetUrl}`
    );

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      params: req.query,
      timeout: 30000, // 30 second timeout for potentially long operations
    });

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
    console.error(`[Spare Parts Gateway] Error: ${error.message}`);
    console.error(
      `[Spare Parts Gateway] Target URL: ${req.method} ${req.originalUrl}`
    );

    if (error.response) {
      console.error(
        `[Spare Parts Gateway] Service responded with ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === "ECONNREFUSED") {
      res.status(503).json({
        success: false,
        message: "Spare Parts service is currently unavailable",
        error: "Service connection refused",
        service: "spare-parts-service",
      });
    } else if (error.code === "ETIMEDOUT") {
      res.status(504).json({
        success: false,
        message: "Spare Parts service request timeout",
        error: "Request timed out",
        service: "spare-parts-service",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Spare Parts service unavailable",
        error: error.message,
        service: "spare-parts-service",
      });
    }
  }
});

export default router;
