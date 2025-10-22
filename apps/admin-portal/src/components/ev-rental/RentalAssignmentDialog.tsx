/**
 * RentalAssignmentDialog Component
 *
 * Admin dialog for assigning an actual vehicle to a rider based on their preference.
 * This component:
 * - Fetches available vehicles for the selected model
 * - Shows vehicle details (age, location, condition)
 * - Calculates depreciated rental cost
 * - Creates the rental assignment
 * - Generates 12-month payment schedule automatically
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Divider,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Close,
  Assignment,
  CheckCircle,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import {
  VehicleModel,
  AvailableVehicle,
  CreateRentalRequest,
} from '../../types/evRental';
import {
  getVehicleModel,
  getAvailableVehicles,
  calculateRentalCost,
  createRental,
  formatCurrency,
} from '../../services/evRentalService';

interface RentalAssignmentDialogProps {
  open: boolean;
  riderId: string;
  riderName: string;
  preferredModelId?: string;
  onClose: () => void;
  onRentalCreated: () => void;
}

const steps = ['Select Vehicle', 'Confirm Details', 'Complete'];

export const RentalAssignmentDialog: React.FC<RentalAssignmentDialogProps> = ({
  open,
  riderId,
  riderName,
  preferredModelId,
  onClose,
  onRentalCreated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [model, setModel] = useState<VehicleModel | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<AvailableVehicle | null>(null);
  const [rentalCost, setRentalCost] = useState<number>(0);
  const [depreciationInfo, setDepreciationInfo] = useState<any>(null);

  // Form data
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  // Load data when dialog opens
  useEffect(() => {
    if (open && preferredModelId) {
      loadRentalData();
    }
  }, [open, preferredModelId]);

  const loadRentalData = async () => {
    if (!preferredModelId) {
      setError('No preferred model selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch model details
      const modelData = await getVehicleModel(preferredModelId);
      setModel(modelData);

      // Fetch available vehicles
      const vehiclesData = await getAvailableVehicles(preferredModelId);
      setAvailableVehicles(vehiclesData.vehicles);

      // Set recommended security deposit (2x monthly cost)
      setSecurityDeposit(modelData.baseRentalCost * 2);

      if (vehiclesData.vehicles.length === 0) {
        setError('No vehicles available for this model at the moment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rental data');
      console.error('Error loading rental data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = async (vehicle: AvailableVehicle) => {
    setSelectedVehicle(vehicle);

    try {
      // Calculate depreciated cost
      const costData = await calculateRentalCost(preferredModelId!, vehicle.vehicleAge);
      setRentalCost(costData.actualMonthlyCost);
      setDepreciationInfo(costData);
    } catch (err) {
      console.error('Error calculating cost:', err);
      setRentalCost(model?.baseRentalCost || 0);
    }
  };

  // Handle rental creation
  const handleCreateRental = async () => {
    if (!selectedVehicle || !model) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const rentalData: CreateRentalRequest = {
        vehicleId: selectedVehicle.vehicleId,
        vehicleModelId: model.id,
        monthlyRentalCost: rentalCost,
        securityDeposit: securityDeposit,
        startDate: startDate,
        hubId: selectedVehicle.hub.hubId,
        hubName: selectedVehicle.hub.hubName,
        cityId: selectedVehicle.hub.city, // Assuming city ID
        cityName: selectedVehicle.hub.city,
        notes: notes,
      };

      await createRental(riderId, rentalData);

      setActiveStep(2); // Move to success step

      // Close dialog after short delay
      setTimeout(() => {
        onRentalCreated();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rental');
      console.error('Error creating rental:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedVehicle(null);
    setError(null);
    onClose();
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Assign EV Rental to {riderName}</Typography>
          </Box>
          <Button onClick={handleClose} size="small">
            <Close />
          </Button>
        </Box>

        {/* Stepper */}
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Step 1: Select Vehicle */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Model: {model?.modelName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Base Rental Cost: {formatCurrency(model?.baseRentalCost || 0)}/month
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Available Vehicles ({availableVehicles.length})
                </Typography>

                <RadioGroup
                  value={selectedVehicle?.vehicleId || ''}
                  onChange={(e) => {
                    const vehicle = availableVehicles.find(v => v.vehicleId === e.target.value);
                    if (vehicle) handleVehicleSelect(vehicle);
                  }}
                >
                  <Grid container spacing={2}>
                    {availableVehicles.map((vehicle) => (
                      <Grid item xs={12} key={vehicle.vehicleId}>
                        <Card
                          variant="outlined"
                          sx={{
                            border: selectedVehicle?.vehicleId === vehicle.vehicleId ? 2 : 1,
                            borderColor: selectedVehicle?.vehicleId === vehicle.vehicleId
                              ? 'primary.main'
                              : 'divider',
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FormControlLabel
                                value={vehicle.vehicleId}
                                control={<Radio />}
                                label=""
                                sx={{ mr: 2 }}
                              />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {vehicle.registrationNumber}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                  <Chip
                                    icon={<AccessTime />}
                                    label={`${vehicle.vehicleAge} months old`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    icon={<LocationOn />}
                                    label={`${vehicle.hub.hubName}, ${vehicle.hub.city}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={vehicle.condition}
                                    size="small"
                                    color={vehicle.condition === 'EXCELLENT' ? 'success' : 'default'}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>

                {/* Depreciation Info */}
                {depreciationInfo && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Depreciation Discount:</strong> {depreciationInfo.depreciationPercentage}%
                      <br />
                      <strong>Monthly Cost:</strong> {formatCurrency(depreciationInfo.actualMonthlyCost)}
                      <br />
                      <strong>Savings:</strong> {formatCurrency(depreciationInfo.savings)}/month
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* Step 2: Confirm Details */}
            {activeStep === 1 && selectedVehicle && (
              <Box>
                <Alert severity="info" icon={<Assignment />} sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Please review and confirm the rental details below. A 12-month payment schedule
                    will be automatically generated.
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Vehicle
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {model?.modelName} - {selectedVehicle.registrationNumber}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Monthly Rental Cost
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(rentalCost)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Security Deposit"
                      type="number"
                      fullWidth
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      helperText="Recommended: 2x monthly cost"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedVehicle.hub.hubName}, {selectedVehicle.hub.city}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Notes (Optional)"
                      multiline
                      rows={3}
                      fullWidth
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Payment Schedule Summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • 12 monthly payments of {formatCurrency(rentalCost)} each
                        <br />
                        • Total: {formatCurrency(rentalCost * 12)} over 12 months
                        <br />
                        • Security Deposit: {formatCurrency(securityDeposit)} (refundable)
                        <br />
                        • Payments will be automatically deducted from rider earnings
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 3: Success */}
            {activeStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Rental Assigned Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The EV rental has been assigned to {riderName}.
                  <br />
                  Payment schedule has been generated automatically.
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep < 2 && (
          <>
            <Button onClick={handleClose} disabled={processing}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={processing}>
                Back
              </Button>
            )}
            {activeStep === 0 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedVehicle || processing}
              >
                Next
              </Button>
            )}
            {activeStep === 1 && (
              <Button
                variant="contained"
                onClick={handleCreateRental}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={20} /> : <Assignment />}
              >
                {processing ? 'Creating Rental...' : 'Assign Rental'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RentalAssignmentDialog;
