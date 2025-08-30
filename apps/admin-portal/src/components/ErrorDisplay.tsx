import React from 'react'
import { Alert, AlertTitle, Typography, Box, Button } from '@mui/material'
import { Security as SecurityIcon, Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material'

interface ErrorDisplayProps {
  error: any
  action?: string
  resource?: string
  onRetry?: () => void
  showDetails?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  action = 'perform this action',
  resource = 'resource',
  onRetry,
  showDetails = false
}) => {
  // Parse error to determine type
  const getErrorInfo = () => {
    let statusCode: number | null = null
    let errorMessage = 'An unexpected error occurred'
    let errorType: 'permission' | 'authentication' | 'server' | 'network' | 'validation' = 'server'

    if (error?.response?.status) {
      statusCode = error.response.status
    } else if (error?.status) {
      statusCode = error.status
    }

    if (error?.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }

    // Determine error type based on status code
    switch (statusCode) {
      case 401:
        errorType = 'authentication'
        break
      case 403:
        errorType = 'permission'
        break
      case 400:
        errorType = 'validation'
        break
      case 404:
        errorMessage = `${resource} not found`
        errorType = 'server'
        break
      case 500:
      case 502:
      case 503:
        errorMessage = 'Server error occurred. Please try again later.'
        errorType = 'server'
        break
      default:
        if (!statusCode) {
          errorMessage = 'Network error. Please check your connection.'
          errorType = 'network'
        }
    }

    return { statusCode, errorMessage, errorType }
  }

  const { statusCode, errorMessage, errorType } = getErrorInfo()

  const getIcon = () => {
    switch (errorType) {
      case 'permission':
      case 'authentication':
        return <SecurityIcon />
      case 'validation':
        return <WarningIcon />
      default:
        return <ErrorIcon />
    }
  }

  const getSeverity = (): 'error' | 'warning' => {
    return errorType === 'validation' ? 'warning' : 'error'
  }

  const getTitle = () => {
    switch (errorType) {
      case 'authentication':
        return 'Authentication Required'
      case 'permission':
        return 'Access Denied'
      case 'validation':
        return 'Invalid Data'
      case 'network':
        return 'Connection Error'
      case 'server':
        return 'Server Error'
      default:
        return 'Error'
    }
  }

  const getDescription = () => {
    switch (errorType) {
      case 'authentication':
        return 'Your session has expired. Please log in again to continue.'
      case 'permission':
        return `You don't have permission to ${action}. Contact your administrator if you need access.`
      case 'validation':
        return 'Please check your input and try again.'
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      case 'server':
        return 'A server error occurred. Please try again later or contact support if the problem persists.'
      default:
        return errorMessage
    }
  }

  const getActionButton = () => {
    if (errorType === 'authentication') {
      return (
        <Button
          color="primary"
          variant="outlined"
          size="small"
          onClick={() => {
            // Clear auth data and redirect to login
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }}
          sx={{ mt: 1 }}
        >
          Go to Login
        </Button>
      )
    }

    if (onRetry && (errorType === 'network' || errorType === 'server')) {
      return (
        <Button
          color="primary"
          variant="outlined"
          size="small"
          onClick={onRetry}
          sx={{ mt: 1 }}
        >
          Try Again
        </Button>
      )
    }

    return null
  }

  return (
    <Alert
      severity={getSeverity()}
      icon={getIcon()}
      sx={{ m: 2 }}
    >
      <AlertTitle>{getTitle()}</AlertTitle>
      <Typography variant="body2" paragraph>
        {getDescription()}
      </Typography>

      {showDetails && statusCode && (
        <Typography variant="caption" color="text.secondary" paragraph>
          Error Code: {statusCode}
        </Typography>
      )}

      {showDetails && errorMessage && errorMessage !== getDescription() && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Technical Details: {errorMessage}
          </Typography>
        </Box>
      )}

      {getActionButton()}
    </Alert>
  )
}

// Specific error components for common scenarios
export const PermissionError: React.FC<{
  action?: string
  requiredPermission?: string
  onContactAdmin?: () => void
}> = ({
  action = 'perform this action',
  requiredPermission,
  onContactAdmin
}) => (
  <Alert severity="error" icon={<SecurityIcon />} sx={{ m: 2 }}>
    <AlertTitle>Access Denied</AlertTitle>
    <Typography variant="body2" paragraph>
      You don't have permission to {action}.
    </Typography>
    {requiredPermission && (
      <Typography variant="body2" paragraph>
        Required permission: <code>{requiredPermission}</code>
      </Typography>
    )}
    <Typography variant="body2">
      Contact your administrator if you need access to this feature.
    </Typography>
    {onContactAdmin && (
      <Button
        color="primary"
        variant="outlined"
        size="small"
        onClick={onContactAdmin}
        sx={{ mt: 1 }}
      >
        Contact Administrator
      </Button>
    )}
  </Alert>
)

export const AuthenticationError: React.FC = () => (
  <Alert severity="error" icon={<SecurityIcon />} sx={{ m: 2 }}>
    <AlertTitle>Authentication Required</AlertTitle>
    <Typography variant="body2" paragraph>
      Your session has expired or you are not logged in.
    </Typography>
    <Button
      color="primary"
      variant="outlined"
      size="small"
      onClick={() => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }}
      sx={{ mt: 1 }}
    >
      Go to Login
    </Button>
  </Alert>
)
