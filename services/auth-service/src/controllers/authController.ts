import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/authService";
import {
  LoginCredentials,
  RegisterUserData,
  SignUpData,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
  ApiResponse,
} from "../types/auth";

export class AuthController {
  /**
   * Register a new user (admin function)
   */
  static registerValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("phone").optional().isMobilePhone("any"),
    body("roleIds").optional().isArray(),
  ];

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const userData: RegisterUserData = req.body;
      const createdBy = req.user?.id;

      const user = await AuthService.register(userData, createdBy);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      } as ApiResponse);
    }
  }

  /**
   * Sign up new user (self-registration)
   */
  static signUpValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("phone").optional().isMobilePhone("any"),
    body("acceptTerms")
      .equals("true")
      .withMessage("You must accept the terms and conditions"),
  ];

  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const signUpData: SignUpData = req.body;
      const result = await AuthService.signUp(signUpData);

      res.status(201).json({
        success: true,
        message: result.message,
        data: { requiresVerification: result.requiresVerification },
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      } as ApiResponse);
    }
  }

  /**
   * Login user
   */
  static loginValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const credentials: LoginCredentials = req.body;
      const result = await AuthService.login(credentials);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      } as ApiResponse);
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          error: "Verification token is required",
        } as ApiResponse);
        return;
      }

      const result = await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Email verification failed",
      } as ApiResponse);
    }
  }

  /**
   * Request password reset
   */
  static passwordResetRequestValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
  ];

  static async requestPasswordReset(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const resetRequest: PasswordResetRequest = req.body;
      const result = await AuthService.requestPasswordReset(resetRequest);

      res.status(200).json({
        success: true,
        message: result.message,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Password reset request failed",
      } as ApiResponse);
    }
  }

  /**
   * Reset password with token
   */
  static passwordResetValidation = [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  ];

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const resetData: PasswordResetConfirm = req.body;
      const result = await AuthService.resetPassword(resetData);

      res.status(200).json({
        success: true,
        message: result.message,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      } as ApiResponse);
    }
  }

  /**
   * Resend email verification
   */
  static resendVerificationValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
  ];

  static async resendEmailVerification(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const request: EmailVerificationRequest = req.body;
      const result = await AuthService.resendEmailVerification(request);

      res.status(200).json({
        success: true,
        message: result.message,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Resend verification failed",
      } as ApiResponse);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Refresh token is required",
        } as ApiResponse);
        return;
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      } as ApiResponse);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const user = await AuthService.getUserWithRoles(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get profile",
      } as ApiResponse);
    }
  }

  /**
   * Assign roles to user (admin only)
   */
  static assignRoleValidation = [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("roleIds")
      .isArray({ min: 1 })
      .withMessage("At least one role ID is required"),
  ];

  static async assignRoles(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.type === "field" ? err.path : undefined,
            message: err.msg,
          })),
        } as ApiResponse);
        return;
      }

      const { userId, roleIds } = req.body;
      const assignedBy = req.user?.id;

      await AuthService.assignRoles(userId, roleIds, assignedBy);

      res.status(200).json({
        success: true,
        message: "Roles assigned successfully",
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Role assignment failed",
      } as ApiResponse);
    }
  }

  /**
   * Logout user - invalidate token and clear session
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (userId) {
        // Call the logout service to handle token invalidation
        await AuthService.logout(userId);
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Logout failed",
      } as ApiResponse);
    }
  }
}
