import crypto from "crypto";
import { prisma } from "../config/database";
import { PasswordService } from "../utils/password";
import { JwtService } from "../utils/jwt";
import { EmailService } from "./emailService";
import {
  AuthUser,
  LoginCredentials,
  RegisterUserData,
  AssignRoleData,
  PasswordResetRequest,
  PasswordResetConfirm,
  SignUpData,
  EmailVerificationRequest,
} from "../types/auth";

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    userData: RegisterUserData,
    createdBy?: string
  ): Promise<AuthUser> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(
      userData.password
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Assign roles if provided
    if (userData.roleIds && userData.roleIds.length > 0) {
      await this.assignRoles(user.id, userData.roleIds, createdBy);
    }

    return this.formatUserData(user);
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{
    user: AuthUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  }> {
    // Find user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await PasswordService.comparePassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Format user data
    const formattedUser = this.formatUserData(user);

    // Generate tokens
    const roles = formattedUser.roles.map((role) => ({
      id: role.id,
      name: role.name,
      level: role.level || 1, // Provide default value
    }));
    const permissions = formattedUser.roles.flatMap((role) =>
      role.permissions.map((p) => ({
        service: p.service,
        resource: p.resource,
        action: p.action,
      }))
    );

    const tokens = JwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    });

    return {
      user: formattedUser,
      tokens,
    };
  }

  /**
   * Get user with roles and permissions
   */
  static async getUserWithRoles(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                // Note: firstName, lastName now come from user relation
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user ? this.formatUserData(user) : null;
  }

  /**
   * Assign roles to user
   */
  static async assignRoles(
    userId: string,
    roleIds: string[],
    assignedBy?: string
  ): Promise<void> {
    // Validate roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds }, isActive: true },
    });

    if (roles.length !== roleIds.length) {
      throw new Error("One or more invalid role IDs");
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
      })),
    });
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          permissions: {
            some: {
              permission: {
                resource,
                action,
              },
            },
          },
        },
      },
    });

    return !!userRole;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    try {
      const { userId } = JwtService.verifyRefreshToken(refreshToken);
      const user = await this.getUserWithRoles(userId);

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      const roles = user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        level: role.level || 1, // Provide default value
      }));
      const permissions = user.roles.flatMap((role) =>
        role.permissions.map((p) => ({
          service: p.service,
          resource: p.resource,
          action: p.action,
        }))
      );

      return JwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        roles,
        permissions,
      });
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Format user data for API response
   */
  private static formatUserData(user: any): AuthUser {
    const baseUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles.map((userRole: any) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        level: userRole.role.level || 1,
        isActive: userRole.role.isActive,
        permissions: userRole.role.permissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          service: rp.permission.service,
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: rp.permission.isActive,
        })),
      })),
    };

    // Add employee context if exists (new schema - no duplicate data)
    if (user.employee) {
      (baseUser as any).employee = {
        id: user.employee.id,
        employeeId: user.employee.employeeId,
        position: user.employee.position,
        phone: user.employee.phone, // Work phone
        hireDate: user.employee.hireDate,
        department: user.employee.department
          ? {
              id: user.employee.department.id,
              name: user.employee.department.name,
              code: user.employee.department.code,
            }
          : null,
        team: user.employee.team
          ? {
              id: user.employee.team.id,
              name: user.employee.team.name,
            }
          : null,
        manager: user.employee.manager
          ? {
              id: user.employee.manager.id,
              name: user.employee.manager.user
                ? `${user.employee.manager.user.firstName} ${user.employee.manager.user.lastName}`
                : "Unknown",
            }
          : null,
      };
    }

    return baseUser as AuthUser;
  }

  /**
   * Sign up new user (self-registration with email verification)
   */
  static async signUp(
    signUpData: SignUpData
  ): Promise<{ message: string; requiresVerification: boolean }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: signUpData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(
      signUpData.password
    );

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        email: signUpData.email,
        password: hashedPassword,
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        phone: signUpData.phone,
        isActive: false, // User will be activated after email verification
        emailVerified: false,
      },
    });

    // Create email verification token
    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: verificationExpiry,
      },
    });

    // Send verification email
    try {
      await EmailService.sendEmailVerificationEmail(
        user.email,
        verificationToken,
        user.firstName || "User"
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't throw error - user was created successfully
    }

    return {
      message:
        "Account created successfully. Please check your email to verify your account.",
      requiresVerification: true,
    };
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    // Find valid verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      throw new Error("Invalid or expired verification token");
    }

    // Update user as verified and active
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        isActive: true,
      },
    });

    // Delete used verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { message: "Email verified successfully. You can now log in." };
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<{ message: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return {
        message:
          "If an account with that email exists, a password reset email has been sent.",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token (delete any existing ones first)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: resetExpiry,
      },
    });

    // Send reset email
    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName || "User"
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw new Error("Failed to send password reset email");
    }

    return {
      message:
        "If an account with that email exists, a password reset email has been sent.",
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    resetData: PasswordResetConfirm
  ): Promise<{ message: string }> {
    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: resetData.token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await PasswordService.hashPassword(
      resetData.newPassword
    );

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return {
      message:
        "Password reset successfully. You can now log in with your new password.",
    };
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(
    request: EmailVerificationRequest
  ): Promise<{ message: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }

    // Delete any existing verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: verificationExpiry,
      },
    });

    // Send verification email
    try {
      await EmailService.sendEmailVerificationEmail(
        user.email,
        verificationToken,
        user.firstName || "User"
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      throw new Error("Failed to send verification email");
    }

    return { message: "Verification email sent successfully." };
  }

  /**
   * Logout user - invalidate sessions and tokens
   */
  static async logout(userId: string): Promise<void> {
    try {
      // Delete all active sessions for the user
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Update user's last logout time
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(), // This will be used to track session validity
          updatedAt: new Date(),
        },
      });

      console.log(`User ${userId} logged out successfully`);
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Failed to logout user");
    }
  }
}
