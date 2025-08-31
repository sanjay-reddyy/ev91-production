import React from 'react';
import { Grid, Typography, Divider, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, FormHelperText, Autocomplete, CircularProgress, Box } from '@mui/material';
import { Controller } from 'react-hook-form';
import { City, Hub } from '../../services/vehicleService';

interface Step2RegistrationAndInsuranceProps {
  control: any;
  errors: any;
  cities: City[];
  hubs: Hub[];
  loadingCities: boolean;
  loadingHubs: boolean;
  watchedCityId: string;
}

const Step2_RegistrationAndInsurance: React.FC<Step2RegistrationAndInsuranceProps> = ({
  control,
  errors,
  cities,
  hubs,
  loadingCities,
  loadingHubs,
  watchedCityId,
}) => {
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
          name="cityId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={cities}
              getOptionLabel={(option) => `${option.displayName || option.name} (${option.code})`}
              value={cities.find(city => city.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id || '');
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              loading={loadingCities}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="City"
                  error={!!errors.cityId}
                  helperText={errors.cityId?.message || "Select the city where this vehicle will operate"}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.displayName || option.name} ({option.code})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.state}, {option.country}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="hubId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={hubs}
              getOptionLabel={(option) => `${option.hubName || option.name} (${option.hubCode || option.code})`}
              value={hubs.find(hub => hub.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id || '');
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              loading={loadingHubs}
              disabled={!watchedCityId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assigned Hub"
                  error={!!errors.hubId}
                  helperText={
                    !watchedCityId
                      ? "Please select a city first"
                      : errors.hubId?.message || "Select the hub where this vehicle will be assigned"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingHubs ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.hubName || option.name} ({option.hubCode || option.code})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.address} • {option.hubType} • {option.hubCategory}
                      </Typography>
                      {option.hasChargingStation && (
                        <Typography variant="caption" color="success.main">
                          • Charging Available
                        </Typography>
                      )}
                      {option.hasServiceCenter && (
                        <Typography variant="caption" color="info.main">
                          • Service Center
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
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

      <Grid item xs={12} md={6}>
        <Controller
          name="fleetOperatorId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Fleet Operator ID"
              error={!!errors.fleetOperatorId}
              helperText={errors.fleetOperatorId?.message}
              placeholder="Optional - Fleet operator identifier"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="operationalStatus"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.operationalStatus}>
              <InputLabel>Operational Status</InputLabel>
              <Select
                {...field}
                label="Operational Status"
                value={field.value || 'Available'}
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Assigned">Assigned</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
              </Select>
              {errors.operationalStatus && (
                <FormHelperText>{errors.operationalStatus.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="serviceStatus"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.serviceStatus}>
              <InputLabel>Service Status</InputLabel>
              <Select
                {...field}
                label="Service Status"
                value={field.value || 'Active'}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Scheduled for Service">Scheduled for Service</MenuItem>
              </Select>
              {errors.serviceStatus && (
                <FormHelperText>{errors.serviceStatus.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default Step2_RegistrationAndInsurance;
