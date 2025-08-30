import React from 'react';
import { Grid, Typography, Divider, TextField, InputAdornment, IconButton, Autocomplete, CircularProgress, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { Controller } from 'react-hook-form';
import { AutoFixHigh as GenerateIcon } from '@mui/icons-material';
import { OEM, VehicleModel } from '../../services/vehicleService';

interface Step1VehicleInfoProps {
  control: any;
  errors: any;
  oems: OEM[];
  vehicleModels: VehicleModel[];
  loadingModels: boolean;
  availableColors: string[];
  availableVariants: string[];
  selectedModel: VehicleModel | null;
  handleGenerateRegistrationNumber: () => void;
}

const Step1_VehicleInfo: React.FC<Step1VehicleInfoProps> = ({
  control,
  errors,
  oems,
  vehicleModels,
  loadingModels,
  availableColors,
  availableVariants,
  selectedModel,
  handleGenerateRegistrationNumber,
}) => {
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
              isOptionEqualToValue={(option, value) => option.id === value?.id}
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
              isOptionEqualToValue={(option, value) => option.id === value?.id}
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
              value={field.value || ''}
              onChange={(_, newValue) => {
                field.onChange(newValue || '');
              }}
              onInputChange={(_, newInputValue) => {
                field.onChange(newInputValue || '');
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
                <Select
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                >
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
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
              label="Chassis Number (VIN)"
              error={!!errors.chassisNumber}
              helperText={errors.chassisNumber?.message || "17-character VIN (e.g., 1HGCM82633A123456)"}
              placeholder="e.g., 1HGCM82633A123456"
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
};

export default Step1_VehicleInfo;
