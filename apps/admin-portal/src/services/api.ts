import axios, { AxiosInstance } from "axios";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  User,
  Department,
  CreateDepartmentData,
  Team,
  Role,
  Permission,
} from "../types/auth";

class ApiService {
  private api: AxiosInstance;
  private authApi: AxiosInstance;

  constructor() {
    // Main API for general endpoints
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Separate API instance for auth endpoints
    this.authApi = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token interceptor to both instances
    const addAuthToken = (config: any) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    const handleAuthError = (error: any) => {
      // Only handle 401 errors more carefully
      if (error.response?.status === 401) {
        console.warn(
          "Received 401 unauthorized response from API:",
          error.config?.url
        );

        // Check if this is the profile validation endpoint
        const isProfileValidation =
          error.config?.url?.includes("/auth/profile");

        // For profile validation, don't immediately logout - just clear token
        if (isProfileValidation) {
          console.info("Profile validation failed - token may be expired");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          // Don't force redirect here, let AuthContext handle it
          return Promise.reject(error);
        }

        // For other 401 errors, track them but be less aggressive
        const unauthorizedCounter = parseInt(
          sessionStorage.getItem("api_401_count") || "0"
        );

        // Increment the counter
        sessionStorage.setItem(
          "api_401_count",
          (unauthorizedCounter + 1).toString()
        );

        // Only logout after 5 consecutive 401s (was 3)
        if (unauthorizedCounter >= 5) {
          console.warn("Multiple 401 errors detected - logging out user");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");

          // Show message before redirecting
          alert("Your session has expired. You will be redirected to login.");
          window.location.href = "/login";
        }
      } else {
        // Reset counter for non-401 errors
        sessionStorage.setItem("api_401_count", "0");
      }

      return Promise.reject(error);
    };

    // Request interceptors
    this.api.interceptors.request.use(addAuthToken, (error) =>
      Promise.reject(error)
    );
    this.authApi.interceptors.request.use(addAuthToken, (error) =>
      Promise.reject(error)
    );

    // Response interceptors
    this.api.interceptors.response.use((response) => response, handleAuthError);
    this.authApi.interceptors.response.use(
      (response) => response,
      handleAuthError
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>(
      "/auth/register",
      userData
    );
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.authApi.get<ApiResponse<{ user: User }>>(
      "/auth/profile"
    );
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      // Get the current token to verify it exists
      const token = localStorage.getItem("authToken");
      console.log("Logout: Starting logout process", { hasToken: !!token });

      // Call backend logout endpoint to invalidate sessions
      // Explicitly send empty object as body and proper headers
      const response = await this.authApi.post(
        "/auth/logout",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Logout: Backend call successful", response.status);
    } catch (error: any) {
      // Even if backend call fails, we still want to clear local storage
      console.warn("Backend logout failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } finally {
      // Always clear local storage regardless of backend response
      console.log("Logout: Clearing local storage");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Clear 401 counter
      sessionStorage.removeItem("api_401_count");

      // Clear any cached user data
      sessionStorage.clear();
    }
  }

  // Employee management endpoints
  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    teamId?: string;
  }): Promise<ApiResponse<{ employees: User[]; pagination: any }>> {
    try {
      const response = await this.api.get("/employees/search", { params });

      // Transform the response to match expected format
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            employees: response.data.data,
            pagination: response.data.pagination || {},
          },
        };
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch employees",
      };
    }
  }

  async createEmployee(data: {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    departmentId: string;
    teamId?: string;
    roleIds: string[];
    hireDate: Date;
    position?: string;
    managerId?: string;
    temporaryPassword: string;
  }): Promise<ApiResponse<{ employee: User }>> {
    try {
      // Validate role IDs are not empty
      const validRoleIds = data.roleIds.filter((id) => id && id.trim() !== "");
      if (validRoleIds.length === 0) {
        return {
          success: false,
          error: "At least one valid role must be selected",
        };
      }

      // Format the data to match backend expectations
      const formattedData = {
        ...data,
        roleIds: validRoleIds,
        hireDate: data.hireDate.toISOString(),
        // Remove managerId if it's empty to avoid foreign key constraint issues
        managerId:
          data.managerId && data.managerId.trim() !== ""
            ? data.managerId
            : undefined,
        // Remove phone if it's empty
        phone: data.phone && data.phone.trim() !== "" ? data.phone : undefined,
      };

      // Remove undefined values to clean up the payload
      Object.keys(formattedData).forEach((key) => {
        if (formattedData[key as keyof typeof formattedData] === undefined) {
          delete formattedData[key as keyof typeof formattedData];
        }
      });

      console.log("Creating employee with data:", formattedData);

      const response = await this.api.post<ApiResponse<{ employee: User }>>(
        "/employees",
        formattedData
      );

      return response.data;
    } catch (error: any) {
      console.error("Error creating employee:", error.response?.data || error);

      // Check for specific role-related errors
      if (error.response?.data?.error?.includes("user_roles_roleId_fkey")) {
        return {
          success: false,
          error:
            "One or more selected roles are invalid. Please refresh the page and try again.",
        };
      }

      // Check for manager constraint errors
      if (error.response?.data?.error?.includes("employees_managerId_fkey")) {
        return {
          success: false,
          error:
            "Selected manager is invalid. Please choose a different manager or leave it empty.",
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || "Failed to create employee",
      };
    }
  }

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await this.api.get<ApiResponse<{ employee: User }>>(
        `/employees/${id}`
      );

      // Transform the response to match expected format
      return {
        success: response.data.success,
        data: response.data.data?.employee
          ? { user: response.data.data.employee }
          : undefined,
        error: response.data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user",
      };
    }
  }

  async updateEmployee(
    id: string,
    data: Partial<User>
  ): Promise<ApiResponse<{ employee: User }>> {
    try {
      console.log("UpdateEmployee: Starting update", { id, data });

      const response = await this.api.put<ApiResponse<{ employee: User }>>(
        `/employees/${id}`,
        data
      );

      console.log(
        "UpdateEmployee: Response received",
        response.status,
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error("UpdateEmployee: Error occurred", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        error: error.response?.data?.error || "Failed to update employee",
      };
    }
  }

  async deleteEmployee(id: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete<ApiResponse>(
        `/employees/${id}/deactivate`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete employee",
      };
    }
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<ApiResponse> {
    const response = await this.authApi.post<ApiResponse>(
      "/auth/assign-roles",
      { userId, roleIds }
    );
    return response.data;
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: Department[];
      }>("/departments");
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.success
          ? undefined
          : "Failed to fetch departments",
      };
    } catch (error: any) {
      console.error("API Error in getDepartments:", error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async createDepartment(
    data: CreateDepartmentData
  ): Promise<ApiResponse<{ department: Department }>> {
    const response = await this.api.post<
      ApiResponse<{ department: Department }>
    >("/departments", data);
    return response.data;
  }

  async updateDepartment(
    id: string,
    data: Partial<Department>
  ): Promise<ApiResponse<{ department: Department }>> {
    const response = await this.api.put<
      ApiResponse<{ department: Department }>
    >(`/departments/${id}`, data);
    return response.data;
  }

  async deleteDepartment(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/departments/${id}`);
    return response.data;
  }

  // Team endpoints
  async getTeams(
    departmentId?: string
  ): Promise<ApiResponse<{ teams: Team[] }>> {
    const params = departmentId ? { departmentId } : {};
    const response = await this.api.get<ApiResponse<{ teams: Team[] }>>(
      "/teams",
      { params }
    );
    return response.data;
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: { team: Team };
      }>(`/teams/${id}`);
      return {
        success: response.data.success,
        data: response.data.data.team,
        message: response.data.success ? undefined : "Failed to fetch team",
      };
    } catch (error: any) {
      console.error("API Error in getTeam:", error);
      return {
        success: false,
        data: {} as Team,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Network error",
      };
    }
  }

  async createTeam(
    data: Omit<Team, "id">
  ): Promise<ApiResponse<{ team: Team }>> {
    const response = await this.api.post<ApiResponse<{ team: Team }>>(
      "/teams",
      data
    );
    return response.data;
  }

  async updateTeam(
    id: string,
    data: Partial<Team>
  ): Promise<ApiResponse<{ team: Team }>> {
    const response = await this.api.put<ApiResponse<{ team: Team }>>(
      `/teams/${id}`,
      data
    );
    return response.data;
  }

  async deleteTeam(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/teams/${id}`);
    return response.data;
  }

  // Role endpoints
  async getRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
    const response = await this.api.get<ApiResponse<{ roles: Role[] }>>(
      "/roles"
    );
    return response.data;
  }

  async createRole(
    data: Omit<Role, "id">
  ): Promise<ApiResponse<{ role: Role }>> {
    const response = await this.api.post<ApiResponse<{ role: Role }>>(
      "/roles",
      data
    );
    return response.data;
  }

  async updateRole(
    id: string,
    data: Partial<Role>
  ): Promise<ApiResponse<{ role: Role }>> {
    const response = await this.api.put<ApiResponse<{ role: Role }>>(
      `/roles/${id}`,
      data
    );
    return response.data;
  }

  async deleteRole(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/roles/${id}`);
    return response.data;
  }

  // Permission endpoints
  async getPermissions(): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const response = await this.api.get<
      ApiResponse<{ permissions: Permission[] }>
    >("/permissions");
    return response.data;
  }

  async createPermission(
    data: Omit<Permission, "id">
  ): Promise<ApiResponse<{ permission: Permission }>> {
    const response = await this.api.post<
      ApiResponse<{ permission: Permission }>
    >("/permissions", data);
    return response.data;
  }

  async updatePermission(
    id: string,
    data: Partial<Permission>
  ): Promise<ApiResponse<{ permission: Permission }>> {
    const response = await this.api.put<
      ApiResponse<{ permission: Permission }>
    >(`/permissions/${id}`, data);
    return response.data;
  }

  async deletePermission(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/permissions/${id}`);
    return response.data;
  }

  // Role-Permission management
  async assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(
      `/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  async getRolePermissions(
    roleId: string
  ): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const response = await this.api.get<
      ApiResponse<{ permissions: Permission[] }>
    >(`/roles/${roleId}/permissions`);
    return response.data;
  }

  // User-Role management
  async assignRoleToUser(userId: string, roleId: string): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/users/${userId}/roles/${roleId}`
    );
    return response.data;
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string
  ): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(
      `/users/${userId}/roles/${roleId}`
    );
    return response.data;
  }

  async getUserRoles(userId: string): Promise<ApiResponse<{ roles: Role[] }>> {
    const response = await this.api.get<ApiResponse<{ roles: Role[] }>>(
      `/users/${userId}/roles`
    );
    return response.data;
  }

  async getUserPermissions(
    userId: string
  ): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const response = await this.api.get<
      ApiResponse<{ permissions: Permission[] }>
    >(`/users/${userId}/permissions`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get("/health");
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
