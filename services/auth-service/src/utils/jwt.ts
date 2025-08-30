// Use a legacy import style that works with this JWT version
const jwt = require("jsonwebtoken");
import { JwtPayload } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export class JwtService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(payload: Omit<JwtPayload, "iat" | "exp">) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload.userId),
      expiresIn: JWT_EXPIRES_IN,
    };
  }
}
