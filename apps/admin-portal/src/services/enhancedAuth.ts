import axios, { AxiosInstance } from 'axios';

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified?: boolean;
      roles: Array<{
        id: string;
        name: string;
        permissions: Array<{
          id: string;
          name: string;
          resource: string;
          action: string;
        }>;
      }>;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
  error?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

class EnhancedAuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000/api/auth',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<ApiResponse> {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      // Store tokens and user data
      localStorage.setItem('authToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse> {
    const response = await this.api.post('/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetConfirm): Promise<ApiResponse> {
    const response = await this.api.post('/auth/reset-password', data);
    return response.data;
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await this.api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(data: EmailVerificationRequest): Promise<ApiResponse> {
    const response = await this.api.post('/auth/resend-verification', data);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/auth/refresh-token', {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      localStorage.setItem('authToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }

    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;

    return user.roles.some((role: any) =>
      role.permissions.some((permission: any) =>
        permission.resource === resource && permission.action === action
      )
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;

    return user.roles.some((role: any) => role.name === roleName);
  }
}

export default new EnhancedAuthService();
