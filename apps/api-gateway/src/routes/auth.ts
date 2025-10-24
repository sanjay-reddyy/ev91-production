import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4001";

// Proxy all auth requests to auth service
router.all("/*", async (req: Request, res: Response) => {
  try {
    const originalPath = req.originalUrl.split("?")[0]; // Path without query string
    let targetPath: string;

    // Define path mappings from gateway to service
    const pathMappings: { [key: string]: string } = {
      "/api/v1/users": "/api/v1/employees",
      "/api/users": "/api/v1/employees",
      "/api/v1/employees": "/api/v1/employees",
      "/api/employees": "/api/v1/employees",
      "/api/v1/roles": "/api/v1/roles",
      "/api/roles": "/api/v1/roles",
      "/api/v1/permissions": "/api/v1/permissions",
      "/api/permissions": "/api/v1/permissions",
      "/api/v1/teams": "/api/v1/teams",
      "/api/teams": "/api/v1/teams",
      "/api/v1/departments": "/api/v1/departments",
      "/api/departments": "/api/v1/departments",
      "/api/v1/auth": "/api/v1/auth",
      "/api/internal": "/internal",
      "/api/auth": "/api/v1/auth", // Handles /api/auth/login etc.
    };

    let mapped = false;
    for (const prefix in pathMappings) {
      if (originalPath.startsWith(prefix)) {
        const restOfPath = originalPath.substring(prefix.length);
        targetPath = `${pathMappings[prefix]}${restOfPath}`;
        mapped = true;
        break;
      }
    }

    // Special handling for health endpoint
    if (originalPath.endsWith("/health")) {
      targetPath = "/health";
      mapped = true;
    }

    if (!mapped) {
      // Fallback for any unmapped routes, preserving the original logic's intent.
      targetPath = `/api/v1/auth${req.path}`;
    }

    const targetUrl = `${AUTH_SERVICE_URL}${targetPath!}`;

    console.log(`Auth proxy: ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      params: req.query,
      timeout: 10000,
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
    console.error(`Auth proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Auth service unavailable",
        error: error.message,
      });
    }
  }
});

export default router;
