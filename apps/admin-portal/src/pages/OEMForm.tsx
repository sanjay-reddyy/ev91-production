import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { oemService, CreateOEMRequest, UpdateOEMRequest } from '../services/oemService';

interface OEMFormProps {}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const validationSchema = yup.object({
  name: yup.string().required('OEM name is required').min(2, 'Name must be at least 2 characters'),
  displayName: yup.string().required('Display name is required').min(2, 'Display name must be at least 2 characters'),
  code: yup.string().required('OEM code is required').min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
  country: yup.string().optional(),
  website: yup.string().url('Please enter a valid URL').optional().nullable(),
  supportEmail: yup.string().email('Please enter a valid email').optional().nullable(),
  supportPhone: yup.string().optional().nullable(),
  gstin: yup.string().optional().nullable(),
  panNumber: yup.string().optional().nullable(),
  registeredAddress: yup.string().optional().nullable(),
  logoUrl: yup.string().url('Please enter a valid URL').optional().nullable(),
  brandColor: yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color').optional().nullable(),
  description: yup.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  isActive: yup.boolean().default(true),
  isPreferred: yup.boolean().default(false),
});

type FormData = yup.InferType<typeof validationSchema>;

const OEMForm: React.FC<OEMFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
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
      name: '',
      displayName: '',
      code: '',
      country: '',
      website: '',
      supportEmail: '',
      supportPhone: '',
      gstin: '',
      panNumber: '',
      registeredAddress: '',
      logoUrl: '',
      brandColor: '#1976d2',
      description: '',
      isActive: true,
      isPreferred: false,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (isEditing && id) {
      loadOEM(id);
    }
  }, [id, isEditing]);

  const loadOEM = async (oemId: string) => {
    try {
      setInitialLoading(true);
      const response = await oemService.getOEMById(oemId);
      const oem = response.data;
      
      reset({
        name: oem.name,
        displayName: oem.displayName,
        code: oem.code,
        country: oem.country || '',
        website: oem.website || '',
        supportEmail: oem.supportEmail || '',
        supportPhone: oem.supportPhone || '',
        gstin: oem.gstin || '',
        panNumber: oem.panNumber || '',
        registeredAddress: oem.registeredAddress || '',
        logoUrl: oem.logoUrl || '',
        brandColor: oem.brandColor || '#1976d2',
        description: oem.description || '',
        isActive: oem.isActive,
        isPreferred: oem.isPreferred,
      });
    } catch (error) {
      console.error('Error loading OEM:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load OEM details',
        severity: 'error',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload: CreateOEMRequest | UpdateOEMRequest = {
        name: data.name,
        displayName: data.displayName,
        code: data.code,
        country: data.country || undefined,
        website: data.website || undefined,
        supportEmail: data.supportEmail || undefined,
        supportPhone: data.supportPhone || undefined,
        gstin: data.gstin || undefined,
        panNumber: data.panNumber || undefined,
        registeredAddress: data.registeredAddress || undefined,
        logoUrl: data.logoUrl || undefined,
        brandColor: data.brandColor || undefined,
        description: data.description || undefined,
        isActive: data.isActive,
        isPreferred: data.isPreferred,
      };

      if (isEditing && id) {
        await oemService.updateOEM(id, payload);
        setSnackbar({
          open: true,
          message: 'OEM updated successfully',
          severity: 'success',
        });
      } else {
        await oemService.createOEM(payload as CreateOEMRequest);
        setSnackbar({
          open: true,
          message: 'OEM created successfully',
          severity: 'success',
        });
        navigate('/oems');
      }
    } catch (error) {
      console.error('Error saving OEM:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} OEM`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/oems');
      }
    } else {
      navigate('/oems');
    }
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="1200px" margin="0 auto">
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {isEditing ? 'Edit OEM' : 'Add New OEM'}
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
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="OEM Name"
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
                      name="code"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="OEM Code"
                          variant="outlined"
                          fullWidth
                          error={!!errors.code}
                          helperText={errors.code?.message}
                          required
                          inputProps={{ style: { textTransform: 'uppercase' } }}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Country"
                          variant="outlined"
                          fullWidth
                          error={!!errors.country}
                          helperText={errors.country?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Description"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={3}
                          error={!!errors.description}
                          helperText={errors.description?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview & Settings */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Preview & Settings" />
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    src={watchedValues.logoUrl || undefined}
                    sx={{ 
                      width: 80, 
                      height: 80,
                      bgcolor: watchedValues.brandColor || '#1976d2',
                      mb: 2
                    }}
                  >
                    <BusinessIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6">{watchedValues.name || 'OEM Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {watchedValues.code || 'CODE'}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

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
                    name="isPreferred"
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
                        label="Preferred OEM"
                      />
                    )}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Contact Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Website"
                          variant="outlined"
                          fullWidth
                          error={!!errors.website}
                          helperText={errors.website?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="supportEmail"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Support Email"
                          variant="outlined"
                          fullWidth
                          error={!!errors.supportEmail}
                          helperText={errors.supportEmail?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="supportPhone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Support Phone"
                          variant="outlined"
                          fullWidth
                          error={!!errors.supportPhone}
                          helperText={errors.supportPhone?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="registeredAddress"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Registered Address"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={2}
                          error={!!errors.registeredAddress}
                          helperText={errors.registeredAddress?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Information */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Business Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="gstin"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="GSTIN"
                          variant="outlined"
                          fullWidth
                          error={!!errors.gstin}
                          helperText={errors.gstin?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="panNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="PAN Number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.panNumber}
                          helperText={errors.panNumber?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Brand Information */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Brand Information" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="logoUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Logo URL"
                          variant="outlined"
                          fullWidth
                          error={!!errors.logoUrl}
                          helperText={errors.logoUrl?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="brandColor"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Brand Color"
                          type="color"
                          variant="outlined"
                          fullWidth
                          error={!!errors.brandColor}
                          helperText={errors.brandColor?.message}
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
                {loading ? 'Saving...' : isEditing ? 'Update OEM' : 'Create OEM'}
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

export default OEMForm;
