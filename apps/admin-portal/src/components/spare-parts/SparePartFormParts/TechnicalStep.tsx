import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Switch, FormControlLabel, Chip, Box } from '@mui/material';
import { Controller } from 'react-hook-form';

interface TechnicalStepProps {
  control: any;
  errors: any;
  qualityGrades: Array<{ value: string; label: string }>;
  vehicleModels: Array<{ id: string; name: string }>;
}

const TechnicalStep: React.FC<TechnicalStepProps> = ({ control, errors, qualityGrades, vehicleModels }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h3>Physical Properties</h3>
      </Grid>
      <Grid item xs={12} md={4}>
      <Controller
        name="dimensions"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Dimensions" fullWidth error={!!errors.dimensions} helperText={errors.dimensions?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="weight"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Weight (kg)" fullWidth type="number" error={!!errors.weight} helperText={errors.weight?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="material"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Material" fullWidth error={!!errors.material} helperText={errors.material?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="color"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Color" fullWidth error={!!errors.color} helperText={errors.color?.message} />
        )}
      />
    </Grid>
      <Grid item xs={12}>
        <h3>Other Technical Details</h3>
      </Grid>
      <Grid item xs={12} md={4}>
      <Controller
        name="warranty"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Warranty (months)" fullWidth type="number" error={!!errors.warranty} helperText={errors.warranty?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="qualityGrade"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.qualityGrade} required>
            <InputLabel>Quality Grade</InputLabel>
            <Select {...field} label="Quality Grade">
              {qualityGrades.map((grade) => (
                <MenuItem key={grade.value} value={grade.value}>
                  {grade.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.qualityGrade?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="isOemApproved"
        control={control}
        render={({ field }) => (
          <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label="OEM Approved" />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label="Active" />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="isHazardous"
        control={control}
        render={({ field }) => (
          <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label="Hazardous" />
        )}
      />
    </Grid>
      <Grid item xs={12}>
        <h3>Compatibility</h3>
      </Grid>
      <Grid item xs={12}>
      <Controller
        name="compatibility"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.compatibility}>
            <InputLabel id="compatibility-label">Compatible Vehicle Models</InputLabel>
            <Select
              labelId="compatibility-label"
              multiple
              value={field.value ? JSON.parse(field.value) : []}
              onChange={(e) => {
                field.onChange(JSON.stringify(e.target.value));
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => {
                    const model = vehicleModels?.find((m) => m.id === value);
                    return <Chip key={value} label={model?.name || value} />;
                  })}
                </Box>
              )}
            >
              {vehicleModels?.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.compatibility?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Grid>
    </Grid>
  </>
);

export default TechnicalStep;
