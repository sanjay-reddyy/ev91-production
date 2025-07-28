import { PrismaClient } from '@prisma/client';
import { AuthUser } from '../types/auth';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Get basic user data for team service operations
   * Note: Role/permission verification is handled by auth service via JWT
   */
  static async getUserWithRoles(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        team: true,
      },
    });

    return user ? this.formatUserData(user) : null;
  }

  /**
   * Format user data for API response
   */
  private static formatUserData(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
      } : undefined,
      team: user.team ? {
        id: user.team.id,
        name: user.team.name,
      } : undefined,
      roles: [], // Roles are managed by auth service, not team service
    };
  }
}
