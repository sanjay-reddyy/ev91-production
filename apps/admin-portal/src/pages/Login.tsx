import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Define keyframes for animations
const pulseAnimation = `
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 0.9; }
    100% { opacity: 0.7; }
  }
`

const shakeAnimation = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`

// Inject animations into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = pulseAnimation + shakeAnimation
  document.head.appendChild(style)
}

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

interface LoginFormData {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError('')
      await login(data)
      navigate('/')
    } catch (error: any) {
      setError(error.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
          animation: 'pulse 4s infinite',
        },
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 450,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'visible',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '60px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: 4,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '-55px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                fontSize: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <span role="img" aria-label="electric vehicle" style={{ letterSpacing: '-4px' }}>⚡</span>
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 1000,
                background: 'linear-gradient(45deg, #1e3c72, #2a5298)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mt: 2
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              Sign in to your EV91 admin dashboard <span role="img" aria-label="dashboard">📊</span>
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: '8px',
                animation: 'shake 0.5s'
              }}
            >
              {error}
            </Alert>
          )}

          {/* Development Notice */}
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              borderRadius: '8px',
              background: 'rgba(33, 150, 243, 0.08)',
            }}
          >
            <Typography variant="body2">
              <strong>Development Credentials:</strong><br />
              Email: superadmin@ev91.com<br />
              Password: SuperAdmin123!
            </Typography>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#1e3c72' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused fieldset': {
                    borderColor: '#1e3c72',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2a5298',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1e3c72',
                },
              }}
              {...register('email')}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#1e3c72' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#1e3c72' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused fieldset': {
                    borderColor: '#1e3c72',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2a5298',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1e3c72',
                },
              }}
              {...register('password')}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #1e3c72, #2a5298)',
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 500,
                padding: '12px',
                boxShadow: '0 4px 12px rgba(30, 60, 114, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2a5298, #1e3c72)',
                  boxShadow: '0 6px 16px rgba(30, 60, 114, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  Sign In <span role="img" aria-label="bolt" style={{ marginLeft: '8px' }}>⚡</span>
                </>
              )}
            </Button>

            <Box 
              sx={{ 
                textAlign: 'center', 
                mb: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Link 
                component={RouterLink} 
                to="/forgot-password"
                sx={{
                  color: '#1e3c72',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Forgot your password? 
              </Link>
              <span role="img" aria-label="key">🔑</span>
            </Box>

            <Box 
              sx={{ 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/signup"
                  sx={{
                    color: '#1e3c72',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Sign up
                </Link>
                <span role="img" aria-label="rocket" style={{ marginLeft: '4px' }}>🚀</span>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                Need to verify your email?{' '}
                <Link 
                  component={RouterLink} 
                  to="/resend-verification"
                  sx={{
                    color: '#1e3c72',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Resend verification
                </Link>
                <span role="img" aria-label="envelope">✉️</span>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}