import { Request, Response, NextFunction } from "express";
import { JwtService } from "../utils/jwt";
import { AuthService } from "../services/authService";

export class RBACMiddleware {
  /**
   * Authentication middleware - trusts API Gateway authentication
   * The API Gateway has already verified the JWT and added user headers
   */
  static async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if we have user headers from API Gateway
      const userId = req.headers["x-user-id"] as string;
      const userEmail = req.headers["x-user-email"] as string;

      if (userId && userEmail) {
        // Trust the API Gateway authentication
        req.user = {
          id: userId,
          email: userEmail,
          firstName: "API",
          lastName: "User",
          isActive: true,
          roles: [
            {
              id: "api-gateway-role",
              name: "API Gateway User",
              permissions: [],
            },
          ],
        };
        return next();
      }

      // Fallback to JWT verification for direct calls (development only)
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Access token required",
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = JwtService.verifyAccessToken(token);

      // Fetch basic user data for team operations
      const user = await AuthService.getUserWithRoles(payload.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "User not found or inactive",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  }

  /**
   * Simple authentication check
   * For complex authorization, delegate to the auth service
   */
  static requireAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }
      next();
    };
  }
}
