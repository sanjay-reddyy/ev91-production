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
  IconButton,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  Divider,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { vehicleService, OEM, VehicleModel } from '../services/vehicleService';

// Validation schema
const vehicleSchema = yup.object({
  registrationNumber: yup.string().required('Registration number is required'),
  oemId: yup.string().required('OEM is required'),
  modelId: yup.string().required('Vehicle model is required'),
  variant: yup.string().optional(),
  color: yup.string().required('Color is required'),
  year: yup.number().optional().min(2000, 'Year must be 2000 or later').max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  chassisNumber: yup.string().optional(),
  engineNumber: yup.string().optional(),
  batteryCapacity: yup.number().positive('Battery capacity must be positive').optional(),
  maxRange: yup.number().positive('Range must be positive').optional(),
  maxSpeed: yup.number().positive('Max speed must be positive').optional(),
  purchaseDate: yup.date().optional().nullable().max(new Date(), 'Purchase date cannot be in the future'),
  registrationDate: yup.date().optional().nullable().max(new Date(), 'Registration date cannot be in the future'),
  purchasePrice: yup.number().positive('Purchase price must be positive').optional(),
  currentValue: yup.number().positive('Current value must be positive').optional(),
  operationalStatus: yup.string().required('Operational status is required'),
  serviceStatus: yup.string().required('Service status is required'),
  mileage: yup.number().min(0, 'Mileage cannot be negative').required('Mileage is required'),
  location: yup.string().optional(),
  fleetOperatorId: yup.string().optional(),
  rcNumber: yup.string().optional(),
  rcExpiryDate: yup.date().nullable().min(new Date(), 'RC expiry date must be in the future'),
  insuranceNumber: yup.string().optional(),
  insuranceExpiryDate: yup.date().nullable().min(new Date(), 'Insurance expiry date must be in the future'),
  insuranceProvider: yup.string().optional(),
});

type VehicleFormData = yup.InferType<typeof vehicleSchema>;

const steps = [
  'Vehicle Information & Specifications',
  'Registration & Insurance',
  'Photos & Documents',
  'Review & Submit',
];

const VehicleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [rcDocument, setRcDocument] = useState<File | null>(null);
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null);
  
  // Master data states
  const [oems, setOems] = useState<OEM[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Metadata
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableVariants, setAvailableVariants] = useState<string[]>([]);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    trigger,
  } = useForm<VehicleFormData>({
    resolver: yupResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      oemId: '',
      modelId: '',
      variant: '',
      color: '',
      year: new Date().getFullYear(),
      chassisNumber: '',
      engineNumber: '',
      batteryCapacity: undefined,
      maxRange: undefined,
      maxSpeed: undefined,
      purchaseDate: undefined,
      registrationDate: undefined,
      purchasePrice: undefined,
      currentValue: undefined,
      operationalStatus: 'Available',
      serviceStatus: 'Active',
      mileage: 0,
      location: '',
      fleetOperatorId: '',
      rcNumber: '',
      rcExpiryDate: null,
      insuranceNumber: '',
      insuranceExpiryDate: null,
      insuranceProvider: '',
    },
  });

  // Watch for OEM and model changes
  const watchedOemId = watch('oemId');
  const watchedModelId = watch('modelId');

  // Load OEMs on component mount
  useEffect(() => {
    loadOEMs();
  }, []);

  // Load vehicle models when OEM changes
  useEffect(() => {
    if (watchedOemId) {
      loadVehicleModels(watchedOemId);
    } else {
      setVehicleModels([]);
      setSelectedModel(null);
      setValue('modelId', '');
    }
  }, [watchedOemId, setValue]);

  // Load model specifications when model changes
  useEffect(() => {
    if (watchedModelId) {
      loadModelSpecs(watchedModelId);
    }
  }, [watchedModelId]);

  // Load vehicle data for editing
  useEffect(() => {
    if (isEdit && id) {
      loadVehicle();
    }
  }, [isEdit, id]);

  const loadOEMs = async () => {
    try {
      const response = await vehicleService.getOEMs({ active: true });
      setOems(response.data);
    } catch (error) {
      console.error('Error loading OEMs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load OEMs',
        severity: 'error',
      });
    }
  };

  const loadVehicleModels = async (oemId: string) => {
    setLoadingModels(true);
    try {
      const response = await vehicleService.getVehicleModelsByOEM(oemId, { active: true });
      setVehicleModels(response.data);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle models',
        severity: 'error',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const loadModelSpecs = async (modelId: string) => {
    try {
      const response = await vehicleService.getVehicleModelSpecs(modelId);
      const model = response.data;
      setSelectedModel(model);

      // Parse available colors and variants
      if (model.availableColors) {
        try {
          const colors = JSON.parse(model.availableColors);
          setAvailableColors(Array.isArray(colors) ? colors : []);
        } catch {
          setAvailableColors([]);
        }
      }

      if (model.availableVariants) {
        try {
          const variants = JSON.parse(model.availableVariants);
          setAvailableVariants(Array.isArray(variants) ? variants : []);
        } catch {
          setAvailableVariants([]);
        }
      }

      // Auto-fill specifications from model
      if (!isEdit) {
        if (model.batteryCapacity) setValue('batteryCapacity', parseFloat(model.batteryCapacity) || 0);
        if (model.range) setValue('maxRange', model.range);
        if (model.maxSpeed) setValue('maxSpeed', model.maxSpeed);
      }
    } catch (error) {
      console.error('Error loading model specs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load model specifications',
        severity: 'error',
      });
    }
  };

  const loadVehicle = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await vehicleService.getVehicle(id);
      const vehicleData = response.data;
      
      // Set OEM and model data if available
      if (vehicleData.model) {
        setSelectedModel(vehicleData.model);
        
        // Load models for the OEM
        if (vehicleData.model.oemId) {
          await loadVehicleModels(vehicleData.model.oemId);
        }
      }
      
      // Populate form with existing data with explicit type safety
      reset({
        registrationNumber: String(vehicleData.registrationNumber || ''),
        oemId: String(vehicleData.model?.oemId || ''),
        modelId: String(vehicleData.modelId || ''),
        variant: String(vehicleData.variant || ''),
        color: String(vehicleData.color || ''),
        year: Number(vehicleData.year) || new Date().getFullYear(),
        chassisNumber: String(vehicleData.chassisNumber || ''),
        engineNumber: String(vehicleData.engineNumber || ''),
        batteryCapacity: vehicleData.batteryCapacity ? Number(vehicleData.batteryCapacity) : undefined,
        maxRange: vehicleData.maxRange ? Number(vehicleData.maxRange) : undefined,
        maxSpeed: vehicleData.maxSpeed ? Number(vehicleData.maxSpeed) : undefined,
        purchaseDate: vehicleData.purchaseDate ? new Date(vehicleData.purchaseDate) : undefined,
        registrationDate: vehicleData.registrationDate ? new Date(vehicleData.registrationDate) : undefined,
        purchasePrice: vehicleData.purchasePrice ? Number(vehicleData.purchasePrice) : undefined,
        currentValue: vehicleData.currentValue ? Number(vehicleData.currentValue) : undefined,
        operationalStatus: String(vehicleData.operationalStatus || 'Available'),
        serviceStatus: String(vehicleData.serviceStatus || 'Active'),
        mileage: Number(vehicleData.mileage) || 0,
        location: String(vehicleData.location || ''),
        fleetOperatorId: String(vehicleData.fleetOperatorId || ''),
        rcNumber: String(vehicleData.rcDetails?.rcNumber || ''),
        rcExpiryDate: vehicleData.rcDetails?.validUpto ? new Date(vehicleData.rcDetails.validUpto) : null,
        insuranceNumber: String(vehicleData.insuranceDetails?.[0]?.policyNumber || ''),
        insuranceExpiryDate: vehicleData.insuranceDetails?.[0]?.policyEndDate ? new Date(vehicleData.insuranceDetails[0].policyEndDate) : null,
        insuranceProvider: String(vehicleData.insuranceDetails?.[0]?.providerName || ''),
      });
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle data. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    try {
      setLoading(true);
      
      // Prepare vehicle data for API with explicit type safety
      const vehicleData = {
        modelId: String(data.modelId),
        registrationNumber: String(data.registrationNumber),
        chassisNumber: data.chassisNumber ? String(data.chassisNumber) : undefined,
        engineNumber: data.engineNumber ? String(data.engineNumber) : undefined,
        variant: data.variant ? String(data.variant) : undefined,
        color: String(data.color),
        year: data.year ? Number(data.year) : undefined,
        batteryCapacity: data.batteryCapacity ? Number(data.batteryCapacity) : undefined,
        maxRange: data.maxRange ? Number(data.maxRange) : undefined,
        maxSpeed: data.maxSpeed ? Number(data.maxSpeed) : undefined,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        registrationDate: data.registrationDate ? new Date(data.registrationDate) : undefined,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        currentValue: data.currentValue ? Number(data.currentValue) : undefined,
        operationalStatus: String(data.operationalStatus) as 'Available' | 'Assigned' | 'Under Maintenance' | 'Retired' | 'Damaged',
        serviceStatus: String(data.serviceStatus) as 'Active' | 'Inactive' | 'Scheduled for Service',
        mileage: Number(data.mileage) || 0,
        location: data.location ? String(data.location) : undefined,
        fleetOperatorId: data.fleetOperatorId ? String(data.fleetOperatorId) : undefined,
      };
      
      let response;
      if (isEdit && id) {
        response = await vehicleService.updateVehicle(id, vehicleData);
      } else {
        response = await vehicleService.createVehicle(vehicleData);
      }

      const vehicleId = response.data.id;

      // Handle RC and Insurance details separately if provided
      if (data.rcNumber) {
        // Update RC details via separate endpoint if needed
        // For now, assuming these are handled by the main vehicle creation
      }

      if (data.insuranceNumber && data.insuranceProvider) {
        // Update insurance details via separate endpoint if needed
        // For now, assuming these are handled by the main vehicle creation
      }

      // Upload photos and documents
      if (vehiclePhotos.length > 0) {
        const photoFiles = new DataTransfer();
        vehiclePhotos.forEach(file => photoFiles.items.add(file));
        await vehicleService.uploadMedia(vehicleId, photoFiles.files, 'Vehicle Photo');
      }

      if (rcDocument) {
        const rcFiles = new DataTransfer();
        rcFiles.items.add(rcDocument);
        await vehicleService.uploadMedia(vehicleId, rcFiles.files, 'RC Document');
      }

      if (insuranceDocument) {
        const insuranceFiles = new DataTransfer();
        insuranceFiles.items.add(insuranceDocument);
        await vehicleService.uploadMedia(vehicleId, insuranceFiles.files, 'Insurance Document');
      }

      setSnackbar({
        open: true,
        message: `Vehicle ${isEdit ? 'updated' : 'created'} successfully`,
        severity: 'success',
      });

      // Navigate back to vehicle details or list
      setTimeout(() => {
        navigate(isEdit ? `/vehicles/${vehicleId}` : '/vehicles');
      }, 1500);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEdit ? 'update' : 'create'} vehicle. Please try again.`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);
    const isStepValid = await trigger(currentStepFields);
    
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the current step before proceeding.',
        severity: 'error',
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Helper function to get fields for each step
  const getStepFields = (step: number): (keyof VehicleFormData)[] => {
    switch (step) {
      case 0: // Vehicle Information (Basic + Technical combined)
        return ['registrationNumber', 'oemId', 'modelId', 'color', 'year', 'chassisNumber', 'engineNumber', 'variant', 'batteryCapacity', 'maxRange', 'maxSpeed'];
      case 1: // Registration & Insurance
        return ['purchaseDate', 'registrationDate', 'purchasePrice', 'currentValue', 'rcNumber', 'rcExpiryDate', 'insuranceNumber', 'insuranceExpiryDate', 'insuranceProvider', 'location', 'mileage'];
      case 2: // Photos & Documents (no form validation needed for file uploads)
        return [];
      case 3: // Review & Submit (no validation needed)
        return [];
      default:
        return [];
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'vehicle' | 'rc' | 'insurance'
  ) => {
    const files = event.target.files;
    if (!files) return;

    if (type === 'vehicle') {
      setVehiclePhotos(Array.from(files));
    } else if (type === 'rc') {
      setRcDocument(files[0]);
    } else if (type === 'insurance') {
      setInsuranceDocument(files[0]);
    }
  };

  const removeFile = (type: 'vehicle' | 'rc' | 'insurance', index?: number) => {
    if (type === 'vehicle' && index !== undefined) {
      setVehiclePhotos(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'rc') {
      setRcDocument(null);
    } else if (type === 'insurance') {
      setInsuranceDocument(null);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="registrationNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Registration Number"
                    error={!!errors.registrationNumber}
                    helperText={errors.registrationNumber?.message}
                    placeholder="e.g., KA01AB1234"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="oemId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={oems}
                    getOptionLabel={(option) => option.displayName || option.name}
                    value={oems.find(oem => oem.id === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="OEM / Brand"
                        error={!!errors.oemId}
                        helperText={errors.oemId?.message}
                        placeholder="Select OEM"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.logoUrl && (
                          <Box
                            component="img"
                            src={option.logoUrl}
                            alt={option.name}
                            sx={{ width: 24, height: 24 }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2">{option.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.code} • {option.country}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="modelId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={vehicleModels}
                    getOptionLabel={(option) => option.displayName || option.name}
                    value={vehicleModels.find(model => model.id === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '');
                    }}
                    disabled={!watchedOemId || loadingModels}
                    loading={loadingModels}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Vehicle Model"
                        error={!!errors.modelId}
                        helperText={errors.modelId?.message}
                        placeholder={!watchedOemId ? "Select OEM first" : "Select Model"}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingModels ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">{option.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.category} • {option.fuelType} • {option.modelCode}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={availableColors.length > 0 ? availableColors : ['Red', 'Blue', 'White', 'Black', 'Silver', 'Grey']}
                    freeSolo
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={(_, newValue) => {
                      const stringValue = typeof newValue === 'string' ? newValue : '';
                      field.onChange(stringValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Color"
                        error={!!errors.color}
                        helperText={errors.color?.message}
                        placeholder="Select or enter color"
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {availableVariants.length > 0 && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="variant"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Variant</InputLabel>
                      <Select {...field}>
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {availableVariants.map((variant) => (
                          <MenuItem key={variant} value={variant}>
                            {variant}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Manufacturing Year"
                    type="number"
                    error={!!errors.year}
                    helperText={errors.year?.message}
                    InputProps={{
                      inputProps: { 
                        min: 2000, 
                        max: new Date().getFullYear() + 1 
                      }
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="chassisNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Chassis Number"
                    error={!!errors.chassisNumber}
                    helperText={errors.chassisNumber?.message}
                    placeholder="Optional"
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={(e) => field.onChange(e.target.value || '')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="engineNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Engine Number"
                    error={!!errors.engineNumber}
                    helperText={errors.engineNumber?.message}
                    placeholder="Optional for electric vehicles"
                  />
                )}
              />
            </Grid>

            {selectedModel && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Model Specifications Auto-filled:
                  </Typography>
                  <Typography variant="body2">
                    {selectedModel.vehicleType} • {selectedModel.fuelType} • 
                    {selectedModel.range && ` ${selectedModel.range}km range`} • 
                    {selectedModel.maxSpeed && ` ${selectedModel.maxSpeed}km/h max speed`} •
                    {selectedModel.batteryCapacity && ` ${selectedModel.batteryCapacity} battery`}
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Technical Specifications */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Technical Specifications</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="variant"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={availableVariants}
                    value={field.value || ''}
                    onChange={(_, newValue) => field.onChange(newValue || '')}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Variant"
                        error={!!errors.variant}
                        helperText={errors.variant?.message}
                        placeholder="Select or enter variant"
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="batteryCapacity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Battery Capacity"
                    type="number"
                    error={!!errors.batteryCapacity}
                    helperText={errors.batteryCapacity?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">kWh</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="maxRange"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Range"
                    type="number"
                    error={!!errors.maxRange}
                    helperText={errors.maxRange?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="maxSpeed"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Max Speed"
                    type="number"
                    error={!!errors.maxSpeed}
                    helperText={errors.maxSpeed?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km/h</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Registration & Insurance Information</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="registrationDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Registration Date"
                    type="date"
                    error={!!errors.registrationDate}
                    helperText={errors.registrationDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rcNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Number"
                    error={!!errors.rcNumber}
                    helperText={errors.rcNumber?.message}
                    placeholder="e.g., KA01AB1234567890"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rcExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Expiry Date"
                    type="date"
                    error={!!errors.rcExpiryDate}
                    helperText={errors.rcExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Policy Number"
                    error={!!errors.insuranceNumber}
                    helperText={errors.insuranceNumber?.message}
                    placeholder="Enter policy number"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceProvider"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Provider"
                    error={!!errors.insuranceProvider}
                    helperText={errors.insuranceProvider?.message}
                    placeholder="e.g., HDFC ERGO, ICICI Lombard"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Expiry Date"
                    type="date"
                    error={!!errors.insuranceExpiryDate}
                    helperText={errors.insuranceExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Location"
                    error={!!errors.location}
                    helperText={errors.location?.message}
                    placeholder="e.g., Delhi Hub, Mumbai Depot"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="mileage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Mileage (km)"
                    type="number"
                    error={!!errors.mileage}
                    helperText={errors.mileage?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Registration Certificate (RC)</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="rcNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Number"
                    error={!!errors.rcNumber}
                    helperText={errors.rcNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rcExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Expiry Date"
                    type="date"
                    error={!!errors.rcExpiryDate}
                    helperText={errors.rcExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Insurance Details</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Number"
                    error={!!errors.insuranceNumber}
                    helperText={errors.insuranceNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceProvider"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Provider"
                    error={!!errors.insuranceProvider}
                    helperText={errors.insuranceProvider?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Expiry Date"
                    type="date"
                    error={!!errors.insuranceExpiryDate}
                    helperText={errors.insuranceExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Registration & Insurance Information</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Purchase Date"
                    type="date"
                    error={!!errors.purchaseDate}
                    helperText={errors.purchaseDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="registrationDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Registration Date"
                    type="date"
                    error={!!errors.registrationDate}
                    helperText={errors.registrationDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="purchasePrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Purchase Price (₹)"
                    type="number"
                    error={!!errors.purchasePrice}
                    helperText={errors.purchasePrice?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="currentValue"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Value (₹)"
                    type="number"
                    error={!!errors.currentValue}
                    helperText={errors.currentValue?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rcNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Number"
                    error={!!errors.rcNumber}
                    helperText={errors.rcNumber?.message}
                    placeholder="e.g., KA01AB1234567890"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rcExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="RC Expiry Date"
                    type="date"
                    error={!!errors.rcExpiryDate}
                    helperText={errors.rcExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Policy Number"
                    error={!!errors.insuranceNumber}
                    helperText={errors.insuranceNumber?.message}
                    placeholder="Enter policy number"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceProvider"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Provider"
                    error={!!errors.insuranceProvider}
                    helperText={errors.insuranceProvider?.message}
                    placeholder="e.g., HDFC ERGO, ICICI Lombard"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="insuranceExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Insurance Expiry Date"
                    type="date"
                    error={!!errors.insuranceExpiryDate}
                    helperText={errors.insuranceExpiryDate?.message}
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Location"
                    error={!!errors.location}
                    helperText={errors.location?.message}
                    placeholder="e.g., Delhi Hub, Mumbai Depot"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="mileage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Mileage (km)"
                    type="number"
                    error={!!errors.mileage}
                    helperText={errors.mileage?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Vehicle Photos</Typography>
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="vehicle-photos"
                  multiple
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'vehicle')}
                />
                <label htmlFor="vehicle-photos">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoIcon />}
                    fullWidth
                  >
                    Upload Vehicle Photos
                  </Button>
                </label>
                
                {vehiclePhotos.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {vehiclePhotos.length} photo(s) selected:
                    </Typography>
                    {vehiclePhotos.map((file, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2">{file.name}</Typography>
                        <IconButton size="small" onClick={() => removeFile('vehicle', index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>RC Document</Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <input
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  id="rc-document"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'rc')}
                />
                <label htmlFor="rc-document">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<DocumentIcon />}
                    fullWidth
                  >
                    Upload RC Document
                  </Button>
                </label>
                
                {rcDocument && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2">{rcDocument.name}</Typography>
                    <IconButton size="small" onClick={() => removeFile('rc')}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Insurance Document</Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <input
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  id="insurance-document"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'insurance')}
                />
                <label htmlFor="insurance-document">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<DocumentIcon />}
                    fullWidth
                  >
                    Upload Insurance Document
                  </Button>
                </label>
                
                {insuranceDocument && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2">{insuranceDocument.name}</Typography>
                    <IconButton size="small" onClick={() => removeFile('insurance')}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        );

      case 3:
        const formValues = watch();
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Review Vehicle Information</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review all the information below before submitting.
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Registration:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.registrationNumber}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">OEM:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedModel?.oem?.name || oems.find(oem => oem.id === formValues.oemId)?.name || 'Not selected'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Model:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedModel?.name || vehicleModels.find(model => model.id === formValues.modelId)?.name || 'Not selected'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Color:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.color}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Battery:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.batteryCapacity || 0} kWh</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Range:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.maxRange || 0} km</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Registration & Insurance
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">RC Number:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.rcNumber}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Insurance:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.insuranceNumber}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Provider:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.insuranceProvider}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Location:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.location}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">{formValues.operationalStatus}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Uploaded Files
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Vehicle Photos:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {vehiclePhotos.length} file(s) selected
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">RC Document:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {rcDocument ? 'Uploaded' : 'Not uploaded'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Insurance Document:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {insuranceDocument ? 'Uploaded' : 'Not uploaded'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Ready to Submit?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Please review all the information above. Once submitted, the vehicle will be added to your inventory.
                  </Typography>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? 'Saving...' : (isEdit ? 'Update Vehicle' : 'Create Vehicle')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/vehicles')} size="large">
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
        </Typography>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((label, index) => {
              const stepFields = getStepFields(index);
              const hasErrors = stepFields.some(field => errors[field]);
              
              return (
                <Step key={label}>
                  <StepLabel 
                    error={hasErrors}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: hasErrors ? 'error.main' : 'inherit',
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            {renderStepContent(activeStep)}
          </CardContent>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (isEdit ? 'Update Vehicle' : 'Create Vehicle')}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleFormPage;
