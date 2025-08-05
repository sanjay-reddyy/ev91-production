import axios, { AxiosInstance } from 'axios'
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse, 
  User,
  Department,
  Team,
  Role,
  Permission 
} from '../types/auth'

class ApiService {
  private api: AxiosInstance
  private authApi: AxiosInstance

  constructor() {
    // Main API for general endpoints
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Separate API instance for auth endpoints
    this.authApi = axios.create({
      baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000/api/auth',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth token interceptor to both instances
    const addAuthToken = (config: any) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    const handleAuthError = (error: any) => {
      // Track consecutive 401 errors
      const unauthorizedCounter = parseInt(sessionStorage.getItem('api_401_count') || '0');
      
      if (error.response?.status === 401) {
        console.warn('Received 401 unauthorized response from API:', error.config?.url);
        
        // Increment the counter
        sessionStorage.setItem('api_401_count', (unauthorizedCounter + 1).toString());
        
        // If we have multiple consecutive 401s, assume token expired
        if (unauthorizedCounter >= 3) {
          console.warn('Multiple 401 errors detected - logging out user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Show message before redirecting
          alert('Your session has expired. You will be redirected to login.');
          window.location.href = '/login';
        }
      } else {
        // Reset counter for non-401 errors
        sessionStorage.setItem('api_401_count', '0');
      }
      
      return Promise.reject(error);
    }

    // Request interceptors
    this.api.interceptors.request.use(addAuthToken, (error) => Promise.reject(error))
    this.authApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error))

    // Response interceptors  
    this.api.interceptors.response.use((response) => response, handleAuthError)
    this.authApi.interceptors.response.use((response) => response, handleAuthError)
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>('/login', credentials)
    return response.data
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>('/register', userData)
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.authApi.post<AuthResponse>('/refresh', { refreshToken })
    return response.data
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.authApi.get<ApiResponse<{ user: User }>>('/profile')
    return response.data
  }

  async logout(): Promise<void> {
    // If we implement logout endpoint in backend
    // await this.api.post('/auth/logout')
    
    // For now, just clear local storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // User management endpoints
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    departmentId?: string
    teamId?: string
  }): Promise<ApiResponse<{ users: User[], pagination: any }>> {
    const response = await this.api.get<ApiResponse<{ users: User[], pagination: any }>>('/users', { params })
    return response.data
  }

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get<ApiResponse<{ user: User }>>(`/users/${id}`)
    return response.data
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.put<ApiResponse<{ user: User }>>(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/users/${id}`)
    return response.data
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<ApiResponse> {
    const response = await this.authApi.post<ApiResponse>('/assign-roles', { userId, roleIds })
    return response.data
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    try {
      const response = await this.api.get<{ success: boolean; departments: Department[] }>('/departments')
      return {
        success: response.data.success,
        data: response.data.departments,
        message: response.data.success ? undefined : 'Failed to fetch departments'
      }
    } catch (error: any) {
      console.error('API Error in getDepartments:', error)
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Network error'
      }
    }
  }

  async createDepartment(data: Omit<Department, 'id'>): Promise<ApiResponse<{ department: Department }>> {
    const response = await this.api.post<ApiResponse<{ department: Department }>>('/departments', data)
    return response.data
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<ApiResponse<{ department: Department }>> {
    const response = await this.api.put<ApiResponse<{ department: Department }>>(`/departments/${id}`, data)
    return response.data
  }

  async deleteDepartment(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/departments/${id}`)
    return response.data
  }

  // Team endpoints
  async getTeams(departmentId?: string): Promise<ApiResponse<{ teams: Team[] }>> {
    const params = departmentId ? { departmentId } : {}
    const response = await this.api.get<ApiResponse<{ teams: Team[] }>>('/teams', { params })
    return response.data
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    try {
      const response = await this.api.get<{ success: boolean; data: { team: Team } }>(`/teams/${id}`)
      return {
        success: response.data.success,
        data: response.data.data.team,
        message: response.data.success ? undefined : 'Failed to fetch team'
      }
    } catch (error: any) {
      console.error('API Error in getTeam:', error)
      return {
        success: false,
        data: {} as Team,
        error: error.response?.data?.message || error.response?.data?.error || error.message || 'Network error'
      }
    }
  }

  async createTeam(data: Omit<Team, 'id'>): Promise<ApiResponse<{ team: Team }>> {
    const response = await this.api.post<ApiResponse<{ team: Team }>>('/teams', data)
    return response.data
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<ApiResponse<{ team: Team }>> {
    const response = await this.api.put<ApiResponse<{ team: Team }>>(`/teams/${id}`, data)
    return response.data
  }

  async deleteTeam(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/teams/${id}`)
    return response.data
  }

  // Role endpoints
  async getRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
    const response = await this.api.get<ApiResponse<{ roles: Role[] }>>('/roles')
    return response.data
  }

  async createRole(data: Omit<Role, 'id'>): Promise<ApiResponse<{ role: Role }>> {
    const response = await this.api.post<ApiResponse<{ role: Role }>>('/roles', data)
    return response.data
  }

  async updateRole(id: string, data: Partial<Role>): Promise<ApiResponse<{ role: Role }>> {
    const response = await this.api.put<ApiResponse<{ role: Role }>>(`/roles/${id}`, data)
    return response.data
  }

  async deleteRole(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/roles/${id}`)
    return response.data
  }

  // Permission endpoints
  async getPermissions(): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const response = await this.api.get<ApiResponse<{ permissions: Permission[] }>>('/permissions')
    return response.data
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health')
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService
