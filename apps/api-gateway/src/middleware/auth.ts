import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth for health checks and public routes
    const publicRoutes = [
      "/health",
      "/auth/login",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/spare-parts/health",
      "/api/riders", // Temporarily for testing
    ];

    // Check if the request path starts with any public route
    const isPublicRoute = publicRoutes.some((route) => {
      return req.path.startsWith(route) || req.originalUrl.includes(route);
    });

    if (isPublicRoute) {
      console.log(`🔓 Public route accessed: ${req.path}`);
      return next();
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      console.log(`🚫 No token provided for: ${req.path}`);
      // Set CORS headers before returning error
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,PATCH,OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-API-Key,X-Request-Id"
      );
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const JWT_SECRET =
      process.env.JWT_SECRET ||
      "super-secret-jwt-key-for-ev91-auth-service-change-in-production";

    console.log(`🔑 Using JWT_SECRET: ${JWT_SECRET.substring(0, 20)}...`);
    console.log(`🎫 Token to verify: ${token.substring(0, 20)}...`);

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Add user info to headers for downstream services
    req.headers["x-user-id"] = (decoded as any).id;
    req.headers["x-user-email"] = (decoded as any).email;

    console.log(
      `✅ Authenticated request: ${req.path} by ${(decoded as any).email}`
    );
    next();
  } catch (error) {
    console.error("Gateway auth middleware error:", error);
    // Set CORS headers before returning error
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-API-Key,X-Request-Id"
    );
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
