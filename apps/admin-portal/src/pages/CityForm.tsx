import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  InputAdornment,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Navigation as NavigationIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import vehicleService from '../services/vehicleService';

// Form data interface
interface CityFormData {
  name: string;
  displayName: string;
  code: string;
  state: string;
  country: string;
  latitude: number | '';
  longitude: number | '';
  timezone: string;
  pinCodeRange: string;
  regionCode: string;
  isActive: boolean;
  isOperational: boolean;
  launchDate: Date | null;
  estimatedPopulation: number | '';
  marketPotential: number | '';
}

// Indian states for autocomplete
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands', 'Ladakh', 'Jammu and Kashmir'
];

// Indian timezones
const INDIAN_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Calcutta', // Alternative name
];

// Region codes
const REGION_CODES = [
  'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST', 'NORTHWEST', 'SOUTHEAST', 'SOUTHWEST'
];

const CityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<CityFormData>({
    name: '',
    displayName: '',
    code: '',
    state: '',
    country: 'India',
    latitude: '',
    longitude: '',
    timezone: 'Asia/Kolkata',
    pinCodeRange: '',
    regionCode: '',
    isActive: true,
    isOperational: false,
    launchDate: null,
    estimatedPopulation: '',
    marketPotential: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Form steps
  const steps = [
    'Basic Information',
    'Location Details',
    'Operational Settings',
    'Market Information'
  ];

  // Load existing city data for editing
  useEffect(() => {
    if (isEdit && id) {
      loadCityData(id);
    }
  }, [id, isEdit]);

  const loadCityData = async (cityId: string) => {
    setLoading(true);
    try {
      const response = await vehicleService.getCityById(cityId);
      if (response.success) {
        const city = response.data;
        setFormData({
          name: city.name || '',
          displayName: city.displayName || '',
          code: city.code || '',
          state: city.state || '',
          country: city.country || 'India',
          latitude: city.latitude || '',
          longitude: city.longitude || '',
          timezone: city.timezone || 'Asia/Kolkata',
          pinCodeRange: city.pinCodeRange || '',
          regionCode: city.regionCode || '',
          isActive: city.isActive ?? true,
          isOperational: city.isOperational ?? false,
          launchDate: city.launchDate ? new Date(city.launchDate) : null,
          estimatedPopulation: city.estimatedPopulation || '',
          marketPotential: city.marketPotential || '',
        });
      } else {
        showSnackbar('Failed to load city data', 'error');
      }
    } catch (error) {
      console.error('Error loading city data:', error);
      showSnackbar('Error loading city data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (field: keyof CityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-generate city code from name
  const generateCityCode = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .split(' ')
      .map(word => word.substring(0, 3))
      .join('')
      .substring(0, 6);
  };

  // Auto-update code when name changes
  useEffect(() => {
    if (formData.name && !formData.code) {
      handleInputChange('code', generateCityCode(formData.name));
    }
  }, [formData.name]);

  // Auto-update display name when name changes
  useEffect(() => {
    if (formData.name && !formData.displayName) {
      handleInputChange('displayName', formData.name);
    }
  }, [formData.name]);

  // Validation
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'City name is required';
        if (!formData.code.trim()) newErrors.code = 'City code is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';
        break;

      case 1: // Location Details
        if (!formData.latitude || isNaN(Number(formData.latitude))) {
          newErrors.latitude = 'Valid latitude is required';
        } else if (Number(formData.latitude) < -90 || Number(formData.latitude) > 90) {
          newErrors.latitude = 'Latitude must be between -90 and 90';
        }
        if (!formData.longitude || isNaN(Number(formData.longitude))) {
          newErrors.longitude = 'Valid longitude is required';
        } else if (Number(formData.longitude) < -180 || Number(formData.longitude) > 180) {
          newErrors.longitude = 'Longitude must be between -180 and 180';
        }
        break;

      case 2: // Operational Settings
        // Optional validation for operational settings
        break;

      case 3: // Market Information
        if (formData.estimatedPopulation && Number(formData.estimatedPopulation) < 0) {
          newErrors.estimatedPopulation = 'Population must be positive';
        }
        if (formData.marketPotential && Number(formData.marketPotential) < 0) {
          newErrors.marketPotential = 'Market potential must be positive';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Submit form
  const handleSubmit = async () => {
    // Validate all steps
    let isValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setActiveStep(i); // Go to first invalid step
        break;
      }
    }

    if (!isValid) return;

    setSaving(true);
    try {
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || formData.name.trim(),
        code: formData.code.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        timezone: formData.timezone,
        pinCodeRange: formData.pinCodeRange.trim() || undefined,
        regionCode: formData.regionCode.trim() || undefined,
        isActive: formData.isActive,
        isOperational: formData.isOperational,
        launchDate: formData.launchDate?.toISOString() || undefined,
        estimatedPopulation: formData.estimatedPopulation ? Number(formData.estimatedPopulation) : undefined,
        marketPotential: formData.marketPotential ? Number(formData.marketPotential) : undefined,
      };

      // Note: These endpoints are now implemented in the vehicle service
      if (isEdit) {
        await vehicleService.updateCity(id!, apiData);
        showSnackbar('City updated successfully!', 'success');
      } else {
        await vehicleService.createCity(apiData);
        showSnackbar('City created successfully!', 'success');
      }

      navigate('/cities');
    } catch (error: any) {
      console.error('Error saving city:', error);
      showSnackbar(error.message || 'Error saving city', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                helperText="Friendly name for display (defaults to city name)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City Code *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                error={!!errors.code}
                helperText={errors.code || "Unique code for the city (auto-generated)"}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={INDIAN_STATES}
                value={formData.state}
                onChange={(_, value) => handleInputChange('state', value || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State *"
                    error={!!errors.state}
                    helperText={errors.state}
                  />
                )}
                freeSolo
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country *"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                error={!!errors.country}
                helperText={errors.country}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={REGION_CODES}
                value={formData.regionCode}
                onChange={(_, value) => handleInputChange('regionCode', value || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Region Code"
                    helperText="Geographic region classification"
                  />
                )}
                freeSolo
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  Use GPS coordinates or search online for accurate location data
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude *"
                type="number"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                error={!!errors.latitude}
                helperText={errors.latitude || "Decimal degrees (-90 to 90)"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ step: 'any', min: -90, max: 90 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude *"
                type="number"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                error={!!errors.longitude}
                helperText={errors.longitude || "Decimal degrees (-180 to 180)"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NavigationIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ step: 'any', min: -180, max: 180 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={formData.timezone}
                  label="Timezone"
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  {INDIAN_TIMEZONES.map(tz => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pin Code Range"
                value={formData.pinCodeRange}
                onChange={(e) => handleInputChange('pinCodeRange', e.target.value)}
                helperText="e.g., 400001-400100 or 110001,110002,110003"
                placeholder="400001-400100"
              />
            </Grid>

            {/* Coordinate Display */}
            {formData.latitude && formData.longitude && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location Preview
                  </Typography>
                  <Typography variant="body2">
                    {formData.latitude}, {formData.longitude}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;
                      window.open(url, '_blank');
                    }}
                    sx={{ mt: 1 }}
                  >
                    View on Google Maps
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Status Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Whether the city is active in the system
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOperational}
                    onChange={(e) => handleInputChange('isOperational', e.target.checked)}
                  />
                }
                label="Operational"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Whether operations are active in this city
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Launch Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Launch Date"
                  value={formData.launchDate}
                  onChange={(date) => handleInputChange('launchDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'When operations launched/will launch',
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Market Information
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Optional information for market analysis and planning
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Population"
                type="number"
                value={formData.estimatedPopulation}
                onChange={(e) => handleInputChange('estimatedPopulation', e.target.value)}
                error={!!errors.estimatedPopulation}
                helperText={errors.estimatedPopulation || "Total city population estimate"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Market Potential (₹)"
                type="number"
                value={formData.marketPotential}
                onChange={(e) => handleInputChange('marketPotential', e.target.value)}
                error={!!errors.marketPotential}
                helperText={errors.marketPotential || "Estimated market size in INR"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TrendingUpIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  Market information helps in resource planning and expansion decisions
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading city data...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEdit ? 'Edit City' : 'Add New City'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isEdit ? 'Update city information and settings' : 'Add a new city to the system'}
          </Typography>
        </Box>

        {/* Form */}
        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {renderStepContent(index)}

                    <Box sx={{ mt: 3, mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={saving}
                        startIcon={index === steps.length - 1 ? <SaveIcon /> : undefined}
                        sx={{ mr: 1 }}
                      >
                        {saving ? 'Saving...' : index === steps.length - 1 ? 'Save City' : 'Continue'}
                      </Button>

                      {index > 0 && (
                        <Button onClick={handleBack} disabled={saving}>
                          Back
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {/* Summary at the end */}
            {activeStep === steps.length && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  City Information Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Name:</Typography>
                    <Typography>{formData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Code:</Typography>
                    <Chip label={formData.code} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Location:</Typography>
                    <Typography>{formData.state}, {formData.country}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Box>
                      {formData.isActive && <Chip label="Active" color="success" size="small" />}
                      {formData.isOperational && <Chip label="Operational" color="primary" size="small" sx={{ ml: 1 }} />}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/cities')}
            disabled={saving}
          >
            Cancel
          </Button>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CityForm;
