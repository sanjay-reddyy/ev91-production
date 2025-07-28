import { prisma } from '../config/database';
import { PasswordService } from '../utils/password';
import { JwtService } from '../utils/jwt';
import { 
  AuthUser, 
  LoginCredentials, 
  RegisterUserData,
  AssignRoleData
} from '../types/auth';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: RegisterUserData, createdBy?: string): Promise<AuthUser> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        createdBy,
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
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await PasswordService.comparePassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Format user data
    const formattedUser = this.formatUserData(user);

    // Generate tokens
    const roles = formattedUser.roles.map(role => role.name);
    const permissions = formattedUser.roles.flatMap(role =>
      role.permissions.map(p => `${p.resource}:${p.action}`)
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
  static async assignRoles(userId: string, roleIds: string[], assignedBy?: string): Promise<void> {
    // Validate roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds }, isActive: true },
    });

    if (roles.length !== roleIds.length) {
      throw new Error('One or more invalid role IDs');
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    await prisma.userRole.createMany({
      data: roleIds.map(roleId => ({
        userId,
        roleId,
        assignedBy,
      })),
    });
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
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
        throw new Error('User not found or inactive');
      }

      const roles = user.roles.map(role => role.name);
      const permissions = user.roles.flatMap(role =>
        role.permissions.map(p => `${p.resource}:${p.action}`)
      );

      return JwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        roles,
        permissions,
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
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
      phone: user.phone,
      isActive: user.isActive,
      roles: user.userRoles.map((userRole: any) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        permissions: userRole.role.permissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
    };
  }
}
