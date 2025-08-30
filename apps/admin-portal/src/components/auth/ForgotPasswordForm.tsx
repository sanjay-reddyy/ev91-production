import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  Link,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import enhancedAuthService, { PasswordResetRequest } from '../../services/enhancedAuth';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<PasswordResetRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetRequest) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await enhancedAuthService.requestPasswordReset(data);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: response.message || 'Password reset instructions have been sent to your email.',
        });
        setEmailSent(true);
      } else {
        setMessage({
          type: 'error',
          text: response.error || 'Failed to send reset email. Please try again.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to send reset email. Please try again.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Reset Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {emailSent
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive password reset instructions'}
            </Typography>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          {!emailSent ? (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    margin="normal"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" gutterBottom>
                We've sent password reset instructions to your email address.
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Didn't receive the email? Check your spam folder or try again.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setEmailSent(false);
                  setMessage(null);
                }}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component={RouterLink}
              to="/login"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
            >
              <ArrowBack fontSize="small" />
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordForm;
