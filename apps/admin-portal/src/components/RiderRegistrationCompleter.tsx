import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AssignmentTurnedIn as AssignmentIcon,
  AddTask as AddTaskIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { riderService } from '../services';

// Define the registration steps
const REGISTRATION_STEPS = [
  { label: 'Profile Created', status: 'PENDING' },
  { label: 'Phone Verified', status: 'PHONE_VERIFIED' },
  { label: 'KYC Completed', status: 'KYC_COMPLETED' },
  { label: 'Registration Completed', status: 'COMPLETED' }
];

interface RegistrationCompleterProps {
  riderId: string;
  onRegistrationUpdated: () => void;
}

const RiderRegistrationCompleter: React.FC<RegistrationCompleterProps> = ({
  riderId,
  onRegistrationUpdated
}) => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [activateRider, setActivateRider] = useState(true);
  const [verifyKYC, setVerifyKYC] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Add cache buster to prevent caching issues
      const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // IMPORTANT FIX: Fetch both endpoints to ensure consistency
      // 1. First get the registration status
      const registrationResponse = await riderService.getRiderRegistrationStatus(riderId, cacheBuster);

      // 2. Also get main rider data to double check isActive status
      const riderResponse = await riderService.getRiderById(riderId);

      console.log('[RiderRegistrationCompleter] Fetched data from both endpoints:', {
        registrationEndpoint: {
          isActive: registrationResponse.data?.isActive,
          type: typeof registrationResponse.data?.isActive
        },
        mainRiderEndpoint: {
          isActive: riderResponse.data?.isActive,
          type: typeof riderResponse.data?.isActive
        },
        match: registrationResponse.data?.isActive === riderResponse.data?.isActive
      });

      if (registrationResponse.success) {
        // Explicitly convert isActive to boolean to ensure consistent type
        // JSON stringify and parse to see exactly what's coming from the backend
        const rawIsActive = registrationResponse.data.isActive;
        console.log('[RiderRegistrationCompleter] Raw isActive from API:', {
          value: rawIsActive,
          type: typeof rawIsActive,
          stringValue: String(rawIsActive),
          jsonStringify: JSON.stringify(rawIsActive),
          looseEval: rawIsActive ? 'truthy' : 'falsy',
          strictEval: rawIsActive === true ? 'true' : 'false',
        });

        // CRITICAL: Use the main rider endpoint's isActive value as source of truth
        // This ensures we display the correct button state that matches the database
        const isActiveFromMainEndpoint = riderResponse.success
          ? riderResponse.data.isActive === true
          : registrationResponse.data.isActive === true;

        // Create processed data with the correct isActive value
        const processedData = {
          ...registrationResponse.data,
          isActive: isActiveFromMainEndpoint
        };

        console.log('[RiderRegistrationCompleter] Using main rider endpoint as source of truth:', {
          registrationIsActive: registrationResponse.data.isActive,
          mainRiderIsActive: riderResponse.data?.isActive,
          finalIsActive: isActiveFromMainEndpoint,
          finalIsActiveType: typeof isActiveFromMainEndpoint
        });

        setStatusData(processedData);

        // Set active step based on registration status
        const step = REGISTRATION_STEPS.findIndex(
          s => s.status === registrationResponse.data.registrationStatus
        );
        setActiveStep(step !== -1 ? step : 0);
      } else {
        setError('Failed to load registration status');
      }
    } catch (error) {
      setError(`Error loading registration status: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Log the current status data whenever it changes
  useEffect(() => {
    if (statusData) {
      console.log('[RiderRegistrationCompleter] Current rider status:', {
        riderId,
        isActive: statusData.isActive,
        isActiveStrict: statusData.isActive === true,
        isActiveType: typeof statusData.isActive,
        isActiveToString: String(statusData.isActive),
        registrationStatus: statusData.registrationStatus
      });
    }
  }, [riderId, statusData]);

  const handleToggleActivation = useCallback(async (activate: boolean) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[RiderRegistrationCompleter] Toggling rider status to: ${activate ? 'Active' : 'Inactive'} (${typeof activate})`);

      // Check if registration is completed before attempting to activate
      if (activate && statusData?.registrationStatus !== 'COMPLETED') {
        setError('Cannot activate rider: Registration is not complete');
        setLoading(false);
        return;
      }

      const response = await riderService.toggleRiderStatus(riderId, activate);

      if (response.success) {
        setSuccess(`Rider ${activate ? 'activated' : 'deactivated'} successfully`);

        // Ensure we're using a boolean value in the state update
        const strictBooleanValue = activate === true;
        console.log(`[RiderRegistrationCompleter] Updating local state: isActive=${strictBooleanValue}`);

        // Update local state to reflect the change immediately
        setStatusData((prevData: any) => {
          console.log('[RiderRegistrationCompleter] State update:', {
            prevActiveState: prevData.isActive,
            newActiveState: strictBooleanValue,
            isActiveFromResponse: response.data?.isActive,
            isActiveTypeFromResponse: typeof response.data?.isActive
          });

          // Use the response data if available, otherwise fall back to our expected value
          const newIsActive = response.data?.isActive !== undefined
            ? response.data.isActive === true
            : strictBooleanValue;

          return { ...prevData, isActive: newIsActive };
        });

        onRegistrationUpdated();

        // Wait a moment and then fetch fresh status to ensure consistency
        setTimeout(() => {
          console.log('[RiderRegistrationCompleter] Fetching fresh status after toggle');
          fetchStatus();
        }, 1000);
      } else {
        // Display business validation error from the API
        setError(`Failed to ${activate ? 'activate' : 'deactivate'} rider: ${response.message || 'Registration may not be complete'}`);
      }
    } catch (error: any) {
      // Enhanced error handling to show more details
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setError(`Error ${activate ? 'activating' : 'deactivating'} rider: ${errorMsg}`);
      console.error('[RiderRegistrationCompleter] Toggle status error:', error);
    } finally {
      setLoading(false);
    }
  }, [riderId, statusData, onRegistrationUpdated, fetchStatus]);

  const handleCompleteRegistration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCompleteDialogOpen(false);

      const response = await riderService.completeRiderRegistration(riderId, {
        kycVerified: verifyKYC,
        activateRider
      });

      if (response.success) {
        setSuccess('Registration completed successfully');
        onRegistrationUpdated();
        fetchStatus();
      } else {
        setError('Failed to complete registration');
      }
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [riderId, verifyKYC, activateRider, onRegistrationUpdated, fetchStatus]);

  const handleOpenCompleteDialog = () => {
    setCompleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED':
      case 'verified':
        return <CheckCircleIcon color="success" />;
      case 'PENDING':
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'REJECTED':
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        // Return a default icon instead of null to fix TypeScript error
        return <PendingIcon color="info" />;
    }
  };

  if (loading && !statusData) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Loading registration status...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !statusData) {
    return (
      <Alert severity="error">
        {error}
        <Button onClick={fetchStatus} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!statusData) {
    return <Alert severity="error">No rider data available</Alert>;
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registration Status
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {REGISTRATION_STEPS.map((step, index) => (
            <Step key={step.label} completed={activeStep >= index}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <LinearProgress
          variant="determinate"
          value={statusData.completionPercentage}
          sx={{ mb: 1, height: 10, borderRadius: 1 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {statusData.completionPercentage}% Complete
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Registration Status</Typography>
                    <Chip
                      icon={getStatusIcon(statusData.registrationStatus)}
                      label={statusData.registrationStatus}
                      color={getStatusColor(statusData.registrationStatus) as any}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">KYC Status</Typography>
                    <Chip
                      icon={getStatusIcon(statusData.kycStatus)}
                      label={statusData.kycStatus}
                      color={getStatusColor(statusData.kycStatus) as any}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Active Status</Typography>
                    <Chip
                      icon={statusData.isActive === true ? <CheckCircleIcon /> : <BlockIcon />}
                      label={statusData.isActive === true ? 'Active' : 'Inactive'}
                      color={statusData.isActive === true ? 'success' : 'error'}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Missing Information
                </Typography>

                {statusData.missingFields.length === 0 ? (
                  <Alert icon={<CheckCircleIcon />} severity="success">
                    All required information is provided
                  </Alert>
                ) : (
                  <>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {statusData.missingFields.length} required field(s) missing
                    </Alert>
                    <Box>
                      {statusData.missingFields.map((field: string) => (
                        <Chip
                          key={field}
                          label={field}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {/* Activation Button */}
          <Box>
            {statusData.registrationStatus === 'COMPLETED' && (
              <>
                {/* Debug info for button state */}
                {(() => {
                  console.log('[RiderRegistrationCompleter] Button rendering:', {
                    isActive: statusData.isActive,
                    isActiveType: typeof statusData.isActive,
                    isActiveStrict: statusData.isActive === true,
                    buttonText: statusData.isActive === true ? 'Deactivate' : 'Activate',
                    buttonColor: statusData.isActive === true ? 'error' : 'success'
                  });
                  return null;
                })()}
                <Button
                  variant="contained"
                  color={statusData.isActive === true ? 'error' : 'success'}
                  startIcon={statusData.isActive === true ? <BlockIcon /> : <CheckCircleIcon />}
                  onClick={() => {
                    const newStatus = !(statusData.isActive === true);
                    console.log(`[RiderRegistrationCompleter] Toggle status: Current=${statusData.isActive} (${typeof statusData.isActive}), New=${newStatus} (${typeof newStatus})`);
                    handleToggleActivation(newStatus);
                  }}
                  disabled={loading}
                >
                  {statusData.isActive === true ? 'Deactivate' : 'Activate'} Rider
                </Button>
              </>
            )}
          </Box>

          {/* Complete Registration Button */}
          <Box>
            {statusData.registrationStatus !== 'COMPLETED' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssignmentIcon />}
                onClick={handleOpenCompleteDialog}
                disabled={loading || statusData.missingFields.length > 0}
              >
                Complete Registration
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Complete Registration Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
        <DialogTitle>Complete Rider Registration</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This will mark the rider's registration as complete. You can also verify their KYC and activate their account in one step.
          </DialogContentText>

          <FormControlLabel
            control={
              <Switch
                checked={verifyKYC}
                onChange={(e) => setVerifyKYC(e.target.checked)}
              />
            }
            label="Verify KYC Documents"
          />

          <FormControlLabel
            control={
              <Switch
                checked={activateRider}
                onChange={(e) => setActivateRider(e.target.checked)}
              />
            }
            label="Activate Rider"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCompleteRegistration}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            Complete Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiderRegistrationCompleter;
