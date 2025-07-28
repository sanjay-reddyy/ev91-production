import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  DirectionsCar as CarIcon,
  Battery50 as BatteryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { vehicleModelService, CreateVehicleModelRequest, UpdateVehicleModelRequest } from '../services/vehicleModelService';
import { oemService, OEM } from '../services/oemService';

interface VehicleModelFormProps {}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const validationSchema = yup.object({
  oemId: yup.string().required('OEM is required'),
  name: yup.string().required('Model name is required').min(2, 'Name must be at least 2 characters'),
  displayName: yup.string().required('Display name is required').min(2, 'Display name must be at least 2 characters'),
  modelCode: yup.string().required('Model code is required').min(2, 'Code must be at least 2 characters').max(20, 'Code must be at most 20 characters'),
  category: yup.string().required('Category is required'),
  segment: yup.string().required('Segment is required'),
  fuelType: yup.string().required('Fuel type is required'),
  vehicleType: yup.string().optional(),
  batteryCapacity: yup.string().optional(),
  range: yup.number().positive('Range must be positive').optional().nullable(),
  maxSpeed: yup.number().positive('Speed must be positive').optional().nullable(),
  weight: yup.number().positive('Weight must be positive').optional().nullable(),
  dimensions: yup.string().optional(),
  seatingCapacity: yup.number().positive('Seating capacity must be positive').optional().nullable(),
  cargoCapacity: yup.number().positive('Cargo capacity must be positive').optional().nullable(),
  availableVariants: yup.string().optional(),
  availableColors: yup.string().optional(),
  standardFeatures: yup.string().optional(),
  optionalFeatures: yup.string().optional(),
  basePrice: yup.number().positive('Price must be positive').optional().nullable(),
  priceRange: yup.string().optional(),
  serviceInterval: yup.number().positive('Service interval must be positive').optional().nullable(),
  warrantyPeriod: yup.number().positive('Warranty period must be positive').optional().nullable(),
  spareParts: yup.string().optional(),
  imageUrl: yup.string().url('Please enter a valid URL').optional().nullable(),
  brochureUrl: yup.string().url('Please enter a valid URL').optional().nullable(),
  isActive: yup.boolean().default(true),
  isPopular: yup.boolean().default(false),
});

type FormData = yup.InferType<typeof validationSchema>;

const VehicleModelForm: React.FC<VehicleModelFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const preselectedOemId = searchParams.get('oemId');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [selectedOEM, setSelectedOEM] = useState<OEM | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      oemId: preselectedOemId || '',
      name: '',
      displayName: '',
      modelCode: '',
      category: '',
      segment: '',
      fuelType: '',
      vehicleType: '',
      batteryCapacity: '',
      range: null,
      maxSpeed: null,
      weight: null,
      dimensions: '',
      seatingCapacity: null,
      cargoCapacity: null,
      availableVariants: '',
      availableColors: '',
      standardFeatures: '',
      optionalFeatures: '',
      basePrice: null,
      priceRange: '',
      serviceInterval: null,
      warrantyPeriod: null,
      spareParts: '',
      imageUrl: '',
      brochureUrl: '',
      isActive: true,
      isPopular: false,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    loadOEMs();
    if (isEditing && id) {
      loadVehicleModel(id);
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (watchedValues.oemId) {
      const oem = oems.find(o => o.id === watchedValues.oemId);
      setSelectedOEM(oem || null);
    }
  }, [watchedValues.oemId, oems]);

  const loadOEMs = async () => {
    try {
      const response = await oemService.getAllOEMs({ isActive: true });
      setOEMs(response.data);
      
      // If preselected OEM, set it as selected
      if (preselectedOemId) {
        const selectedOem = response.data.find(oem => oem.id === preselectedOemId);
        setSelectedOEM(selectedOem || null);
      }
    } catch (error) {
      console.error('Error loading OEMs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load OEMs',
        severity: 'error',
      });
    }
  };

  const loadVehicleModel = async (modelId: string) => {
    try {
      setInitialLoading(true);
      const response = await vehicleModelService.getVehicleModelById(modelId);
      const model = response.data;
      
      reset({
        oemId: model.oemId,
        name: model.name,
        displayName: model.displayName,
        modelCode: model.modelCode,
        category: model.category,
        segment: model.segment || '',
        fuelType: model.fuelType,
        vehicleType: model.vehicleType || '',
        batteryCapacity: model.batteryCapacity || '',
        range: model.range || null,
        maxSpeed: model.maxSpeed || null,
        weight: model.weight || null,
        dimensions: model.dimensions || '',
        seatingCapacity: model.seatingCapacity || null,
        cargoCapacity: model.cargoCapacity || null,
        availableVariants: model.availableVariants || '',
        availableColors: model.availableColors || '',
        standardFeatures: model.standardFeatures || '',
        optionalFeatures: model.optionalFeatures || '',
        basePrice: model.basePrice || null,
        priceRange: model.priceRange || '',
        serviceInterval: model.serviceInterval || null,
        warrantyPeriod: model.warrantyPeriod || null,
        spareParts: model.spareParts || '',
        imageUrl: model.imageUrl || '',
        brochureUrl: model.brochureUrl || '',
        isActive: model.isActive,
        isPopular: model.isPopular,
      });
    } catch (error) {
      console.error('Error loading vehicle model:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle model details',
        severity: 'error',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload: CreateVehicleModelRequest | UpdateVehicleModelRequest = {
        oemId: data.oemId,
        name: data.name,
        displayName: data.displayName,
        modelCode: data.modelCode,
        category: data.category,
        segment: data.segment,
        fuelType: data.fuelType,
        vehicleType: data.vehicleType || undefined,
        batteryCapacity: data.batteryCapacity || undefined,
        range: data.range || undefined,
        maxSpeed: data.maxSpeed || undefined,
        weight: data.weight || undefined,
        dimensions: data.dimensions || undefined,
        seatingCapacity: data.seatingCapacity || undefined,
        cargoCapacity: data.cargoCapacity || undefined,
        availableVariants: data.availableVariants || undefined,
        availableColors: data.availableColors || undefined,
        standardFeatures: data.standardFeatures || undefined,
        optionalFeatures: data.optionalFeatures || undefined,
        basePrice: data.basePrice || undefined,
        priceRange: data.priceRange || undefined,
        serviceInterval: data.serviceInterval || undefined,
        warrantyPeriod: data.warrantyPeriod || undefined,
        spareParts: data.spareParts || undefined,
        imageUrl: data.imageUrl || undefined,
        brochureUrl: data.brochureUrl || undefined,
        isActive: data.isActive,
        isPopular: data.isPopular,
      };

      if (isEditing && id) {
        await vehicleModelService.updateVehicleModel(id, payload);
        setSnackbar({
          open: true,
          message: 'Vehicle model updated successfully',
          severity: 'success',
        });
      } else {
        await vehicleModelService.createVehicleModel(payload as CreateVehicleModelRequest);
        setSnackbar({
          open: true,
          message: 'Vehicle model created successfully',
          severity: 'success',
        });
        navigate('/vehicle-models');
      }
    } catch (error) {
      console.error('Error saving vehicle model:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} vehicle model`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/vehicle-models');
      }
    } else {
      navigate('/vehicle-models');
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const vehicleTypes = ['2-wheeler', '3-wheeler', '4-wheeler', 'Commercial'];

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="1400px" margin="0 auto">
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {isEditing ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Basic Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="oemId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.oemId}>
                          <InputLabel>Select OEM *</InputLabel>
                          <Select
                            {...field}
                            label="Select OEM *"
                            disabled={!!preselectedOemId}
                          >
                            {oems.map((oem) => (
                              <MenuItem key={oem.id} value={oem.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar src={oem.logoUrl} sx={{ width: 24, height: 24 }}>
                                    {oem.code}
                                  </Avatar>
                                  {oem.name} ({oem.code})
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.oemId && (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                              {errors.oemId.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Model Name"
                          variant="outlined"
                          fullWidth
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="displayName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Display Name"
                          variant="outlined"
                          fullWidth
                          error={!!errors.displayName}
                          helperText={errors.displayName?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="modelCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Model Code"
                          variant="outlined"
                          fullWidth
                          error={!!errors.modelCode}
                          helperText={errors.modelCode?.message}
                          required
                          inputProps={{ style: { textTransform: 'uppercase' } }}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel required>Category</InputLabel>
                          <Select
                            {...field}
                            label="Category"
                          >
                            <MenuItem value="Scooter">Scooter</MenuItem>
                            <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                            <MenuItem value="Moped">Moped</MenuItem>
                            <MenuItem value="E-Bike">E-Bike</MenuItem>
                          </Select>
                          {errors.category && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                              {errors.category.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="segment"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.segment}>
                          <InputLabel required>Segment</InputLabel>
                          <Select
                            {...field}
                            label="Segment"
                          >
                            <MenuItem value="Economy">Economy</MenuItem>
                            <MenuItem value="Premium">Premium</MenuItem>
                            <MenuItem value="Luxury">Luxury</MenuItem>
                            <MenuItem value="Sports">Sports</MenuItem>
                            <MenuItem value="Commercial">Commercial</MenuItem>
                          </Select>
                          {errors.segment && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                              {errors.segment.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="fuelType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.fuelType}>
                          <InputLabel required>Fuel Type</InputLabel>
                          <Select
                            {...field}
                            label="Fuel Type"
                          >
                            <MenuItem value="Electric">Electric</MenuItem>
                            <MenuItem value="Petrol">Petrol</MenuItem>
                            <MenuItem value="Hybrid">Hybrid</MenuItem>
                          </Select>
                          {errors.fuelType && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                              {errors.fuelType.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="vehicleType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Vehicle Type</InputLabel>
                          <Select
                            {...field}
                            label="Vehicle Type"
                          >
                            <MenuItem value="">
                              <em>Select Type</em>
                            </MenuItem>
                            {vehicleTypes.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Model Preview" />
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    src={watchedValues.imageUrl || undefined}
                    sx={{ 
                      width: 80, 
                      height: 80,
                      bgcolor: selectedOEM?.brandColor || '#1976d2',
                      mb: 2
                    }}
                  >
                    <CarIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6">
                    {watchedValues.name || 'Model Name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedOEM?.name} - {watchedValues.modelCode || 'CODE'}
                  </Typography>
                  {watchedValues.vehicleType && (
                    <Chip label={watchedValues.vehicleType} size="small" sx={{ mt: 1 }} />
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Quick Stats */}
                <Grid container spacing={2}>
                  {watchedValues.batteryCapacity && (
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <BatteryIcon color="primary" />
                        <Typography variant="caption" display="block">
                          {watchedValues.batteryCapacity} kWh
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {watchedValues.range && (
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <SpeedIcon color="primary" />
                        <Typography variant="caption" display="block">
                          {watchedValues.range} km
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            color="primary"
                          />
                        }
                        label="Active"
                      />
                    )}
                  />
                </Box>

                <Box mb={2}>
                  <Controller
                    name="isPopular"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            color="primary"
                          />
                        }
                        label="Popular Model"
                      />
                    )}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Technical Specifications */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Technical Specifications" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="batteryCapacity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Battery Capacity"
                          type="text"
                          variant="outlined"
                          fullWidth
                          placeholder="e.g., 3.2kWh"
                          error={!!errors.batteryCapacity}
                          helperText={errors.batteryCapacity?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="range"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Range"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.range}
                          helperText={errors.range?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="maxSpeed"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Max Speed"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.maxSpeed}
                          helperText={errors.maxSpeed?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">km/h</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="weight"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Weight"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.weight}
                          helperText={errors.weight?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="seatingCapacity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Seating Capacity"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.seatingCapacity}
                          helperText={errors.seatingCapacity?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="cargoCapacity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Cargo Capacity"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.cargoCapacity}
                          helperText={errors.cargoCapacity?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">L</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="dimensions"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Dimensions (L x W x H)"
                          variant="outlined"
                          fullWidth
                          error={!!errors.dimensions}
                          helperText={errors.dimensions?.message}
                          placeholder="e.g., 1800 x 650 x 1100 mm"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Pricing Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Pricing Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="basePrice"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Base Price"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.basePrice}
                          helperText={errors.basePrice?.message || (watchedValues.basePrice ? formatCurrency(watchedValues.basePrice) : '')}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="priceRange"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Price Range"
                          variant="outlined"
                          fullWidth
                          error={!!errors.priceRange}
                          helperText={errors.priceRange?.message}
                          placeholder="e.g., ₹1.2L - ₹1.5L"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Service Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Service Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="serviceInterval"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Service Interval"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.serviceInterval}
                          helperText={errors.serviceInterval?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">months</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="warrantyPeriod"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Warranty Period"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.warrantyPeriod}
                          helperText={errors.warrantyPeriod?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">months</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Features & Variants */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Features & Variants" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="availableVariants"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Available Variants"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={3}
                          error={!!errors.availableVariants}
                          helperText={errors.availableVariants?.message}
                          placeholder="e.g., Standard, DLX, Pro"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="availableColors"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Available Colors"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={3}
                          error={!!errors.availableColors}
                          helperText={errors.availableColors?.message}
                          placeholder="e.g., Red, Blue, White, Black"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="standardFeatures"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Standard Features"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={4}
                          error={!!errors.standardFeatures}
                          helperText={errors.standardFeatures?.message}
                          placeholder="List standard features..."
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="optionalFeatures"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Optional Features"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={4}
                          error={!!errors.optionalFeatures}
                          helperText={errors.optionalFeatures?.message}
                          placeholder="List optional features..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Media */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Media & Resources" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="imageUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Model Image URL"
                          variant="outlined"
                          fullWidth
                          error={!!errors.imageUrl}
                          helperText={errors.imageUrl?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="brochureUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Brochure URL"
                          variant="outlined"
                          fullWidth
                          error={!!errors.brochureUrl}
                          helperText={errors.brochureUrl?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditing ? 'Update Model' : 'Create Model'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleModelForm;
