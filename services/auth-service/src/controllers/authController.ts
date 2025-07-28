import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { 
  LoginCredentials, 
  RegisterUserData,
  ApiResponse 
} from '../types/auth';

export class AuthController {
  /**
   * Register a new user
   */
  static registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('any'),
    body('roleIds').optional().isArray(),
  ];

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : undefined,
            message: err.msg
          })),
        } as ApiResponse);
        return;
      }

      const userData: RegisterUserData = req.body;
      const createdBy = req.user?.id; // Will be available if authenticated

      const user = await AuthService.register(userData, createdBy);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  }

  /**
   * Login user
   */
  static loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : undefined,
            message: err.msg
          })),
        } as ApiResponse);
        return;
      }

      const credentials: LoginCredentials = req.body;
      const result = await AuthService.login(credentials);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  }

  /**
   * Refresh access token
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        } as ApiResponse);
        return;
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const user = await AuthService.getUserWithRoles(userId);

      res.status(200).json({
        success: true,
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  }

  /**
   * Assign roles to user
   */
  static async assignRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleIds } = req.body;
      const assignedBy = req.user?.id;

      if (!userId || !roleIds || !Array.isArray(roleIds)) {
        res.status(400).json({
          success: false,
          error: 'User ID and role IDs are required',
        } as ApiResponse);
        return;
      }

      await AuthService.assignRoles(userId, roleIds, assignedBy);

      res.status(200).json({
        success: true,
        message: 'Roles assigned successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  }
}
