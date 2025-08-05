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
  AutoFixHigh as GenerateIcon,
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

  // Debug: Watch for step changes
  React.useEffect(() => {
    console.log('📍 Active step changed to:', activeStep);
  }, [activeStep]);

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
      
      // Debug: Log raw form data first
      console.log('🚀 Raw form data received in onSubmit:', JSON.stringify(data, null, 2));
      
      // Prepare vehicle data for API with explicit type safety
      const vehicleData = {
        modelId: String(data.modelId),
        registrationNumber: String(data.registrationNumber),
        chassisNumber: data.chassisNumber && data.chassisNumber.trim() ? String(data.chassisNumber.trim()) : undefined,
        engineNumber: data.engineNumber && data.engineNumber.trim() ? String(data.engineNumber.trim()) : undefined,
        variant: data.variant && data.variant.trim() ? String(data.variant.trim()) : undefined,
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
        location: data.location && data.location.trim() ? String(data.location.trim()) : undefined,
        fleetOperatorId: data.fleetOperatorId && data.fleetOperatorId.trim() ? String(data.fleetOperatorId.trim()) : undefined,
        // RC Details
        rcNumber: data.rcNumber && data.rcNumber.trim() ? String(data.rcNumber.trim()) : undefined,
        rcExpiryDate: data.rcExpiryDate ? new Date(data.rcExpiryDate) : undefined,
        ownerName: data.ownerName && data.ownerName.trim() ? String(data.ownerName.trim()) : undefined,
        ownerAddress: data.ownerAddress && data.ownerAddress.trim() ? String(data.ownerAddress.trim()) : undefined,
        seatingCapacity: data.seatingCapacity ? Number(data.seatingCapacity) : undefined,
        // Insurance Details
        insuranceNumber: data.insuranceNumber && data.insuranceNumber.trim() ? String(data.insuranceNumber.trim()) : undefined,
        insuranceProvider: data.insuranceProvider && data.insuranceProvider.trim() ? String(data.insuranceProvider.trim()) : undefined,
        insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : undefined,
        insuranceType: data.insuranceType ? String(data.insuranceType) : undefined,
        premiumAmount: data.premiumAmount ? Number(data.premiumAmount) : undefined,
        coverageAmount: data.coverageAmount ? Number(data.coverageAmount) : undefined,
      };

      // Debug: Log the payload being sent to API
      console.log('🚀 Sending vehicle data to API:', JSON.stringify(vehicleData, null, 2));
      
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

    } catch (error: any) {
      console.error('Error submitting vehicle:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} vehicle. Please try again.`;
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        errorMessage = 'A vehicle with this registration number already exists. Please use a different registration number.';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response?.data?.error || error.response?.data?.message || 'Invalid data provided'}`;
      } else if (error.response?.status === 500) {
        errorMessage = `Server error: ${error.response?.data?.error || error.response?.data?.message || 'Internal server error'}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    console.log('🔍 handleNext called, current step:', activeStep);
    
    // Get current form values for debugging
    const currentValues = watch();
    console.log('📋 Current form values before validation:', {
      step: activeStep,
      values: {
        // Step 0 fields
        registrationNumber: currentValues.registrationNumber,
        year: currentValues.year,
        chassisNumber: currentValues.chassisNumber,
        engineNumber: currentValues.engineNumber,
        // Step 1 fields  
        rcNumber: currentValues.rcNumber,
        ownerName: currentValues.ownerName,
        ownerAddress: currentValues.ownerAddress,
        insuranceNumber: currentValues.insuranceNumber
      }
    });
    
    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);
    console.log('✅ Validating fields for step', activeStep, ':', currentStepFields);
    
    const isStepValid = await trigger(currentStepFields);
    
    if (isStepValid) {
      console.log('✅ Step validation passed, moving to next step');
      
      // Log form values after validation but before step change
      const valuesAfterValidation = watch();
      console.log('📋 Form values after validation:', {
        step: activeStep,
        values: {
          // Step 0 fields
          registrationNumber: valuesAfterValidation.registrationNumber,
          year: valuesAfterValidation.year,
          chassisNumber: valuesAfterValidation.chassisNumber,
          engineNumber: valuesAfterValidation.engineNumber,
          // Step 1 fields  
          rcNumber: valuesAfterValidation.rcNumber,
          ownerName: valuesAfterValidation.ownerName,
          ownerAddress: valuesAfterValidation.ownerAddress,
          insuranceNumber: valuesAfterValidation.insuranceNumber
        }
      });
      
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      
      // Log form values after step change
      setTimeout(() => {
        const valuesAfterStepChange = watch();
        console.log('📋 Form values after step change to', activeStep + 1, ':', {
          values: {
            // Step 0 fields
            registrationNumber: valuesAfterStepChange.registrationNumber,
            year: valuesAfterStepChange.year,
            chassisNumber: valuesAfterStepChange.chassisNumber,
            engineNumber: valuesAfterStepChange.engineNumber,
            // Step 1 fields  
            rcNumber: valuesAfterStepChange.rcNumber,
            ownerName: valuesAfterStepChange.ownerName,
            ownerAddress: valuesAfterStepChange.ownerAddress,
            insuranceNumber: valuesAfterStepChange.insuranceNumber
          }
        });
      }, 100);
      
    } else {
      console.log('❌ Step validation failed');
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the current step before proceeding.',
        severity: 'error',
      });
    }
  };

  const handleBack = () => {
    console.log('🔙 handleBack called, current step:', activeStep);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Helper function to get fields for each step
  const getStepFields = (step: number): (keyof VehicleFormData)[] => {
    switch (step) {
      case 0: // Vehicle Information & Specifications (Combined)
        return [
          'registrationNumber', 'oemId', 'modelId', 'color', 'year', 
          'chassisNumber', 'engineNumber', 'variant', 'batteryCapacity', 
          'maxRange', 'maxSpeed'
        ];
      case 1: // Registration & Insurance (Comprehensive)
        return [
          'purchaseDate', 'registrationDate', 'purchasePrice', 'currentValue', 
          'rcNumber', 'rcExpiryDate', 'ownerName', 'ownerAddress', 'seatingCapacity',
          'insuranceNumber', 'insuranceExpiryDate', 'insuranceProvider', 
          'insuranceType', 'premiumAmount', 'coverageAmount', 'location', 'mileage'
        ];
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

  const handleGenerateRegistrationNumber = async () => {
    try {
      // For now, generate a simple random registration number
      // The backend will handle duplicate validation
      const states = ['DL', 'MH', 'KA', 'TN', 'AP', 'TG', 'GJ', 'RJ', 'UP', 'WB'];
      const randomState = states[Math.floor(Math.random() * states.length)];
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      const paddedNum = randomNum.toString().padStart(4, '0');
      
      const regNumber = `${randomState}01AB${paddedNum}`;
      setValue('registrationNumber', regNumber);
      setSnackbar({
        open: true,
        message: 'Generated registration number',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to generate registration number:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate registration number',
        severity: 'error'
      });
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleGenerateRegistrationNumber}
                            edge="end"
                            title="Generate unique registration number"
                            size="small"
                            type="button"
                          >
                            <GenerateIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
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
                    fullWidth
                    label="Battery Capacity"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.batteryCapacity}
                    helperText={errors.batteryCapacity?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">kWh</InputAdornment>,
                      inputProps: { min: 0, step: 0.1 }
                    }}
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
                    fullWidth
                    label="Max Range"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    error={!!errors.maxRange}
                    helperText={errors.maxRange?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
                    fullWidth
                    label="Max Speed"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    error={!!errors.maxSpeed}
                    helperText={errors.maxSpeed?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km/h</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.purchasePrice}
                    helperText={errors.purchasePrice?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
                    fullWidth
                    label="Current Value"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.currentValue}
                    helperText={errors.currentValue?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
                    fullWidth
                    label="Seating Capacity"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    error={!!errors.seatingCapacity}
                    helperText={errors.seatingCapacity?.message}
                    InputProps={{
                      inputProps: { min: 1, max: 50 }
                    }}
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
                    fullWidth
                    label="Premium Amount"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.premiumAmount}
                    helperText={errors.premiumAmount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
                    fullWidth
                    label="Coverage Amount"
                    type="number"
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.coverageAmount}
                    helperText={errors.coverageAmount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
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
        const formData = watch();
        const requiredFieldsComplete = {
          basic: !!(formData.registrationNumber && formData.oemId && formData.modelId && formData.color),
          purchase: !!(formData.purchaseDate && formData.registrationDate && formData.purchasePrice && formData.currentValue),
          rc: !!(formData.rcNumber && formData.ownerName),
          insurance: !!(formData.insuranceNumber && formData.insuranceProvider && formData.insuranceExpiryDate)
        };
        
        const completionPercentage = Math.round(
          (Object.values(requiredFieldsComplete).filter(Boolean).length / Object.keys(requiredFieldsComplete).length) * 100
        );

        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Review & Submit</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review all the information below before submitting.
              </Typography>
            </Grid>

            {/* Completion Status */}
            <Grid item xs={12}>
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  bgcolor: completionPercentage >= 75 ? 'success.50' : completionPercentage >= 50 ? 'warning.50' : 'error.50',
                  borderColor: completionPercentage >= 75 ? 'success.main' : completionPercentage >= 50 ? 'warning.main' : 'error.main'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" color={completionPercentage >= 75 ? 'success.main' : completionPercentage >= 50 ? 'warning.main' : 'error.main'}>
                      Form Completion: {completionPercentage}%
                    </Typography>
                    <Box sx={{ 
                      minWidth: 35,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {completionPercentage >= 75 ? '✅' : completionPercentage >= 50 ? '⚠️' : '❌'}
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {requiredFieldsComplete.basic ? '✅' : '❌'}
                        <Typography variant="body2">Basic Info</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {requiredFieldsComplete.purchase ? '✅' : '❌'}
                        <Typography variant="body2">Purchase Details</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {requiredFieldsComplete.rc ? '✅' : '❌'}
                        <Typography variant="body2">RC Details</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {requiredFieldsComplete.insurance ? '✅' : '❌'}
                        <Typography variant="body2">Insurance Details</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Vehicle Information Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main' 
                      }} />
                      Vehicle Information
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Registration Number</Typography>
                        <Typography variant="body1" fontWeight="medium" color={watch('registrationNumber') ? 'text.primary' : 'error.main'}>
                          {watch('registrationNumber') || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">OEM / Brand</Typography>
                        <Typography variant="body1" fontWeight="medium" color={watch('oemId') ? 'text.primary' : 'error.main'}>
                          {oems.find(o => o.id === watch('oemId'))?.displayName || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Vehicle Model</Typography>
                        <Typography variant="body1" fontWeight="medium" color={watch('modelId') ? 'text.primary' : 'error.main'}>
                          {vehicleModels.find(m => m.id === watch('modelId'))?.displayName || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Color</Typography>
                        <Typography variant="body1" fontWeight="medium" color={watch('color') ? 'text.primary' : 'error.main'}>
                          {watch('color') || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Manufacturing Year</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('year') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Variant</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('variant') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Chassis Number</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('chassisNumber') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Engine Number</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('engineNumber') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Technical Specifications Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'secondary.main' 
                    }} />
                    Technical Specifications
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Battery Capacity</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('batteryCapacity') ? `${watch('batteryCapacity')} kWh` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Max Range</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('maxRange') ? `${watch('maxRange')} km` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Max Speed</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('maxSpeed') ? `${watch('maxSpeed')} km/h` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Purchase & Registration Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} />
                      Purchase & Registration
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('purchaseDate') ? new Date(watch('purchaseDate') as string | number | Date).toLocaleDateString() : <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('registrationDate') ? new Date(watch('registrationDate') as string | number | Date).toLocaleDateString() : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Purchase Price</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('purchasePrice') ? `₹${(watch('purchasePrice') as number).toLocaleString()}` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('currentValue') ? `₹${(watch('currentValue') as number).toLocaleString()}` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* RC Details Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'info.main' 
                      }} />
                      RC (Registration Certificate) Details
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">RC Number</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('rcNumber') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">RC Expiry Date</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('rcExpiryDate') ? new Date(watch('rcExpiryDate') as string | number | Date).toLocaleDateString() : <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Seating Capacity</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('seatingCapacity') ? `${watch('seatingCapacity')} persons` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Owner Name</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('ownerName') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Owner Address</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                          {watch('ownerAddress') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Insurance Details Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'warning.main' 
                      }} />
                      Insurance Details
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Policy Number</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('insuranceNumber') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Insurance Provider</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('insuranceProvider') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Insurance Type</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('insuranceType') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('insuranceExpiryDate') ? new Date(watch('insuranceExpiryDate') as string | number | Date).toLocaleDateString() : <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Premium Amount</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('premiumAmount') ? `₹${(watch('premiumAmount') as number).toLocaleString()}` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Coverage Amount</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('coverageAmount') ? `₹${(watch('coverageAmount') as number).toLocaleString()}` : <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Operational Details Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'text.primary' 
                    }} />
                    Operational Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Location</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('location') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Mileage</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('mileage') ? `${watch('mileage')} km` : '0 km'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Fleet Operator ID</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {watch('fleetOperatorId') || <em>Not specified</em>}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Documents & Photos Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'text.primary' 
                      }} />
                      Documents & Media
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveStep(2)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Vehicle Photos</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {vehiclePhotos.length > 0 ? (
                            <Box>
                              <Typography component="span" color="success.main">
                                {vehiclePhotos.length} photo{vehiclePhotos.length !== 1 ? 's' : ''} selected
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {vehiclePhotos.map((file, index) => (
                                  <Typography key={index} variant="caption" display="block" color="text.secondary">
                                    {file.name}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          ) : (
                            <em>No photos uploaded</em>
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">RC Document</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {rcDocument ? (
                            <Box>
                              <Typography component="span" color="success.main">
                                Document uploaded
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {rcDocument.name}
                              </Typography>
                            </Box>
                          ) : (
                            <em>No document uploaded</em>
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Insurance Document</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {insuranceDocument ? (
                            <Box>
                              <Typography component="span" color="success.main">
                                Document uploaded
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {insuranceDocument.name}
                              </Typography>
                            </Box>
                          ) : (
                            <em>No document uploaded</em>
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Card 
                variant="outlined" 
                sx={{ 
                  bgcolor: completionPercentage >= 75 ? 'primary.50' : 'warning.50', 
                  border: '2px solid', 
                  borderColor: completionPercentage >= 75 ? 'primary.main' : 'warning.main'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color={completionPercentage >= 75 ? 'primary.main' : 'warning.main'}>
                    {completionPercentage >= 75 ? 'Ready to Submit!' : 'Missing Required Information'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {completionPercentage >= 75 
                      ? 'All required information has been provided. You can now create the vehicle record.'
                      : 'Please complete the required fields marked with ⚠️ before submitting.'
                    }
                  </Typography>
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading || completionPercentage < 50}
                    color={completionPercentage >= 75 ? 'primary' : 'warning'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚀 Submit button clicked in preview');
                      handleSubmit(onSubmit)(e);
                    }}
                    sx={{ 
                      minWidth: 250,
                      height: 48,
                      fontSize: '1.1rem'
                    }}
                  >
                    {loading ? 'Creating Vehicle...' : (isEdit ? 'Update Vehicle' : 'Create Vehicle')}
                  </Button>
                  {completionPercentage < 50 && (
                    <Typography variant="caption" display="block" color="error.main" sx={{ mt: 1 }}>
                      Complete at least 50% of required fields to enable submission
                    </Typography>
                  )}
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
      <form onSubmit={(e) => {
        e.preventDefault();
        console.log('🚫 Form default submit prevented');
      }}>
        <Card>
          <CardContent>
            {renderStepContent(activeStep)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            type="button"
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
              type="button"
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
