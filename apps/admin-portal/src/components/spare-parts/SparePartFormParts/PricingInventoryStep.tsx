import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Controller } from 'react-hook-form';

interface PricingInventoryStepProps {
  control: any;
  errors: any;
  units: Array<{ value: string; label: string }>;
}

const PricingInventoryStep: React.FC<PricingInventoryStepProps> = ({ control, errors, units }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h3>Pricing</h3>
      </Grid>
      <Grid item xs={12} md={4}>
      <Controller
        name="costPrice"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Cost Price" fullWidth type="number" error={!!errors.costPrice} helperText={errors.costPrice?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="sellingPrice"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Selling Price" fullWidth type="number" error={!!errors.sellingPrice} helperText={errors.sellingPrice?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="mrp"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="MRP" fullWidth type="number" error={!!errors.mrp} helperText={errors.mrp?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="markupPercent"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Markup %" fullWidth type="number" error={!!errors.markupPercent} helperText={errors.markupPercent?.message} />
        )}
      />
    </Grid>
      <Grid item xs={12}>
        <h3>Inventory</h3>
      </Grid>
      <Grid item xs={12} md={4}>
      <Controller
        name="unitOfMeasure"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.unitOfMeasure} required>
            <InputLabel>Unit of Measure</InputLabel>
            <Select {...field} label="Unit of Measure">
              {units.map((unit) => (
                <MenuItem key={unit.value} value={unit.value}>
                  {unit.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.unitOfMeasure?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="minimumStock"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Minimum Stock" fullWidth type="number" error={!!errors.minimumStock} helperText={errors.minimumStock?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="maximumStock"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Maximum Stock" fullWidth type="number" error={!!errors.maximumStock} helperText={errors.maximumStock?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="reorderLevel"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Reorder Level" fullWidth type="number" error={!!errors.reorderLevel} helperText={errors.reorderLevel?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="reorderQuantity"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Reorder Quantity" fullWidth type="number" error={!!errors.reorderQuantity} helperText={errors.reorderQuantity?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={4}>
      <Controller
        name="leadTimeDays"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Lead Time (Days)" fullWidth type="number" error={!!errors.leadTimeDays} helperText={errors.leadTimeDays?.message} />
        )}
      />
    </Grid>
    </Grid>
  </>
);

export default PricingInventoryStep;
