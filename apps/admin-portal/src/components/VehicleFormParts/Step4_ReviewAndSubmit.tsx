import React from 'react';
import { Grid, Typography, Divider, Card, CardContent, Box, Button } from '@mui/material';
import { OEM, VehicleModel, City, Hub } from '../../services/vehicleService';

interface Step4ReviewAndSubmitProps {
  watch: any;
  oems: OEM[];
  vehicleModels: VehicleModel[];
  cities: City[];
  hubs: Hub[];
  vehiclePhotos: File[];
  rcDocument: File | null;
  insuranceDocument: File | null;
  setActiveStep: (step: number) => void;
}

const Step4_ReviewAndSubmit: React.FC<Step4ReviewAndSubmitProps> = ({
  watch,
  oems,
  vehicleModels,
  cities,
  hubs,
  vehiclePhotos,
  rcDocument,
  insuranceDocument,
  setActiveStep,
}) => {
  const formData = watch();
  const requiredFieldsComplete = {
    basic: !!(formData.registrationNumber && formData.oemId && formData.modelId && formData.color),
    operational: !!(formData.cityId && formData.hubId && formData.mileage >= 0 && formData.operationalStatus && formData.serviceStatus),
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
              <Grid item xs={6} md={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {requiredFieldsComplete.basic ? '✅' : '❌'}
                  <Typography variant="body2">Basic Info</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {requiredFieldsComplete.operational ? '✅' : '❌'}
                  <Typography variant="body2">Operational</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {requiredFieldsComplete.purchase ? '✅' : '❌'}
                  <Typography variant="body2">Purchase Details</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main'
                }} />
                Operational Details
              </Typography>
              <Button
                type="button"
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
                  <Typography variant="subtitle2" color="text.secondary">City</Typography>
                  <Typography variant="body1" fontWeight="medium" color={watch('cityId') ? 'text.primary' : 'error.main'}>
                    {cities.find(c => c.id === watch('cityId'))?.displayName || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned Hub</Typography>
                  <Typography variant="body1" fontWeight="medium" color={watch('hubId') ? 'text.primary' : 'error.main'}>
                    {hubs.find(h => h.id === watch('hubId'))?.name || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Current Mileage</Typography>
                  <Typography variant="body1" fontWeight="medium" color={watch('mileage') >= 0 ? 'text.primary' : 'error.main'}>
                    {watch('mileage') >= 0 ? `${watch('mileage')} km` : <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Fleet Operator ID</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {watch('fleetOperatorId') || <em>Not specified</em>}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Operational Status</Typography>
                  <Typography variant="body1" fontWeight="medium" color={watch('operationalStatus') ? 'text.primary' : 'error.main'}>
                    {watch('operationalStatus') || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Service Status</Typography>
                  <Typography variant="body1" fontWeight="medium" color={watch('serviceStatus') ? 'text.primary' : 'error.main'}>
                    {watch('serviceStatus') || <em style={{ color: 'red' }}>⚠️ Required field missing</em>}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Photos & Documents Preview */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main'
                }} />
                Photos & Documents
              </Typography>
              <Button
                type="button"
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
                <Typography variant="subtitle2" color="text.secondary">Vehicle Photos</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {vehiclePhotos.length > 0 ? `${vehiclePhotos.length} photo(s) uploaded` : <em>No photos uploaded</em>}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">RC Document</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {rcDocument ? rcDocument.name : <em>No RC document uploaded</em>}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Insurance Document</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {insuranceDocument ? insuranceDocument.name : <em>No insurance document uploaded</em>}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Step4_ReviewAndSubmit;
