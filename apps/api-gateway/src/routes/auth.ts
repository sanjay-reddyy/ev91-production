import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4001";

// Proxy all auth requests to auth service
router.all("/*", async (req: Request, res: Response) => {
  try {
    // Special handling for health endpoint
    let targetPath: string;
    if (req.path === "/health") {
      targetPath = "/health";
    } else if (req.originalUrl.startsWith("/api/users")) {
      // Map /api/users to /api/v1/users
      targetPath = `/api/v1/users${req.path === "/" ? "" : req.path}`;
    } else if (req.originalUrl.startsWith("/api/employees")) {
      // Map /api/employees to auth service employees endpoints at /api/v1/employees
      targetPath = `/api/v1/employees${req.path === "/" ? "" : req.path}`;
    } else if (req.originalUrl.startsWith("/api/roles")) {
      // Map /api/roles to /api/v1/roles
      targetPath = `/api/v1/roles${req.path === "/" ? "" : req.path}`;
    } else if (req.originalUrl.startsWith("/api/permissions")) {
      // Map /api/permissions to /api/v1/permissions
      targetPath = `/api/v1/permissions${req.path === "/" ? "" : req.path}`;
    } else if (req.originalUrl.startsWith("/api/teams")) {
      // Map /api/teams to /api/v1/teams
      targetPath = `/api/v1/teams${req.path === "/" ? "" : req.path}`;
    } else if (req.originalUrl.startsWith("/api/departments")) {
      // Map /api/departments to /api/v1/departments
      targetPath = `/api/v1/departments${req.path === "/" ? "" : req.path}`;
    } else {
      // Default auth endpoints like /api/auth/login -> /api/v1/auth/login
      targetPath = `/api/v1/auth${req.path}`;
    }

    const targetUrl = `${AUTH_SERVICE_URL}${targetPath}`;

    console.log(`Auth proxy: ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
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
