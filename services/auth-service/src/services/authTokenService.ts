import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { EmailService } from "./emailService";

export class AuthTokenService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    // Delete any existing tokens for this user
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");

    // Store token in database (expires in 24 hours)
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return token;
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token: string): Promise<boolean> {
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      throw new Error("Invalid verification token");
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.emailVerificationToken.delete({
        where: { token },
      });
      throw new Error("Verification token has expired");
    }

    // Update user as verified
    await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    });

    // Clean up used token
    await this.prisma.emailVerificationToken.delete({
      where: { token },
    });

    return true;
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    const token = await this.generateEmailVerificationToken(userId);

    // Send verification email
    await EmailService.sendEmailVerificationEmail(
      user.email,
      token,
      user.firstName || "User"
    );
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User with this email does not exist");
    }

    // Delete any existing tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");

    // Store token in database (expires in 1 hour)
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    return token;
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<string> {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      throw new Error("Invalid reset token");
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.passwordResetToken.delete({
        where: { token },
      });
      throw new Error("Reset token has expired");
    }

    return tokenRecord.userId;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.verifyPasswordResetToken(token);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Clean up used token
    await this.prisma.passwordResetToken.delete({
      where: { token },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    const token = await this.generatePasswordResetToken(email);

    // Send reset email
    await EmailService.sendPasswordResetEmail(
      user.email,
      token,
      user.firstName || "User"
    );
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    await Promise.all([
      this.prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);
  }
}
