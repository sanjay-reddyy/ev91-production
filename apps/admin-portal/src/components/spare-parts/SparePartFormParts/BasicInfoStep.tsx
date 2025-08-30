import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Controller } from 'react-hook-form';

interface BasicInfoStepProps {
  control: any;
  errors: any;
  categories: Array<{ id: string; displayName: string; code: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ control, errors, categories, suppliers }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <h3>Part Identification</h3>
      </Grid>
      <Grid item xs={12} md={6}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Part Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="displayName"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Display Name" fullWidth error={!!errors.displayName} helperText={errors.displayName?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="partNumber"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Part Number" fullWidth error={!!errors.partNumber} helperText={errors.partNumber?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="oemPartNumber"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="OEM Part Number" fullWidth error={!!errors.oemPartNumber} helperText={errors.oemPartNumber?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="internalCode"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Internal Code" fullWidth error={!!errors.internalCode} helperText={errors.internalCode?.message} />
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Description" fullWidth multiline rows={2} error={!!errors.description} helperText={errors.description?.message} />
        )}
      />
    </Grid>
      <Grid item xs={12}>
        <h3>Classification</h3>
      </Grid>
      <Grid item xs={12} md={6}>
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.categoryId} required>
            <InputLabel>Category</InputLabel>
            <Select {...field} label="Category">
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.displayName}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.categoryId?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Grid>
  <Grid item xs={12} md={6}>
      <Controller
        name="supplierId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.supplierId} required>
            <InputLabel>Supplier</InputLabel>
            <Select {...field} label="Supplier">
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.supplierId?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Grid>
    </Grid>
  </>
);

export default BasicInfoStep;
