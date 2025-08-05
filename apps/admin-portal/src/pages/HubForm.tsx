import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { hubService, cityService, type CreateHubRequest, type UpdateHubRequest, type City } from '../services/hubService';

interface HubFormData extends CreateHubRequest {
  id?: string;
}

const HubForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<HubFormData>({
    name: '',
    code: '',
    cityId: '',
    address: '',
    pinCode: '',
    landmark: '',
    latitude: 0,
    longitude: 0,
    hubType: 'Storage',
    hubCategory: 'Primary',
    vehicleCapacity: 0,
    chargingPoints: 0,
    serviceCapacity: 0,
    operatingHours: '',
    is24x7: false,
    managerName: '',
    contactNumber: '',
    emailAddress: '',
    alternateContact: '',
    hasParking: true,
    hasSecurity: false,
    hasCCTV: false,
    hasWashFacility: false,
    hasChargingStation: false,
    hasServiceCenter: false,
    status: 'Active',
    isPublicAccess: false,
    monthlyRent: 0,
    setupCost: 0,
    operationalCost: 0
  });

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCities();
    if (isEditing && id) {
      loadHub(id);
    }
  }, [isEditing, id]);

  const loadCities = async () => {
    try {
      const citiesData = await cityService.getOperationalCities();
      setCities(citiesData);
    } catch (err) {
      console.error('Error loading cities:', err);
      setError('Failed to load cities. Please try again.');
    }
  };

  const loadHub = async (hubId: string) => {
    try {
      setLoading(true);
      const hubData = await hubService.getHubById(hubId);
      setFormData({
        ...hubData,
        landmark: hubData.landmark || '',
        vehicleCapacity: hubData.vehicleCapacity || 0,
        operatingHours: hubData.operatingHours || '',
        managerName: hubData.managerName || '',
        contactNumber: hubData.contactNumber || '',
        emailAddress: hubData.emailAddress || '',
        alternateContact: hubData.alternateContact || '',
        monthlyRent: hubData.monthlyRent || 0,
        setupCost: hubData.setupCost || 0,
        operationalCost: hubData.operationalCost || 0
      });
    } catch (err) {
      console.error('Error loading hub:', err);
      setError('Failed to load hub data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Hub name is required';
    if (!formData.code.trim()) errors.code = 'Hub code is required';
    if (!formData.cityId) errors.cityId = 'City is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.pinCode.trim()) errors.pinCode = 'PIN code is required';
    if (formData.latitude === 0) errors.latitude = 'Latitude is required';
    if (formData.longitude === 0) errors.longitude = 'Longitude is required';
    
    // Validate PIN code format (Indian PIN codes)
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      errors.pinCode = 'PIN code must be 6 digits';
    }

    // Validate phone number
    if (formData.contactNumber && !/^\+?[\d\s-()]{10,15}$/.test(formData.contactNumber)) {
      errors.contactNumber = 'Invalid phone number format';
    }

    // Validate email
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      errors.emailAddress = 'Invalid email format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof HubFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && id) {
        const updateData: UpdateHubRequest = {
          name: formData.name,
          code: formData.code,
          cityId: formData.cityId,
          address: formData.address,
          pinCode: formData.pinCode,
          landmark: formData.landmark || undefined,
          latitude: formData.latitude,
          longitude: formData.longitude,
          hubType: formData.hubType,
          hubCategory: formData.hubCategory,
          vehicleCapacity: formData.vehicleCapacity || undefined,
          chargingPoints: formData.chargingPoints,
          serviceCapacity: formData.serviceCapacity,
          operatingHours: formData.operatingHours || undefined,
          is24x7: formData.is24x7,
          managerName: formData.managerName || undefined,
          contactNumber: formData.contactNumber || undefined,
          emailAddress: formData.emailAddress || undefined,
          alternateContact: formData.alternateContact || undefined,
          hasParking: formData.hasParking,
          hasSecurity: formData.hasSecurity,
          hasCCTV: formData.hasCCTV,
          hasWashFacility: formData.hasWashFacility,
          hasChargingStation: formData.hasChargingStation,
          hasServiceCenter: formData.hasServiceCenter,
          status: formData.status,
          isPublicAccess: formData.isPublicAccess,
          monthlyRent: formData.monthlyRent || undefined,
          setupCost: formData.setupCost || undefined,
          operationalCost: formData.operationalCost || undefined
        };
        await hubService.updateHub(id, updateData);
      } else {
        const createData: CreateHubRequest = {
          name: formData.name,
          code: formData.code,
          cityId: formData.cityId,
          address: formData.address,
          pinCode: formData.pinCode,
          landmark: formData.landmark || undefined,
          latitude: formData.latitude,
          longitude: formData.longitude,
          hubType: formData.hubType,
          hubCategory: formData.hubCategory,
          vehicleCapacity: formData.vehicleCapacity || undefined,
          chargingPoints: formData.chargingPoints,
          serviceCapacity: formData.serviceCapacity,
          operatingHours: formData.operatingHours || undefined,
          is24x7: formData.is24x7,
          managerName: formData.managerName || undefined,
          contactNumber: formData.contactNumber || undefined,
          emailAddress: formData.emailAddress || undefined,
          alternateContact: formData.alternateContact || undefined,
          hasParking: formData.hasParking,
          hasSecurity: formData.hasSecurity,
          hasCCTV: formData.hasCCTV,
          hasWashFacility: formData.hasWashFacility,
          hasChargingStation: formData.hasChargingStation,
          hasServiceCenter: formData.hasServiceCenter,
          status: formData.status,
          isPublicAccess: formData.isPublicAccess,
          monthlyRent: formData.monthlyRent || undefined,
          setupCost: formData.setupCost || undefined,
          operationalCost: formData.operationalCost || undefined
        };
        await hubService.createHub(createData);
      }

      navigate('/hubs');
    } catch (err: any) {
      console.error('Error saving hub:', err);
      setError(err.response?.data?.message || 'Failed to save hub. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocationCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get current location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedCity = cities.find(city => city.id === formData.cityId);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Hub' : 'Create New Hub'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditing ? 'Update hub information' : 'Add a new hub to the vehicle management system'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hub Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!validationErrors.name}
                      helperText={validationErrors.name}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hub Code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      error={!!validationErrors.code}
                      helperText={validationErrors.code || 'Unique identifier for the hub'}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!validationErrors.cityId}>
                      <InputLabel>City *</InputLabel>
                      <Select
                        value={formData.cityId}
                        onChange={(e) => handleInputChange('cityId', e.target.value)}
                        label="City *"
                      >
                        {cities.map((city) => (
                          <MenuItem key={city.id} value={city.id}>
                            {city.name} ({city.code})
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.cityId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                          {validationErrors.cityId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Hub Type</InputLabel>
                      <Select
                        value={formData.hubType}
                        onChange={(e) => handleInputChange('hubType', e.target.value)}
                        label="Hub Type"
                      >
                        <MenuItem value="Storage">Storage</MenuItem>
                        <MenuItem value="Service">Service</MenuItem>
                        <MenuItem value="Charging">Charging</MenuItem>
                        <MenuItem value="Mixed">Mixed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Hub Category</InputLabel>
                      <Select
                        value={formData.hubCategory}
                        onChange={(e) => handleInputChange('hubCategory', e.target.value)}
                        label="Hub Category"
                      >
                        <MenuItem value="Primary">Primary</MenuItem>
                        <MenuItem value="Secondary">Secondary</MenuItem>
                        <MenuItem value="Service Point">Service Point</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                        <MenuItem value="Under Construction">Under Construction</MenuItem>
                        <MenuItem value="Maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Location Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  Location Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      error={!!validationErrors.address}
                      helperText={validationErrors.address}
                      multiline
                      rows={2}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PIN Code"
                      value={formData.pinCode}
                      onChange={(e) => handleInputChange('pinCode', e.target.value)}
                      error={!!validationErrors.pinCode}
                      helperText={validationErrors.pinCode}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Landmark"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      helperText="Nearby landmark for easy identification"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                      error={!!validationErrors.latitude}
                      helperText={validationErrors.latitude}
                      inputProps={{ step: 'any' }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                      error={!!validationErrors.longitude}
                      helperText={validationErrors.longitude}
                      inputProps={{ step: 'any' }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={getCurrentLocationCoordinates}
                      sx={{ height: '56px' }}
                    >
                      Get Current Location
                    </Button>
                  </Grid>
                  {selectedCity && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Selected City: {selectedCity.name}, {selectedCity.state}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Capacity & Operations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Capacity & Operations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Vehicle Capacity"
                      type="number"
                      value={formData.vehicleCapacity}
                      onChange={(e) => handleInputChange('vehicleCapacity', parseInt(e.target.value) || 0)}
                      helperText="Maximum vehicles that can be stored"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Charging Points"
                      type="number"
                      value={formData.chargingPoints}
                      onChange={(e) => handleInputChange('chargingPoints', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Service Capacity"
                      type="number"
                      value={formData.serviceCapacity}
                      onChange={(e) => handleInputChange('serviceCapacity', parseInt(e.target.value) || 0)}
                      helperText="Vehicles serviced per day"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Operating Hours"
                      value={formData.operatingHours}
                      onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                      helperText="e.g., Mon-Fri: 9:00-18:00, Sat: 9:00-15:00"
                      disabled={formData.is24x7}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is24x7}
                          onChange={(e) => handleInputChange('is24x7', e.target.checked)}
                        />
                      }
                      label="24/7 Operations"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 1 }} />
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Manager Name"
                      value={formData.managerName}
                      onChange={(e) => handleInputChange('managerName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      error={!!validationErrors.contactNumber}
                      helperText={validationErrors.contactNumber}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">+91</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                      error={!!validationErrors.emailAddress}
                      helperText={validationErrors.emailAddress}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Alternate Contact"
                      value={formData.alternateContact}
                      onChange={(e) => handleInputChange('alternateContact', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Facilities & Features */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Facilities & Features
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasParking}
                          onChange={(e) => handleInputChange('hasParking', e.target.checked)}
                        />
                      }
                      label="Parking Available"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasSecurity}
                          onChange={(e) => handleInputChange('hasSecurity', e.target.checked)}
                        />
                      }
                      label="Security"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasCCTV}
                          onChange={(e) => handleInputChange('hasCCTV', e.target.checked)}
                        />
                      }
                      label="CCTV Surveillance"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasWashFacility}
                          onChange={(e) => handleInputChange('hasWashFacility', e.target.checked)}
                        />
                      }
                      label="Wash Facility"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasChargingStation}
                          onChange={(e) => handleInputChange('hasChargingStation', e.target.checked)}
                        />
                      }
                      label="Charging Station"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasServiceCenter}
                          onChange={(e) => handleInputChange('hasServiceCenter', e.target.checked)}
                        />
                      }
                      label="Service Center"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isPublicAccess}
                          onChange={(e) => handleInputChange('isPublicAccess', e.target.checked)}
                        />
                      }
                      label="Public Access"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Monthly Rent (₹)"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Setup Cost (₹)"
                      type="number"
                      value={formData.setupCost}
                      onChange={(e) => handleInputChange('setupCost', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Operational Cost (₹/month)"
                      type="number"
                      value={formData.operationalCost}
                      onChange={(e) => handleInputChange('operationalCost', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/hubs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Saving...' : isEditing ? 'Update Hub' : 'Create Hub'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default HubForm;
