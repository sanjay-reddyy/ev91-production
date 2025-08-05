import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error, Email } from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import enhancedAuthService from '../../services/enhancedAuth';

const EmailVerificationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage({
          type: 'error',
          text: 'Invalid verification link. Please check your email for the correct link.',
        });
        setVerificationStatus('error');
        setIsLoading(false);
        return;
      }

      try {
        const response = await enhancedAuthService.verifyEmail(token);
        
        if (response.success) {
          setMessage({
            type: 'success',
            text: response.message || 'Email verified successfully! You can now log in to your account.',
          });
          setVerificationStatus('success');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setMessage({
            type: 'error',
            text: response.error || 'Email verification failed. The link may be expired or invalid.',
          });
          setVerificationStatus('error');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            'Email verification failed. Please try again.';
        setMessage({
          type: 'error',
          text: errorMessage,
        });
        setVerificationStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleResendVerification = async () => {
    // This would need the user's email - you might want to implement this differently
    // For now, we'll redirect to a resend verification page
    navigate('/resend-verification');
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
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {isLoading && (
            <>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Verifying Email...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {!isLoading && verificationStatus === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom color="success.main">
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Your email has been successfully verified.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to login in 3 seconds...
              </Typography>
            </>
          )}

          {!isLoading && verificationStatus === 'error' && (
            <>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom color="error.main">
                Verification Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                We couldn't verify your email address.
              </Typography>
            </>
          )}

          {message && (
            <Alert severity={message.type} sx={{ mt: 3, mb: 3 }}>
              {message.text}
            </Alert>
          )}

          {!isLoading && (
            <Box sx={{ mt: 4 }}>
              {verificationStatus === 'success' ? (
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                >
                  Go to Login
                </Button>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    onClick={handleResendVerification}
                    variant="contained"
                    startIcon={<Email />}
                  >
                    Resend Verification Email
                  </Button>
                  <Link component={RouterLink} to="/login">
                    Back to Login
                  </Link>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerificationPage;
