import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authMiddleware, requirePermission } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const router = Router();

// Public routes (no authentication required)
router.post(
  "/signup",
  rateLimitMiddleware(5, 15), // 5 requests per 15 minutes
  AuthController.signUpValidation,
  AuthController.signUp
);

router.post(
  "/login",
  rateLimitMiddleware(10, 15), // 10 requests per 15 minutes
  AuthController.loginValidation,
  AuthController.login
);

router.get("/verify-email/:token", AuthController.verifyEmail);

router.post(
  "/forgot-password",
  rateLimitMiddleware(3, 60), // 3 requests per hour
  AuthController.passwordResetRequestValidation,
  AuthController.requestPasswordReset
);

router.post(
  "/reset-password",
  rateLimitMiddleware(5, 60), // 5 requests per hour
  AuthController.passwordResetValidation,
  AuthController.resetPassword
);

router.post(
  "/resend-verification",
  rateLimitMiddleware(3, 60), // 3 requests per hour
  AuthController.resendVerificationValidation,
  AuthController.resendEmailVerification
);

router.post(
  "/refresh-token",
  rateLimitMiddleware(20, 60), // 20 requests per hour
  AuthController.refreshToken
);

// Protected routes (authentication required)
router.get("/profile", authMiddleware, AuthController.getProfile);

router.post("/logout", authMiddleware, AuthController.logout);

// Admin routes (authentication + admin permissions required)
router.post(
  "/register",
  authMiddleware,
  requirePermission("auth", "users", "create"),
  AuthController.registerValidation,
  AuthController.register
);

router.post(
  "/assign-roles",
  authMiddleware,
  requirePermission("auth", "users", "update"),
  AuthController.assignRoleValidation,
  AuthController.assignRoles
);

export default router;
