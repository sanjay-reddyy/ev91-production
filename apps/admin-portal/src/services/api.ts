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
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
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
    isActive?: boolean; // Add isActive parameter support
  }): Promise<ApiResponse<{ employees: User[]; pagination: any }>> {
    try {
      console.log("🔍 API: Fetching employees with params:", params);
      const response = await this.api.get("/v1/employees/search", { params });

      console.log("📡 API: Raw response from server:", {
        status: response.status,
        success: response.data?.success,
        dataType: typeof response.data?.data,
        dataLength: Array.isArray(response.data?.data)
          ? response.data.data.length
          : "not array",
        paginationType: typeof response.data?.pagination,
        rawResponse: response.data,
      });

      // Backend returns: { success: true, data: employees[], pagination: {...} }
      // Transform to match expected frontend format
      if (response.data.success) {
        const employees = response.data.data || [];
        return {
          success: true,
          data: {
            employees: employees,
            pagination: response.data.pagination || {},
          },
        };
      } else {
        console.error("❌ API: Server returned success=false:", response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error("❌ API: Error fetching employees:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch employees",
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
        "/v1/employees",
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
        `/v1/employees/${id}`
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
      console.log("🔧 UpdateEmployee: Starting update", { id, data });

      const response = await this.api.put<ApiResponse<{ employee: User }>>(
        `/v1/employees/${id}`,
        data
      );

      console.log("✅ UpdateEmployee: Success response", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ UpdateEmployee: Error occurred", {
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
        `/v1/employees/${id}/deactivate`
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
  async getDepartments(
    includeInactive?: boolean
  ): Promise<ApiResponse<Department[]>> {
    try {
      let url = "/v1/departments";
      if (includeInactive) {
        url += "?includeInactive=true";
      }

      const response = await this.api.get<{
        success: boolean;
        data: Department[];
      }>(url);
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

  // City endpoints
  async getCities(): Promise<
    ApiResponse<
      Array<{ id: string; name: string; state: string; isActive: boolean }>
    >
  > {
    try {
      const response = await this.authApi.get<{
        success: boolean;
        data: Array<{
          id: string;
          name: string;
          state: string;
          isActive: boolean;
        }>;
      }>("/internal/city-sync/cities");

      // Filter for active cities and return full city objects with state info
      const activeCities =
        response.data.data?.filter((city) => city.isActive) || [];

      return {
        success: response.data.success,
        data: activeCities,
        message: response.data.success ? undefined : "Failed to fetch cities",
      };
    } catch (error: any) {
      console.error("API Error in getCities:", error);
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
    try {
      const response = await this.api.post<
        ApiResponse<{ department: Department }>
      >("/v1/departments", data);
      return response.data;
    } catch (error: any) {
      console.error("API Error in createDepartment:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async updateDepartment(
    id: string,
    data: Partial<Department>
  ): Promise<ApiResponse<{ department: Department }>> {
    try {
      const response = await this.api.put<
        ApiResponse<{ department: Department }>
      >(`/v1/departments/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error("API Error in updateDepartment:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async deleteDepartment(id: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete<ApiResponse>(
        `/v1/departments/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in deleteDepartment:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  // Team endpoints
  async getTeams(
    departmentId?: string,
    includeInactive?: boolean
  ): Promise<ApiResponse<{ teams: Team[] }>> {
    try {
      const params: any = {};
      if (departmentId) {
        params.departmentId = departmentId;
      }
      if (includeInactive) {
        params.includeInactive = "true";
      }

      const response = await this.api.get<ApiResponse<{ teams: Team[] }>>(
        "/v1/teams",
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in getTeams:", error);
      return {
        success: false,
        data: { teams: [] },
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: { team: Team };
      }>(`/v1/teams/${id}`);
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
    try {
      const response = await this.api.post<ApiResponse<{ team: Team }>>(
        "/v1/teams",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in createTeam:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async updateTeam(
    id: string,
    data: Partial<Team>
  ): Promise<ApiResponse<{ team: Team }>> {
    try {
      const response = await this.api.put<ApiResponse<{ team: Team }>>(
        `/v1/teams/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in updateTeam:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async deleteTeam(id: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete<ApiResponse>(`/v1/teams/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("API Error in deleteTeam:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  // Role endpoints
  async getRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
    try {
      const response = await this.api.get<ApiResponse<{ roles: Role[] }>>(
        "/v1/roles"
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in getRoles:", error);
      return {
        success: false,
        data: { roles: [] },
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async createRole(
    data: Omit<Role, "id">
  ): Promise<ApiResponse<{ role: Role }>> {
    try {
      const response = await this.api.post<ApiResponse<{ role: Role }>>(
        "/v1/roles",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in createRole:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async updateRole(
    id: string,
    data: Partial<Role>
  ): Promise<ApiResponse<{ role: Role }>> {
    try {
      const response = await this.api.put<ApiResponse<{ role: Role }>>(
        `/v1/roles/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("API Error in updateRole:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
  }

  async deleteRole(id: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete<ApiResponse>(`/v1/roles/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("API Error in deleteRole:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Network error",
      };
    }
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
