import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
// Stepper and helpers will be inside the component
import {
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import BasicInfoStep from '../components/spare-parts/SparePartFormParts/BasicInfoStep';
import PricingInventoryStep from '../components/spare-parts/SparePartFormParts/PricingInventoryStep';
import TechnicalStep from '../components/spare-parts/SparePartFormParts/TechnicalStep';
import ReviewStep from '../components/spare-parts/SparePartFormParts/ReviewStep';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sparePartsService, suppliersService } from '../services/sparePartsService';
import { vehicleModelService } from '../services/vehicleModelService';

// Mock categories for now - can be replaced with actual API call
const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'ENGINE', displayName: 'Engine Components', code: 'ENG' },
  { id: 'cat2', name: 'BRAKE', displayName: 'Brake System', code: 'BRK' },
  { id: 'cat3', name: 'ELECTRICAL', displayName: 'Electrical Components', code: 'ELC' },
  { id: 'cat4', name: 'BODY', displayName: 'Body Parts', code: 'BDY' },
  { id: 'cat5', name: 'SUSPENSION', displayName: 'Suspension System', code: 'SUS' },
  { id: 'cat6', name: 'TRANSMISSION', displayName: 'Transmission System', code: 'TRN' },
  { id: 'cat7', name: 'COOLING', displayName: 'Cooling System', code: 'COL' },
  { id: 'cat8', name: 'FUEL', displayName: 'Fuel System', code: 'FUL' },
];

const QUALITY_GRADES = [
  { value: 'A', label: 'Grade A - Premium Quality' },
  { value: 'B', label: 'Grade B - Standard Quality' },
  { value: 'C', label: 'Grade C - Basic Quality' }
];
const UNITS_OF_MEASURE = [
  { value: 'PCS', label: 'Pieces' },
  { value: 'KG', label: 'Kilograms' },
  { value: 'LITER', label: 'Liters' },
  { value: 'METER', label: 'Meters' },
  { value: 'PAIR', label: 'Pairs' },
  { value: 'SET', label: 'Sets' }
];

// Define separate types for each step to prevent data bleeding
interface BasicInfoData {
  name: string;
  displayName: string;
  partNumber: string;
  oemPartNumber: string;
  internalCode: string;
  description: string;
  categoryId: string;
  supplierId: string;
}

interface PricingInventoryData {
  costPrice: number | undefined;
  sellingPrice: number | undefined;
  mrp: number | undefined;
  markupPercent: number | undefined;
  unitOfMeasure: string;
  minimumStock: number | undefined;
  maximumStock: number | undefined;
  reorderLevel: number | undefined;
  reorderQuantity: number | undefined;
  leadTimeDays: number | undefined;
}

interface TechnicalData {
  dimensions: string;
  weight: number | undefined;
  material: string;
  color: string;
  warranty: number | undefined;
  qualityGrade: string;
  isOemApproved: boolean;
  isActive: boolean;
  isHazardous: boolean;
  compatibility: string; // JSON array of model IDs
}

// Combined type for final submission
type SparePartFormData = BasicInfoData & PricingInventoryData & TechnicalData;

// Separate validation schemas for each step
const basicInfoSchema = yup.object({
  name: yup
    .string()
    .required('Part name is required')
    .min(2, 'Part name must be at least 2 characters')
    .max(100, 'Part name cannot exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.()]+$/, 'Part name contains invalid characters'),

  displayName: yup
    .string()
    .optional()
    .max(100, 'Display name cannot exceed 100 characters'),

  partNumber: yup
    .string()
    .required('Part number is required')
    .min(3, 'Part number must be at least 3 characters')
    .max(50, 'Part number cannot exceed 50 characters')
    .matches(/^[A-Z0-9\-_]+$/, 'Part number must contain only uppercase letters, numbers, hyphens, and underscores'),

  oemPartNumber: yup
    .string()
    .optional()
    .max(50, 'OEM part number cannot exceed 50 characters'),

  internalCode: yup
    .string()
    .required('Internal code is required')
    .min(3, 'Internal code must be at least 3 characters')
    .max(30, 'Internal code cannot exceed 30 characters')
    .matches(/^[A-Z0-9\-_]+$/, 'Internal code must contain only uppercase letters, numbers, hyphens, and underscores'),

  description: yup
    .string()
    .optional()
    .max(500, 'Description cannot exceed 500 characters'),

  categoryId: yup
    .string()
    .required('Category is required')
    .min(1, 'Please select a category'),

  supplierId: yup
    .string()
    .required('Supplier is required')
    .min(1, 'Please select a supplier'),
});

const pricingInventorySchema = yup.object({
  costPrice: yup
    .number()
    .required('Cost price is required')
    .positive('Cost price must be positive')
    .min(0.01, 'Cost price must be at least ₹0.01')
    .max(1000000, 'Cost price cannot exceed ₹10,00,000')
    .typeError('Cost price must be a valid number'),

  sellingPrice: yup
    .number()
    .required('Selling price is required')
    .positive('Selling price must be positive')
    .min(0.01, 'Selling price must be at least ₹0.01')
    .max(1000000, 'Selling price cannot exceed ₹10,00,000')
    .typeError('Selling price must be a valid number')
    .test('selling-greater-than-cost', 'Selling price should be greater than cost price', function(value) {
      const { costPrice } = this.parent;
      if (costPrice && value) {
        return value >= costPrice;
      }
      return true;
    }),

  mrp: yup
    .number()
    .required('MRP is required')
    .positive('MRP must be positive')
    .min(0.01, 'MRP must be at least ₹0.01')
    .max(1000000, 'MRP cannot exceed ₹10,00,000')
    .typeError('MRP must be a valid number')
    .test('mrp-greater-than-selling', 'MRP should be greater than or equal to selling price', function(value) {
      const { sellingPrice } = this.parent;
      if (sellingPrice && value) {
        return value >= sellingPrice;
      }
      return true;
    }),

  markupPercent: yup
    .number()
    .optional()
    .min(0, 'Markup cannot be negative')
    .max(1000, 'Markup cannot exceed 1000%')
    .typeError('Markup must be a valid number'),

  unitOfMeasure: yup
    .string()
    .required('Unit of measure is required')
    .oneOf(['PCS', 'KG', 'LITER', 'METER', 'PAIR', 'SET'], 'Please select a valid unit of measure'),

  minimumStock: yup
    .number()
    .required('Minimum stock is required')
    .integer('Minimum stock must be a whole number')
    .min(1, 'Minimum stock must be at least 1')
    .max(100000, 'Minimum stock cannot exceed 1,00,000')
    .typeError('Minimum stock must be a valid number'),

  maximumStock: yup
    .number()
    .required('Maximum stock is required')
    .integer('Maximum stock must be a whole number')
    .min(1, 'Maximum stock must be at least 1')
    .max(100000, 'Maximum stock cannot exceed 1,00,000')
    .typeError('Maximum stock must be a valid number')
    .test('max-greater-than-min', 'Maximum stock must be greater than minimum stock', function(value) {
      const { minimumStock } = this.parent;
      if (minimumStock && value) {
        return value > minimumStock;
      }
      return true;
    }),

  reorderLevel: yup
    .number()
    .required('Reorder level is required')
    .integer('Reorder level must be a whole number')
    .min(1, 'Reorder level must be at least 1')
    .max(100000, 'Reorder level cannot exceed 1,00,000')
    .typeError('Reorder level must be a valid number')
    .test('reorder-between-min-max', 'Reorder level should be between minimum and maximum stock', function(value) {
      const { minimumStock, maximumStock } = this.parent;
      if (minimumStock && maximumStock && value) {
        return value >= minimumStock && value <= maximumStock;
      }
      return true;
    }),

  reorderQuantity: yup
    .number()
    .required('Reorder quantity is required')
    .integer('Reorder quantity must be a whole number')
    .min(1, 'Reorder quantity must be at least 1')
    .max(100000, 'Reorder quantity cannot exceed 1,00,000')
    .typeError('Reorder quantity must be a valid number'),

  leadTimeDays: yup
    .number()
    .required('Lead time is required')
    .integer('Lead time must be a whole number')
    .min(1, 'Lead time must be at least 1 day')
    .max(365, 'Lead time cannot exceed 365 days')
    .typeError('Lead time must be a valid number'),
});

const technicalSchema = yup.object({
  dimensions: yup
    .string()
    .optional()
    .max(100, 'Dimensions cannot exceed 100 characters'),

  weight: yup
    .number()
    .optional()
    .positive('Weight must be positive')
    .min(0.001, 'Weight must be at least 0.001 kg')
    .max(10000, 'Weight cannot exceed 10,000 kg')
    .typeError('Weight must be a valid number'),

  material: yup
    .string()
    .optional()
    .max(100, 'Material cannot exceed 100 characters'),

  color: yup
    .string()
    .optional()
    .max(50, 'Color cannot exceed 50 characters'),

  warranty: yup
    .number()
    .optional()
    .integer('Warranty must be a whole number')
    .min(0, 'Warranty cannot be negative')
    .max(120, 'Warranty cannot exceed 120 months')
    .typeError('Warranty must be a valid number'),

  qualityGrade: yup
    .string()
    .required('Quality grade is required')
    .oneOf(['A', 'B', 'C'], 'Please select a valid quality grade'),

  compatibility: yup
    .string()
    .required('Compatibility information is required')
    .default('[]'),

  isOemApproved: yup
    .boolean()
    .optional(),

  isActive: yup
    .boolean()
    .optional(),

  isHazardous: yup
    .boolean()
    .optional(),
});

// Stepper removed

const steps = [
  'Basic Information',
  'Pricing & Inventory',
  'Technical Details',
  'Review & Submit',
];

const SparePartFormPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Helper: get fields for each step
  // const getStepFields = (step: number): string[] => {
  //   switch (step) {
  //     case 0:
  //       return ['name', 'displayName', 'partNumber', 'oemPartNumber', 'internalCode', 'description', 'categoryId', 'supplierId'];
  //     case 1:
  //       return ['costPrice', 'sellingPrice', 'mrp', 'markupPercent', 'unitOfMeasure', 'minimumStock', 'maximumStock', 'reorderLevel', 'reorderQuantity', 'leadTimeDays'];
  //     case 2:
  //       return ['dimensions', 'weight', 'material', 'color', 'warranty', 'qualityGrade', 'isOemApproved', 'isActive', 'isHazardous', 'compatibility'];
  //     default:
  //       return [];
  //   }
  // };

  // Navigation handlers
  const handleNext = async () => {
    // Validate current step
    let isStepValid = false;
    if (activeStep === 0) isStepValid = await basicInfoForm.trigger();
    else if (activeStep === 1) isStepValid = await pricingInventoryForm.trigger();
    else if (activeStep === 2) isStepValid = await technicalForm.trigger();
    else isStepValid = true;

    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
    } else {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in this step before proceeding.',
        severity: 'error',
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  // Fetch existing spare part data for editing
  const {
    data: existingSparePartData,
    isLoading: existingSparePartLoading,
  } = useQuery(
    ['spare-part', id],
    () => sparePartsService.getById(id!),
    {
      enabled: isEdit,
      staleTime: 5 * 60 * 1000,
    }
  )

  const [loading, setLoading] = useState(false);
  // Stepper state removed
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Separate form instances for each step to prevent data bleeding
  const basicInfoForm = useForm<BasicInfoData>({
    resolver: yupResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      displayName: '',
      partNumber: '',
      oemPartNumber: '',
      internalCode: '',
      description: '',
      categoryId: '',
      supplierId: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const pricingInventoryForm = useForm<PricingInventoryData>({
    resolver: yupResolver(pricingInventorySchema),
    defaultValues: {
      costPrice: undefined,
      sellingPrice: undefined,
      mrp: undefined,
      markupPercent: undefined,
      unitOfMeasure: '',
      minimumStock: undefined,
      maximumStock: undefined,
      reorderLevel: undefined,
      reorderQuantity: undefined,
      leadTimeDays: undefined,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const technicalForm = useForm<TechnicalData>({
    resolver: yupResolver(technicalSchema),
    defaultValues: {
      dimensions: '',
      weight: undefined,
      material: '',
      color: '',
      warranty: undefined,
      qualityGrade: '',
      isOemApproved: false,
      isActive: true,
      isHazardous: false,
      compatibility: '[]', // Add default empty JSON array
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  // Stepper navigation removed

  // Auto-save functionality for each step
  const STORAGE_KEYS = {
    basicInfo: 'spare-part-form-basic-info',
    pricingInventory: 'spare-part-form-pricing-inventory',
    technical: 'spare-part-form-technical',
  };

  // Load saved data for each form (only for new parts) or existing part data (for editing)
  useEffect(() => {
    if (isEdit && existingSparePartData && !existingSparePartLoading) {
      // Populate forms with existing spare part data
      const sparePart = existingSparePartData.data;

      console.log('📝 Loading existing spare part data for editing:', sparePart);

      // Populate basic info form
      basicInfoForm.reset({
        name: sparePart.name || '',
        displayName: sparePart.displayName || '',
        partNumber: sparePart.partNumber || '',
        oemPartNumber: sparePart.oemPartNumber || '',
        internalCode: sparePart.internalCode || '',
        description: sparePart.description || '',
        categoryId: sparePart.categoryId || '',
        supplierId: sparePart.supplierId || '',
      });

      // Populate pricing & inventory form
      pricingInventoryForm.reset({
        costPrice: sparePart.costPrice || undefined,
        sellingPrice: sparePart.sellingPrice || undefined,
        mrp: sparePart.mrp || undefined,
        markupPercent: sparePart.markupPercent || undefined,
        unitOfMeasure: sparePart.unitOfMeasure || '',
        minimumStock: sparePart.minimumStock || undefined,
        maximumStock: sparePart.maximumStock || undefined,
        reorderLevel: sparePart.reorderLevel || undefined,
        reorderQuantity: sparePart.reorderQuantity || undefined,
        leadTimeDays: sparePart.leadTimeDays || undefined,
      });

      // Populate technical form
      technicalForm.reset({
        dimensions: sparePart.dimensions || '',
        weight: sparePart.weight || undefined,
        material: sparePart.material || '',
        color: sparePart.color || '',
        warranty: sparePart.warranty || undefined,
        qualityGrade: sparePart.qualityGrade || '',
        isOemApproved: sparePart.isOemApproved || false,
        isActive: sparePart.isActive !== undefined ? sparePart.isActive : true,
        isHazardous: sparePart.isHazardous || false,
        compatibility: sparePart.compatibility || '[]',
      });
    } else if (!isEdit) {
      // Load saved data from localStorage for new parts
      try {
        const savedBasicInfo = localStorage.getItem(STORAGE_KEYS.basicInfo);
        const savedPricingInventory = localStorage.getItem(STORAGE_KEYS.pricingInventory);
        const savedTechnical = localStorage.getItem(STORAGE_KEYS.technical);

        if (savedBasicInfo) {
          const parsedBasicInfo = JSON.parse(savedBasicInfo);
          console.log('📁 Loading saved basic info:', parsedBasicInfo);
          basicInfoForm.reset(parsedBasicInfo);
        }

        if (savedPricingInventory) {
          const parsedPricingInventory = JSON.parse(savedPricingInventory);
          console.log('📁 Loading saved pricing inventory:', parsedPricingInventory);
          pricingInventoryForm.reset(parsedPricingInventory);
        }

        if (savedTechnical) {
          const parsedTechnical = JSON.parse(savedTechnical);
          console.log('📁 Loading saved technical data:', parsedTechnical);
          technicalForm.reset(parsedTechnical);
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, [isEdit, existingSparePartData, existingSparePartLoading, basicInfoForm, pricingInventoryForm, technicalForm]);

  // Auto-save each form's data separately
  useEffect(() => {
    const subscriptions = [
      basicInfoForm.watch((value) => {
        if (!isEdit) {
          localStorage.setItem(STORAGE_KEYS.basicInfo, JSON.stringify(value));
          console.log('💾 Auto-saved basic info');
        }
      }),
      pricingInventoryForm.watch((value) => {
        if (!isEdit) {
          localStorage.setItem(STORAGE_KEYS.pricingInventory, JSON.stringify(value));
          console.log('💾 Auto-saved pricing inventory');
        }
      }),
      technicalForm.watch((value) => {
        if (!isEdit) {
          localStorage.setItem(STORAGE_KEYS.technical, JSON.stringify(value));
          console.log('💾 Auto-saved technical data');
        }
      }),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [basicInfoForm, pricingInventoryForm, technicalForm, isEdit]);

  // Clear all saved data
  const clearAllSavedData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Cleared all saved form data');
  };

  // Fetch suppliers
  const {
    data: suppliersData
  } = useQuery(
    ['suppliers'],
    () => suppliersService.getAll({ isActive: true, limit: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch vehicle models
  const { data: vehicleModelsData } = useQuery(
    ['vehicleModels'],
    () => vehicleModelService.getAllVehicleModels({ isActive: true }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  const vehicleModels = vehicleModelsData?.data || [];

  // Create spare part mutation
  const createSparePartMutation = useMutation(
    (data: any) => sparePartsService.create(data),
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'Spare part created successfully',
          severity: 'success',
        });
        queryClient.invalidateQueries(['spare-parts']);
        clearAllSavedData();
        // Navigate back to spare parts list after successful submission
        setTimeout(() => {
          navigate('/spare-parts');
        }, 2000);
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to create spare part',
          severity: 'error',
        });
      },
    }
  );

  // Update spare part mutation
  const updateSparePartMutation = useMutation(
    (data: any) => sparePartsService.update(id!, data),
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'Spare part updated successfully',
          severity: 'success',
        });
        queryClient.invalidateQueries(['spare-parts']);
        queryClient.invalidateQueries(['spare-part', id]);
        // Navigate back to spare parts list after successful submission
        setTimeout(() => {
          navigate('/spare-parts');
        }, 2000);
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to update spare part',
          severity: 'error',
        });
      },
    }
  );

  const suppliers = suppliersData?.data?.suppliers || [];

  // Stepper navigation removed

  // Stepper helpers removed

  // Combine all form data for submission
  const combineFormData = (): SparePartFormData => {
    const basicInfo = basicInfoForm.getValues();
    const pricingInventory = pricingInventoryForm.getValues();
    const technical = technicalForm.getValues();

    return {
      ...basicInfo,
      ...pricingInventory,
      ...technical,
    };
  };

  // Stepper helpers removed

  // Stepper helpers removed

  // Enhanced form submission
  const onSubmit = async () => {
    console.log('🚀 Starting form submission');

    // Validate all forms before submission
    const basicInfoValid = await basicInfoForm.trigger();
    const pricingInventoryValid = await pricingInventoryForm.trigger();
    const technicalValid = await technicalForm.trigger();

    if (!basicInfoValid || !pricingInventoryValid || !technicalValid) {
      const errorCounts = [
        Object.keys(basicInfoForm.formState.errors).length,
        Object.keys(pricingInventoryForm.formState.errors).length,
        Object.keys(technicalForm.formState.errors).length,
      ];
      const totalErrors = errorCounts.reduce((sum, count) => sum + count, 0);

      setSnackbar({
        open: true,
        message: `Cannot submit: ${totalErrors} validation error(s) found across all steps. Please review and fix all errors.`,
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      // Combine all form data
      const combinedData = combineFormData();
      console.log('📋 Combined form data:', combinedData);

      // Prepare data for API with enhanced validation
      const apiData = {
        ...combinedData,
        displayName: combinedData.displayName || combinedData.name,
        // Ensure numbers are properly formatted
        costPrice: Number(combinedData.costPrice),
        sellingPrice: Number(combinedData.sellingPrice),
        mrp: Number(combinedData.mrp),
        markupPercent: combinedData.markupPercent ? Number(combinedData.markupPercent) : undefined,
        minimumStock: Number(combinedData.minimumStock),
        maximumStock: Number(combinedData.maximumStock),
        reorderLevel: Number(combinedData.reorderLevel),
        reorderQuantity: Number(combinedData.reorderQuantity),
        leadTimeDays: Number(combinedData.leadTimeDays),
        weight: combinedData.weight ? Number(combinedData.weight) : undefined,
        warranty: combinedData.warranty ? Number(combinedData.warranty) : undefined,
      };

      console.log('📤 Sending API data:', apiData);

      if (isEdit) {
        await updateSparePartMutation.mutateAsync(apiData);
        console.log('✅ Spare part updated successfully');
      } else {
        await createSparePartMutation.mutateAsync(apiData);
        console.log('✅ Spare part created successfully');
      }

    } catch (error: any) {
      // Log full error details for debugging
      if (error.response) {
        console.error('❌ Backend error response:', error.response.data);
      }
      console.error('❌ Error creating spare part:', error);

      // Show backend error message if available
      const errorMessage = error?.response?.data?.message || error.message || `Failed to ${isEdit ? 'update' : 'create'} spare part`;
      setSnackbar({
        open: true,
        message: `Submission failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <BasicInfoStep
                control={basicInfoForm.control}
                errors={basicInfoForm.formState.errors}
                categories={MOCK_CATEGORIES}
                suppliers={suppliers}
              />
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pricing & Inventory</Typography>
              <PricingInventoryStep
                control={pricingInventoryForm.control}
                errors={pricingInventoryForm.formState.errors}
                units={UNITS_OF_MEASURE}
              />
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Technical Details</Typography>
              <TechnicalStep
                control={technicalForm.control}
                errors={technicalForm.formState.errors}
                qualityGrades={QUALITY_GRADES}
                vehicleModels={vehicleModels}
              />
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Review & Submit</Typography>
              <ReviewStep
                values={combineFormData()}
                categories={MOCK_CATEGORIES}
                suppliers={suppliers}
                vehicleModels={vehicleModels}
              />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Reset Option */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/spare-parts')} size="large">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {isEdit ? 'Edit Spare Part' : 'Add New Spare Part'}
          </Typography>
        </Box>

        {!isEdit && (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              const confirmReset = window.confirm('Are you sure you want to reset the form? All entered data will be lost.');
              if (confirmReset) {
                clearAllSavedData();
                window.location.reload(); // Simple way to reset form completely
              }
            }}
          >
            Reset Form
          </Button>
        )}
      </Box>

      {/* Stepper restored for stage-wise navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, idx) => (
              <Step key={label} completed={idx < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Stage-wise Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        // Only allow submit on last step
        if (activeStep === steps.length - 1) {
          onSubmit();
        }
      }}>
        {renderStepContent(activeStep)}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || existingSparePartLoading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Part' : 'Create Part')}
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

export default SparePartFormPage;
