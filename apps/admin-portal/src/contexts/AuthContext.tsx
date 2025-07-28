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
      return { ...initialState }
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

  // Check for existing token on app load and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        try {
          // Validate token with backend
          const response = await apiService.getProfile()
          if (response.success && response.data) {
            dispatch({ 
              type: 'AUTH_SUCCESS', 
              payload: { user: response.data.user, token } 
            })
          } else {
            throw new Error('Token validation failed')
          }
        } catch (error) {
          // Invalid token or backend error, clear stored data
          console.warn('Token validation failed:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          dispatch({ type: 'AUTH_FAILURE' })
        }
      } else {
        // No token found, user is not authenticated
        dispatch({ type: 'AUTH_FAILURE' })
      }
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
        
        // Store in localStorage
        localStorage.setItem('authToken', accessToken)
        localStorage.setItem('user', JSON.stringify(user))
        
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
        
        // Store in localStorage
        localStorage.setItem('authToken', accessToken)
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

  const logout = (): void => {
    apiService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!state.user) return
    
    try {
      // This would need to be implemented in the backend
      // const response = await apiService.updateUser(state.user.id, data)
      
      // For now, just update local state
      const updatedUser = { ...state.user, ...data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      dispatch({ type: 'UPDATE_USER', payload: updatedUser })
    } catch (error) {
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
