import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest, AuthContextType } from '../types/auth'
import { apiService } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true, // Start with loading true to prevent immediate redirect
  isAuthenticated: false,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      }
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false }
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isLoading: false, // Set loading to false so ProtectedRoute can redirect
        isAuthenticated: false,
      }
    case 'UPDATE_USER':
      return { ...state, user: action.payload }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Token refresh mechanism
  const refreshTokenIfNeeded = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const response = await apiService.refreshToken(refreshToken)
      if (response.success && response.data) {
        const { user, tokens } = response.data
        const accessToken = tokens.accessToken

        localStorage.setItem('authToken', accessToken)
        localStorage.setItem('user', JSON.stringify(user))

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: accessToken }
        })
        return true
      }
    } catch (error) {
      console.warn('Token refresh failed:', error)
    }
    return false
  }

  // Check for existing token on app load and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('user')

      if (token && user) {
        try {
          // First try to get profile with current token
          const response = await apiService.getProfile()
          if (response.success && response.data) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data.user || response.data, token }
            })
            return
          }
        } catch (error) {
          console.warn('Token validation failed, trying refresh:', error)

          // Try to refresh token
          const refreshed = await refreshTokenIfNeeded()
          if (!refreshed) {
            // Both validation and refresh failed, clear auth data
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            dispatch({ type: 'AUTH_FAILURE' })
          }
          return
        }
      }

      // No token found, user is not authenticated
      dispatch({ type: 'AUTH_FAILURE' })
    }

    validateToken()
  }, [])

  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'AUTH_START' })

    try {
      const response = await apiService.login(credentials)

      if (response.success && response.data) {
        const { user, tokens } = response.data
        const accessToken = tokens.accessToken
        const refreshToken = tokens.refreshToken

        // Store in localStorage
        localStorage.setItem('authToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        // Reset 401 counter on successful login
        sessionStorage.setItem('api_401_count', '0')

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: accessToken }
        })
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error
    }
  }

  const register = async (userData: RegisterRequest): Promise<void> => {
    dispatch({ type: 'AUTH_START' })

    try {
      const response = await apiService.register(userData)

      if (response.success && response.data) {
        const { user, tokens } = response.data
        const accessToken = tokens.accessToken
        const refreshToken = tokens.refreshToken

        // Store in localStorage
        localStorage.setItem('authToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: accessToken }
        })
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Call API logout to invalidate backend sessions
      await apiService.logout()
    } catch (error) {
      // Even if API call fails, we still want to logout locally
      console.warn('Logout API call failed:', error)
    } finally {
      // Always dispatch logout action to clear state and trigger redirect
      dispatch({ type: 'LOGOUT' })

      // Optional: Force immediate redirect as backup
      // This ensures redirection even if there are any state update delays
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 100)
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!state.user) return

    try {
      // Call the API to update the employee
      const response = await apiService.updateEmployee(state.user.id, data)

      if (response.success && response.data?.employee) {
        // Update local state with the updated user data
        const updatedUser = response.data.employee
        localStorage.setItem('user', JSON.stringify(updatedUser))
        dispatch({ type: 'UPDATE_USER', payload: updatedUser })
      } else {
        throw new Error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    updateProfile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
