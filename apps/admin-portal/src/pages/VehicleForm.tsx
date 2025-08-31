import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { usePermissions } from '../hooks/usePermissions';
import * as yup from 'yup';
import { vehicleService, OEM, VehicleModel, Hub, City } from '../services/vehicleService';

// Import step components
import Step1_VehicleInfo from '../components/VehicleFormParts/Step1_VehicleInfo';
import Step2_RegistrationAndInsurance from '../components/VehicleFormParts/Step2_RegistrationAndInsurance';
import Step3_PhotosAndDocuments from '../components/VehicleFormParts/Step3_PhotosAndDocuments';
import Step4_ReviewAndSubmit from '../components/VehicleFormParts/Step4_ReviewAndSubmit';

// Validation schema
const vehicleSchema = yup.object({
  registrationNumber: yup.string().required('Registration number is required'),
  oemId: yup.string().required('OEM is required'),
  modelId: yup.string().required('Vehicle model is required'),
  variant: yup.string().optional(),
  color: yup.string().required('Color is required'),
  year: yup.number().optional().min(2000, 'Year must be 2000 or later').max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  chassisNumber: yup.string()
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/, 'Chassis number must be a valid 17-character VIN (alphanumeric, excluding I, O, Q)')
    .optional(),
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
  // Operational details
  cityId: yup.string().required('City is required'),
  hubId: yup.string().required('Hub assignment is required'),
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
  const { hasCreatePermission, hasUpdatePermission } = usePermissions();

  // Check permissions based on mode (create vs edit)
  if (isEdit && !hasUpdatePermission('vehicle', 'vehicles')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to edit vehicles. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  if (!isEdit && !hasCreatePermission('vehicle', 'vehicles')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to create vehicles. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Prevent duplicate submissions
  const [activeStep, setActiveStep] = useState(0);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [rcDocument, setRcDocument] = useState<File | null>(null);
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    vehiclePhotos?: { status: 'uploading' | 'success' | 'error'; progress?: number; message?: string }[];
    rcDocument?: { status: 'uploading' | 'success' | 'error'; progress?: number; message?: string };
    insuranceDocument?: { status: 'uploading' | 'success' | 'error'; progress?: number; message?: string };
  }>({});
  const [existingDocuments, setExistingDocuments] = useState<{
    vehiclePhotos?: { id: string; fileName: string; fileUrl: string; uploadDate: string }[];
    rcDocument?: { id: string; fileName: string; fileUrl: string; uploadDate: string };
    insuranceDocument?: { id: string; fileName: string; fileUrl: string; uploadDate: string };
  } | null>(null);

  // Master data states
  const [oems, setOems] = useState<OEM[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingHubs, setLoadingHubs] = useState(false);

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
      // Operational details
      cityId: '',
      hubId: '',
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

  // Watch for OEM, model, and city changes
  const watchedOemId = watch('oemId');
  const watchedModelId = watch('modelId');
  const watchedCityId = watch('cityId');

  // Form state preservation
  const saveFormState = () => {
    const formData = watch();
    const stateKey = isEdit ? `vehicle-form-edit-${id}` : 'vehicle-form-create';
    localStorage.setItem(stateKey, JSON.stringify({
      formData,
      activeStep,
      timestamp: Date.now()
    }));
    console.log('💾 Form state saved to localStorage');
  };

  const loadFormState = () => {
    const stateKey = isEdit ? `vehicle-form-edit-${id}` : 'vehicle-form-create';
    const savedState = localStorage.getItem(stateKey);

    if (savedState) {
      try {
        const { formData, activeStep: savedStep, timestamp } = JSON.parse(savedState);

        // Only restore if saved within last hour and not editing
        const oneHour = 60 * 60 * 1000;
        if (!isEdit && Date.now() - timestamp < oneHour) {
          console.log('� Restoring form state from localStorage');
          reset(formData);
          setActiveStep(savedStep);

          setSnackbar({
            open: true,
            message: 'Previous form data restored',
            severity: 'info',
          });
        }
      } catch (error) {
        console.warn('Failed to restore form state:', error);
        localStorage.removeItem(stateKey);
      }
    }
  };

  const clearFormState = () => {
    const stateKey = isEdit ? `vehicle-form-edit-${id}` : 'vehicle-form-create';
    localStorage.removeItem(stateKey);
    
    // Also clear the temporary city/hub storage for edit mode
    if (isEdit && id) {
      localStorage.removeItem(`vehicle-${id}-cityId`);
      localStorage.removeItem(`vehicle-${id}-hubId`);
      console.log('🗑️ Cleared temporary city/hub storage for vehicle:', id);
    }
    
    console.log('🗑️ Form state cleared from localStorage');
  };

  // Auto-save form state periodically
  useEffect(() => {
    const interval = setInterval(saveFormState, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [watch]);

  // Load form state on mount (only for new vehicles)
  useEffect(() => {
    if (!isEdit && !loading) {
      loadFormState();
    }
  }, [isEdit, loading]);

  // Clear form state on successful submission
  const clearStateOnSuccess = () => {
    clearFormState();
  };

  // Debug: Watch for step changes
  React.useEffect(() => {
    console.log('📍 Active step changed to:', activeStep);
  }, [activeStep]);

  // Load OEMs and cities on component mount
  useEffect(() => {
    loadOEMs();
    loadCities();
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

  // Load hubs when city changes
  useEffect(() => {
    if (watchedCityId) {
      loadHubsByCity(watchedCityId);
    } else {
      setHubs([]);
      setValue('hubId', '');
    }
  }, [watchedCityId, setValue]);

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

  // Re-populate form when master data changes during edit mode - simplified
  useEffect(() => {
    if (isEdit && id && !loading && oems.length > 0 && cities.length > 0) {
      const currentCityId = watch('cityId');
      const currentOemId = watch('oemId');

      // Check if we need to reload data
      const needsOemReload = currentOemId && !oems.find((o: OEM) => o.id === currentOemId);
      const needsCityReload = currentCityId && !cities.find((c: City) => c.id === currentCityId);
      
      if (needsOemReload || needsCityReload) {
        console.log('🔄 Master data mismatch detected, reloading vehicle data');
        loadVehicle();
      }
    }
  }, [isEdit, id, loading, oems.length, cities.length]);

  // Additional effect to handle form population after city/hub data is loaded
  useEffect(() => {
    if (isEdit && id && !loading && cities.length > 0) {
      const currentCityId = watch('cityId');
      const currentHubId = watch('hubId');
      
      // If we have form values and matching data exists, we're good
      if (currentCityId && currentHubId) {
        const cityExists = cities.find((c: City) => c.id === currentCityId);
        const hubExists = hubs.find((h: Hub) => h.id === currentHubId);
        if (cityExists && hubExists) {
          console.log('✅ City and Hub data properly loaded and form populated');
          return;
        }
      }
      
      // If we reach here, form might need re-population
      console.log('🔧 Form may need re-population, current values:', { currentCityId, currentHubId });
      console.log('🔧 Available cities:', cities.length, 'Available hubs:', hubs.length);
      
      // Re-trigger vehicle loading if data seems incomplete
      if (cities.length > 0 && (!currentCityId || !currentHubId)) {
        console.log('� Re-triggering vehicle load due to incomplete form data');
        loadVehicle();
      }
    }
  }, [isEdit, id, loading, cities.length, hubs.length, setValue, watch]);

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

  const loadCities = async () => {
    setLoadingCities(true);
    try {
      const response = await vehicleService.getCities({ isActive: true, isOperational: true });
      setCities(response.data);
    } catch (error) {
      console.error('Error loading cities:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load cities',
        severity: 'error',
      });
    } finally {
      setLoadingCities(false);
    }
  };

  const loadHubsByCity = async (cityId: string) => {
    setLoadingHubs(true);
    try {
      const response = await vehicleService.getHubsByCity(cityId);
      setHubs(response.data);
    } catch (error) {
      console.error('Error loading hubs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load hubs for selected city',
        severity: 'error',
      });
    } finally {
      setLoadingHubs(false);
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
      console.log('🔄 Loading model specs for:', modelId);
      const response = await vehicleService.getVehicleModelSpecs(modelId);
      const model = response.data;
      setSelectedModel(model);

      // Parse available colors and variants
      if (model.availableColors) {
        try {
          const colors = JSON.parse(model.availableColors);
          setAvailableColors(Array.isArray(colors) ? colors : []);
          console.log('🎨 Available colors:', colors);
        } catch {
          setAvailableColors([]);
        }
      }

      if (model.availableVariants) {
        try {
          const variants = JSON.parse(model.availableVariants);
          setAvailableVariants(Array.isArray(variants) ? variants : []);
          console.log('🚗 Available variants:', variants);
        } catch {
          setAvailableVariants([]);
        }
      }

      // Auto-fill specifications from model (only for new vehicles, not edit mode)
      if (!isEdit) {
        console.log('🔄 Auto-filling model specs for new vehicle');
        if (model.batteryCapacity) setValue('batteryCapacity', parseFloat(model.batteryCapacity) || 0);
        if (model.range) setValue('maxRange', model.range);
        if (model.maxSpeed) setValue('maxSpeed', model.maxSpeed);
      } else {
        console.log('✅ Edit mode: preserving existing vehicle specs');
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
      console.log('🔄 Loading vehicle data for ID:', id);

      const response = await vehicleService.getVehicle(id);
      const vehicleData = response.data;
      console.log('🔍 Vehicle data loaded:', vehicleData);
      console.log('🔍 Hub data structure:', vehicleData.hub);
      console.log('🔍 Hub city data:', vehicleData.hub?.city);

      // Extract IDs early for loading dependencies
      const cityIdToLoad = vehicleData.hub?.city?.id || vehicleData.hub?.cityId;
      const hubIdToLoad = vehicleData.hubId;
      const oemIdToLoad = vehicleData.model?.oemId;

      console.log('� IDs to load:', { cityIdToLoad, hubIdToLoad, oemIdToLoad });

      // Load all master data in parallel but wait for completion
      const masterDataPromises = [];

      // Ensure OEMs are loaded
      if (oems.length === 0) {
        console.log('🔄 Loading OEMs...');
        masterDataPromises.push(loadOEMs());
      }

      // Ensure cities are loaded
      if (cities.length === 0) {
        console.log('🔄 Loading cities...');
        masterDataPromises.push(loadCities());
      }

      // Wait for basic master data to load
      await Promise.all(masterDataPromises);
      console.log('✅ Basic master data loaded');

      // Load dependent data sequentially
      if (oemIdToLoad && vehicleModels.length === 0) {
        console.log('🔄 Loading vehicle models for OEM:', oemIdToLoad);
        await loadVehicleModels(oemIdToLoad);
      }

      if (cityIdToLoad) {
        console.log('🔄 Loading hubs for city:', cityIdToLoad);
        await loadHubsByCity(cityIdToLoad);
      }

      // Wait for all state updates to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get fresh state references after all async operations
      const freshCitiesResponse = await vehicleService.getCities({ isActive: true, isOperational: true });
      const freshCities: City[] = freshCitiesResponse.data;
      
      let freshHubs: Hub[] = [];
      if (cityIdToLoad) {
        const freshHubsResponse = await vehicleService.getHubsByCity(cityIdToLoad);
        freshHubs = freshHubsResponse.data;
      }

      console.log('� Fresh Cities:', freshCities.map(c => ({ id: c.id, name: c.displayName })));
      console.log('🔍 Fresh Hubs:', freshHubs.map(h => ({ id: h.id, name: h.name })));

      // Update state with fresh data
      setCities(freshCities);
      setHubs(freshHubs);

      // Set OEM and model data if available
      if (vehicleData.model) {
        setSelectedModel(vehicleData.model);
        console.log('� Selected model set:', vehicleData.model);
      }

      // Populate form with existing data with explicit type safety
      const formData = {
        registrationNumber: String(vehicleData.registrationNumber || ''),
        oemId: String(vehicleData.model?.oemId || ''),
        modelId: String(vehicleData.modelId || ''),
        hubId: String(vehicleData.hubId || ''),
        cityId: String(vehicleData.hub?.city?.id || vehicleData.hub?.cityId || ''),
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
        registrationNumber: formData.registrationNumber,
        oemId: formData.oemId,
        modelId: formData.modelId,
        color: formData.color,
        year: formData.year,
        cityId: formData.cityId,
        hubId: formData.hubId,
        mileage: formData.mileage
      });

      // Verify matching data exists
      const matchingCity = freshCities.find((city: City) => city.id === formData.cityId);
      const matchingHub = freshHubs.find((hub: Hub) => hub.id === formData.hubId);
      console.log('🔍 Matching city found:', matchingCity);
      console.log('🔍 Matching hub found:', matchingHub);

      // Reset form with the data
      reset(formData);
      
      // Wait for form reset to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify form values were set correctly
      const currentFormValues = watch();
      console.log('🔍 Form values after reset:', {
        cityId: currentFormValues.cityId,
        hubId: currentFormValues.hubId,
        registrationNumber: currentFormValues.registrationNumber
      });

      // If values didn't set correctly, force set them
      if (formData.cityId && currentFormValues.cityId !== formData.cityId) {
        console.log('🔧 Force setting cityId:', formData.cityId);
        setValue('cityId', formData.cityId, { shouldValidate: true });
      }
      
      if (formData.hubId && currentFormValues.hubId !== formData.hubId) {
        console.log('🔧 Force setting hubId:', formData.hubId);
        setValue('hubId', formData.hubId, { shouldValidate: true });
      }

      // Load existing documents
      try {
        console.log('🔄 Loading existing documents for vehicle:', id);
        const documentsResponse = await vehicleService.getMediaFiles(id);
        console.log('🔍 Documents loaded:', documentsResponse);

  const documents = Array.isArray(documentsResponse) ? documentsResponse : documentsResponse ? [documentsResponse] : [];
        const vehiclePhotos = documents.filter((doc: any) => doc.fileType === 'vehicle_photo');
        const rcDocs = documents.filter((doc: any) => doc.fileType === 'rc_document');
        const insuranceDocs = documents.filter((doc: any) => doc.fileType === 'insurance_document');

        setExistingDocuments({
          vehiclePhotos: vehiclePhotos.map((doc: any) => ({
            id: doc.id,
            fileName: doc.fileName || doc.originalFilename || 'Unknown',
            fileUrl: doc.fileUrl,
            uploadDate: doc.uploadDate || doc.createdAt || new Date().toISOString()
          })),
          rcDocument: rcDocs.length > 0 ? {
            id: rcDocs[0].id,
            fileName: rcDocs[0].fileName || rcDocs[0].originalFilename || 'RC Document',
            fileUrl: rcDocs[0].fileUrl,
            uploadDate: rcDocs[0].uploadDate || rcDocs[0].createdAt || new Date().toISOString()
          } : undefined,
          insuranceDocument: insuranceDocs.length > 0 ? {
            id: insuranceDocs[0].id,
            fileName: insuranceDocs[0].fileName || insuranceDocs[0].originalFilename || 'Insurance Document',
            fileUrl: insuranceDocs[0].fileUrl,
            uploadDate: insuranceDocs[0].uploadDate || insuranceDocs[0].createdAt || new Date().toISOString()
          } : undefined
        });

        console.log('✅ Documents loaded successfully');
      } catch (docError) {
        console.error('⚠️ Failed to load documents (non-critical):', docError);
        // Documents loading failure is non-critical, don't show error to user
      }
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
    // Prevent form submission if not on the final step
    if (activeStep !== steps.length - 1) {
      console.warn('🚫 Form submission prevented - not on final step. Current step:', activeStep);
      return;
    }

    // Prevent duplicate submissions
    if (submitting) {
      console.warn('🚫 Submission already in progress, ignoring duplicate request');
      return;
    }

    try {
      setLoading(true);
      setSubmitting(true);
      console.log('🚀 Form submission started');

      // Debug: Log raw form data first
      console.log('🚀 Raw form data received in onSubmit:', JSON.stringify(data, null, 2));

      // Prepare vehicle data for API with explicit type safety
      const vehicleData = {
        modelId: String(data.modelId),
        hubId: String(data.hubId),
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
        console.log('🔄 Updating vehicle with ID:', id);
        response = await vehicleService.updateVehicle(id, vehicleData);
      } else {
        console.log('➕ Creating new vehicle');
        response = await vehicleService.createVehicle(vehicleData);
      }

      console.log('✅ Vehicle API response:', response);
      const vehicleId = response.data.id;
      console.log('🆔 Vehicle ID for media uploads:', vehicleId);

      // Upload photos and documents with progress tracking
      if (vehiclePhotos.length > 0) {
        console.log('📸 Uploading vehicle photos:', vehiclePhotos.length);

        // Update status to uploading
        setUploadStatus(prev => ({
          ...prev,
          vehiclePhotos: vehiclePhotos.map(() => ({ status: 'uploading' as const, progress: 0 }))
        }));

        try {
          for (let i = 0; i < vehiclePhotos.length; i++) {
            const file = vehiclePhotos[i];
            setUploadStatus(prev => ({
              ...prev,
              vehiclePhotos: prev.vehiclePhotos?.map((status, index) =>
                index === i ? { ...status, progress: 50 } : status
              )
            }));

            await vehicleService.uploadVehicleDocument(vehicleId, file, 'vehicle_photo');

            setUploadStatus(prev => ({
              ...prev,
              vehiclePhotos: prev.vehiclePhotos?.map((status, index) =>
                index === i ? { status: 'success' as const, progress: 100 } : status
              )
            }));
          }
          console.log('✅ Vehicle photos uploaded');
        } catch (error) {
          console.error('❌ Vehicle photos upload failed:', error);
          setUploadStatus(prev => ({
            ...prev,
            vehiclePhotos: prev.vehiclePhotos?.map(status => ({
              ...status,
              status: 'error' as const,
              message: 'Upload failed'
            }))
          }));
        }
      }

      if (rcDocument) {
        console.log('📄 Uploading RC document');
        setUploadStatus(prev => ({
          ...prev,
          rcDocument: { status: 'uploading' as const, progress: 0 }
        }));

        try {
          setUploadStatus(prev => ({
            ...prev,
            rcDocument: { status: 'uploading' as const, progress: 50 }
          }));

          await vehicleService.uploadVehicleDocument(vehicleId, rcDocument, 'rc_document');

          setUploadStatus(prev => ({
            ...prev,
            rcDocument: { status: 'success' as const, progress: 100 }
          }));
          console.log('✅ RC document uploaded');
        } catch (error) {
          console.error('❌ RC document upload failed:', error);
          setUploadStatus(prev => ({
            ...prev,
            rcDocument: { status: 'error' as const, message: 'Upload failed' }
          }));
        }
      }

      if (insuranceDocument) {
        console.log('📄 Uploading insurance document');
        setUploadStatus(prev => ({
          ...prev,
          insuranceDocument: { status: 'uploading' as const, progress: 0 }
        }));

        try {
          setUploadStatus(prev => ({
            ...prev,
            insuranceDocument: { status: 'uploading' as const, progress: 50 }
          }));

          await vehicleService.uploadVehicleDocument(vehicleId, insuranceDocument, 'insurance_document');

          setUploadStatus(prev => ({
            ...prev,
            insuranceDocument: { status: 'success' as const, progress: 100 }
          }));
          console.log('✅ Insurance document uploaded');
        } catch (error) {
          console.error('❌ Insurance document upload failed:', error);
          setUploadStatus(prev => ({
            ...prev,
            insuranceDocument: { status: 'error' as const, message: 'Upload failed' }
          }));
        }
      }

      console.log('🎉 All uploads completed successfully');

      // Clear saved form state on successful submission
      clearStateOnSuccess();

      setSnackbar({
        open: true,
        message: `Vehicle ${isEdit ? 'updated' : 'created'} successfully!`,
        severity: 'success',
      });

      console.log('🧭 Navigating to vehicles list in 2 seconds...');
      // Navigate back to vehicle list after successful submission
      setTimeout(() => {
        console.log('🧭 Actually navigating now...');
        navigate('/vehicles');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error submitting vehicle:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} vehicle. Please try again.`;

      // Handle specific error cases
      if (error.response?.status === 409) {
        if (error.response?.data?.code === 'DUPLICATE_RECORD') {
          errorMessage = 'A vehicle with this registration number already exists. Please use a different registration number.';
        } else if (error.response?.data?.code === 'DUPLICATE_CHASSIS') {
          errorMessage = 'A vehicle with this chassis number already exists. Please use a different chassis number.';
        } else if (error.response?.data?.code === 'DUPLICATE_RC') {
          errorMessage = 'A vehicle with this RC number already exists. Please use a different RC number.';
        } else if (error.response?.data?.code === 'DUPLICATE_INSURANCE') {
          errorMessage = 'A vehicle with this insurance policy number already exists. Please use a different policy number.';
        } else {
          errorMessage = 'A vehicle with these details already exists. Please check your input.';
        }
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response?.data?.error || error.response?.data?.message || 'Invalid data provided'}`;
      } else if (error.response?.status === 500) {
        if (error.response?.data?.code === 'TRANSACTION_FAILED') {
          errorMessage = 'Transaction failed. Please try again in a moment.';
        } else {
          errorMessage = `Server error: ${error.response?.data?.error || error.response?.data?.message || 'Internal server error'}`;
        }
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
      console.log('🏁 Form submission process completed');
      setLoading(false);
      setSubmitting(false); // Re-enable form submission
    }
  };

  const handleNext = async (event?: React.MouseEvent) => {
    // Explicitly prevent form submission if called from a button click
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('🔍 handleNext called, current step:', activeStep);
    console.log('🔍 Current form data:', watch());

    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);
    console.log('✅ Validating fields for step', activeStep, ':', currentStepFields);

    const isStepValid = await trigger(currentStepFields);

    if (isStepValid) {
      console.log('✅ Step validation passed, moving to next step');
      // Save form state before moving to next step
      saveFormState();
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      console.log('❌ Step validation failed');
      console.log('❌ Form errors:', errors);
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the current step before proceeding.',
        severity: 'error',
      });
    }
  };

  const handleBack = (event?: React.MouseEvent) => {
    // Explicitly prevent form submission if called from a button click
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('🔙 handleBack called, current step:', activeStep);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Helper function to get fields for each step
  const getStepFields = (step: number): (keyof VehicleFormData)[] => {
    switch (step) {
      case 0: // Vehicle Information & Specifications
        return [
          'registrationNumber', 'oemId', 'modelId', 'color', 'year',
          'chassisNumber', 'engineNumber', 'variant', 'batteryCapacity',
          'maxRange', 'maxSpeed'
        ];
      case 1: // Registration, Insurance & Operational Details
        return [
          'purchaseDate', 'registrationDate', 'purchasePrice', 'currentValue',
          'rcNumber', 'rcExpiryDate', 'ownerName', 'ownerAddress', 'seatingCapacity',
          'insuranceNumber', 'insuranceExpiryDate', 'insuranceProvider',
          'insuranceType', 'premiumAmount', 'coverageAmount', 'mileage',
          'cityId', 'hubId', 'fleetOperatorId'
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
      const fileArray = Array.from(files);
      setVehiclePhotos(fileArray);
      // Initialize upload status for each file
      setUploadStatus(prev => ({
        ...prev,
        vehiclePhotos: fileArray.map(() => ({ status: 'uploading' as const, progress: 0 }))
      }));
    } else if (type === 'rc') {
      setRcDocument(files[0]);
      setUploadStatus(prev => ({
        ...prev,
        rcDocument: { status: 'uploading' as const, progress: 0 }
      }));
    } else if (type === 'insurance') {
      setInsuranceDocument(files[0]);
      setUploadStatus(prev => ({
        ...prev,
        insuranceDocument: { status: 'uploading' as const, progress: 0 }
      }));
    }
  };

  const removeFile = (type: 'vehicle' | 'rc' | 'insurance', index?: number) => {
    if (type === 'vehicle' && index !== undefined) {
      setVehiclePhotos(prev => prev.filter((_, i) => i !== index));
      // Clear upload status for this file
      setUploadStatus(prev => ({
        ...prev,
        vehiclePhotos: prev.vehiclePhotos?.filter((_, i) => i !== index)
      }));
    } else if (type === 'rc') {
      setRcDocument(null);
      setUploadStatus(prev => ({ ...prev, rcDocument: undefined }));
    } else if (type === 'insurance') {
      setInsuranceDocument(null);
      setUploadStatus(prev => ({ ...prev, insuranceDocument: undefined }));
    }
  };

  const handlePreviewDocument = (fileUrl: string) => {
    // Open document in new tab/window
    window.open(fileUrl, '_blank');
  };

  const handleDeleteExistingDocument = async (documentId: string, type: 'vehicle' | 'rc' | 'insurance') => {
    if (!id) return;

    try {
      await vehicleService.deleteDocument(id, documentId);

      // Remove from existing documents state
      setExistingDocuments(prev => {
        if (!prev) return prev;

        if (type === 'vehicle') {
          return {
            ...prev,
            vehiclePhotos: prev.vehiclePhotos?.filter(doc => doc.id !== documentId)
          };
        } else if (type === 'rc') {
          return {
            ...prev,
            rcDocument: undefined
          };
        } else if (type === 'insurance') {
          return {
            ...prev,
            insuranceDocument: undefined
          };
        }
        return prev;
      });

      setSnackbar({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete document',
        severity: 'error'
      });
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Step1_VehicleInfo
            control={control}
            errors={errors}
            oems={oems}
            vehicleModels={vehicleModels}
            loadingModels={loadingModels}
            availableColors={availableColors}
            availableVariants={availableVariants}
            selectedModel={selectedModel}
            handleGenerateRegistrationNumber={handleGenerateRegistrationNumber}
          />
        );
      case 1:
        return (
          <Step2_RegistrationAndInsurance
            control={control}
            errors={errors}
            cities={cities}
            hubs={hubs}
            loadingCities={loadingCities}
            loadingHubs={loadingHubs}
            watchedCityId={watchedCityId}
          />
        );
      case 2:
        return (
          <Step3_PhotosAndDocuments
            vehiclePhotos={vehiclePhotos}
            rcDocument={rcDocument}
            insuranceDocument={insuranceDocument}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            uploadStatus={uploadStatus}
            vehicleId={id}
            existingDocuments={existingDocuments || undefined}
            onPreviewDocument={handlePreviewDocument}
            onDeleteExistingDocument={handleDeleteExistingDocument}
          />
        );
      case 3:
        return (
          <Step4_ReviewAndSubmit
            watch={watch}
            oems={oems}
            vehicleModels={vehicleModels}
            cities={cities}
            hubs={hubs}
            vehiclePhotos={vehiclePhotos}
            rcDocument={rcDocument}
            insuranceDocument={insuranceDocument}
            setActiveStep={setActiveStep}
          />
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/vehicles')}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ ml: 1 }}>
              {isEdit ? 'Edit Vehicle' : 'Create New Vehicle'}
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form
            onSubmit={(e) => {
              // Extra safety: prevent submission if not on final step
              if (activeStep !== steps.length - 1) {
                console.warn('🚫 Form submission prevented at form level - not on final step');
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
              // Otherwise, proceed with the normal handleSubmit
              return handleSubmit(onSubmit)(e);
            }}
          >
            <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                type="button"
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<BackIcon />}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<SaveIcon />}
                  disabled={loading || submitting}
                >
                  {loading || submitting ? 'Submitting...' : (isEdit ? 'Save Changes' : 'Create Vehicle')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default VehicleFormPage;
