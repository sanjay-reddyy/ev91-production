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
  FormHelperText,
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
  purchaseDate: yup.date().optional().nullable(),
  registrationDate: yup.date().optional().nullable(),
  purchasePrice: yup.number().positive('Purchase price must be positive').optional(),
  currentValue: yup.number().positive('Current value must be positive').optional(),
  operationalStatus: yup.string().required('Operational status is required'),
  serviceStatus: yup.string().required('Service status is required'),
  mileage: yup.number().min(0, 'Mileage cannot be negative').required('Mileage is required'),
  location: yup.string().optional(),
  fleetOperatorId: yup.string().optional(),
  // RC Details
  rcNumber: yup.string().optional(),
  rcExpiryDate: yup.date().nullable().optional(),
  ownerName: yup.string().optional(),
  ownerAddress: yup.string().optional(),
  seatingCapacity: yup.number().positive('Seating capacity must be positive').optional(),
  // Insurance Details
  insuranceNumber: yup.string().optional(),
  insuranceExpiryDate: yup.date().nullable().optional(),
  insuranceProvider: yup.string().optional(),
  insuranceType: yup.string().optional(),
  premiumAmount: yup.number().min(0, 'Premium amount cannot be negative').optional(),
  coverageAmount: yup.number().min(0, 'Coverage amount cannot be negative').optional(),
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
      // RC Details
      rcNumber: '',
      rcExpiryDate: null,
      ownerName: '',
      ownerAddress: '',
      seatingCapacity: undefined,
      // Insurance Details
      insuranceNumber: '',
      insuranceExpiryDate: null,
      insuranceProvider: '',
      insuranceType: 'Comprehensive',
      premiumAmount: undefined,
      coverageAmount: undefined,
    },
  });

  // Watch for OEM and model changes
  const watchedOemId = watch('oemId');
  const watchedModelId = watch('modelId');

  // Debug: Watch purchase/registration fields
  const watchedPurchaseDate = watch('purchaseDate');
  const watchedRegistrationDate = watch('registrationDate');
  const watchedPurchasePrice = watch('purchasePrice');
  const watchedCurrentValue = watch('currentValue');
  const watchedLocation = watch('location');
  const watchedMileage = watch('mileage');

  // Debug effect to log form changes
  React.useEffect(() => {
    if (isEdit) {
      console.log('🔍 Form values changed:', {
        purchaseDate: watchedPurchaseDate,
        registrationDate: watchedRegistrationDate,
        purchasePrice: watchedPurchasePrice,
        currentValue: watchedCurrentValue,
        location: watchedLocation,
        mileage: watchedMileage
      });
    }
  }, [watchedPurchaseDate, watchedRegistrationDate, watchedPurchasePrice, watchedCurrentValue, watchedLocation, watchedMileage, isEdit]);

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
      const formData = {
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
        // RC Details
        rcNumber: String(vehicleData.rcDetails?.rcNumber || ''),
        rcExpiryDate: vehicleData.rcDetails?.validUpto ? new Date(vehicleData.rcDetails.validUpto) : null,
        ownerName: String(vehicleData.rcDetails?.ownerName || ''),
        ownerAddress: String(vehicleData.rcDetails?.ownerAddress || ''),
        seatingCapacity: vehicleData.rcDetails?.seatingCapacity ? Number(vehicleData.rcDetails.seatingCapacity) : undefined,
        // Insurance Details
        insuranceNumber: String(vehicleData.insuranceDetails?.[0]?.policyNumber || ''),
        insuranceExpiryDate: vehicleData.insuranceDetails?.[0]?.policyEndDate ? new Date(vehicleData.insuranceDetails[0].policyEndDate) : null,
        insuranceProvider: String(vehicleData.insuranceDetails?.[0]?.providerName || ''),
        insuranceType: String(vehicleData.insuranceDetails?.[0]?.insuranceType || 'Comprehensive'),
        premiumAmount: vehicleData.insuranceDetails?.[0]?.premiumAmount ? Number(vehicleData.insuranceDetails[0].premiumAmount) : undefined,
        coverageAmount: vehicleData.insuranceDetails?.[0]?.coverageAmount ? Number(vehicleData.insuranceDetails[0].coverageAmount) : undefined,
      };

      // Debug: Log the form data being set
      console.log('🔍 Setting form data:', {
        purchaseDate: formData.purchaseDate,
        registrationDate: formData.registrationDate,
        purchasePrice: formData.purchasePrice,
        currentValue: formData.currentValue,
        location: formData.location,
        mileage: formData.mileage
      });

      reset(formData);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle data',
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
        message: `Vehicle ${isEdit ? 'updated' : 'created'} successfully!`,
        severity: 'success',
      });

      // Navigate back to vehicle list after successful submission
      setTimeout(() => {
        navigate('/vehicles');
      }, 2000);

    } catch (error) {
      console.error('Error submitting vehicle:', error);
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
      case 0: // Vehicle Information & Specifications (Combined)
        return ['registrationNumber', 'oemId', 'modelId', 'color', 'year', 'chassisNumber', 'engineNumber', 'variant', 'batteryCapacity', 'maxRange', 'maxSpeed'];
      case 1: // Registration & Insurance (Comprehensive)
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

  // CLEAN SINGLE RENDER FUNCTION - NO DUPLICATES
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Vehicle Information & Specifications (Combined)
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
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
                      />
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
                    options={vehicleModels}
                    getOptionLabel={(option) => option.displayName || option.name}
                    value={vehicleModels.find(model => model.id === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '');
                    }}
                    loading={loadingModels}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Vehicle Model"
                        error={!!errors.modelId}
                        helperText={errors.modelId?.message}
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

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Technical Specifications</Typography>
              <Divider sx={{ mb: 2 }} />
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

            <Grid item xs={12} md={4}>
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
                      inputProps: { min: 0, step: 0.1 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="maxRange"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Max Range"
                    type="number"
                    error={!!errors.maxRange}
                    helperText={errors.maxRange?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
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
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
          </Grid>
        );

      case 1: // Registration & Insurance (Comprehensive - THE FORM WITH MORE FIELDS)
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Purchase & Registration Information</Typography>
              <Divider sx={{ mb: 2 }} />
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
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                    label="Purchase Price"
                    type="number"
                    error={!!errors.purchasePrice}
                    helperText={errors.purchasePrice?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
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
                    label="Current Value"
                    type="number"
                    error={!!errors.currentValue}
                    helperText={errors.currentValue?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>RC (Registration Certificate) Details</Typography>
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
                    placeholder="Optional"
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
                name="ownerName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Owner Name"
                    error={!!errors.ownerName}
                    helperText={errors.ownerName?.message}
                    placeholder="e.g., Fleet Operator Name"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="seatingCapacity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Seating Capacity"
                    type="number"
                    error={!!errors.seatingCapacity}
                    helperText={errors.seatingCapacity?.message}
                    InputProps={{
                      inputProps: { min: 1, max: 50 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="ownerAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Owner Address"
                    multiline
                    rows={2}
                    error={!!errors.ownerAddress}
                    helperText={errors.ownerAddress?.message}
                    placeholder="Complete address as per RC"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Insurance Details</Typography>
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
                    label="Insurance Policy Number"
                    error={!!errors.insuranceNumber}
                    helperText={errors.insuranceNumber?.message}
                    placeholder="Optional"
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
                name="insuranceType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.insuranceType}>
                    <InputLabel>Insurance Type</InputLabel>
                    <Select
                      {...field}
                      label="Insurance Type"
                    >
                      <MenuItem value="Comprehensive">Comprehensive</MenuItem>
                      <MenuItem value="Third Party">Third Party</MenuItem>
                      <MenuItem value="Own Damage">Own Damage</MenuItem>
                    </Select>
                    {errors.insuranceType && (
                      <FormHelperText>{errors.insuranceType.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="premiumAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Premium Amount"
                    type="number"
                    error={!!errors.premiumAmount}
                    helperText={errors.premiumAmount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="coverageAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Coverage Amount"
                    type="number"
                    error={!!errors.coverageAmount}
                    helperText={errors.coverageAmount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Operational Details</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Vehicle Location"
                    error={!!errors.location}
                    helperText={errors.location?.message}
                    placeholder="e.g., Depot A, Hub 1, Warehouse"
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
                    label="Current Mileage"
                    type="number"
                    error={!!errors.mileage}
                    helperText={errors.mileage?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2: // Photos & Documents
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Photos & Documents</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Vehicle Photos */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Vehicle Photos</Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="vehicle-photos-upload"
                multiple
                type="file"
                onChange={(e) => handleFileUpload(e, 'vehicle')}
              />
              <label htmlFor="vehicle-photos-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload Vehicle Photos
                </Button>
              </label>
              {vehiclePhotos.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {vehiclePhotos.map((file, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <Typography variant="caption" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        {file.name}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -8, right: -8 }}
                        onClick={() => removeFile('vehicle', index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>

            {/* RC Document */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>RC Document</Typography>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="rc-document-upload"
                type="file"
                onChange={(e) => handleFileUpload(e, 'rc')}
              />
              <label htmlFor="rc-document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<DocumentIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload RC Document
                </Button>
              </label>
              {rcDocument && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption">{rcDocument.name}</Typography>
                  <IconButton size="small" onClick={() => removeFile('rc')}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Grid>

            {/* Insurance Document */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Insurance Document</Typography>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="insurance-document-upload"
                type="file"
                onChange={(e) => handleFileUpload(e, 'insurance')}
              />
              <label htmlFor="insurance-document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<DocumentIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload Insurance Document
                </Button>
              </label>
              {insuranceDocument && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption">{insuranceDocument.name}</Typography>
                  <IconButton size="small" onClick={() => removeFile('insurance')}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Review & Submit</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review all the information below before submitting.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Vehicle Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Registration:</strong> {watch('registrationNumber') || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>OEM:</strong> {oems.find(o => o.id === watch('oemId'))?.displayName || 'Not selected'}</Typography>
                      <Typography variant="body2"><strong>Model:</strong> {vehicleModels.find(m => m.id === watch('modelId'))?.displayName || 'Not selected'}</Typography>
                      <Typography variant="body2"><strong>Color:</strong> {watch('color') || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Year:</strong> {watch('year') || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Chassis Number:</strong> {watch('chassisNumber') || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Engine Number:</strong> {watch('engineNumber') || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Battery Capacity:</strong> {watch('batteryCapacity') ? `${watch('batteryCapacity')} kWh` : 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Max Range:</strong> {watch('maxRange') ? `${watch('maxRange')} km` : 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Max Speed:</strong> {watch('maxSpeed') ? `${watch('maxSpeed')} km/h` : 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
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
        </Card>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
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
      </form>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleFormPage;
