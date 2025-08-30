import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

interface ReviewStepProps {
  values: any;
  categories: Array<{ id: string; displayName: string }>;
  suppliers: Array<{ id: string; name: string }>;
  vehicleModels: Array<{ id: string; name: string }>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ values, categories, suppliers, vehicleModels }) => {
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.displayName || id;
  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || id;
  const getModelNames = (json: string) => {
    try {
      const ids = JSON.parse(json || '[]');
      return ids.map((id: string) => vehicleModels.find((m) => m.id === id)?.name || id).join(', ');
    } catch {
      return '';
    }
  };
  return (
    <Box>
      <Typography variant="h6">Review Spare Part Details</Typography>
      <Divider sx={{ my: 2 }} />
      <List>
        <ListItem><ListItemText primary="Part Name" secondary={values.name} /></ListItem>
        <ListItem><ListItemText primary="Display Name" secondary={values.displayName} /></ListItem>
        <ListItem><ListItemText primary="Part Number" secondary={values.partNumber} /></ListItem>
        <ListItem><ListItemText primary="OEM Part Number" secondary={values.oemPartNumber} /></ListItem>
        <ListItem><ListItemText primary="Internal Code" secondary={values.internalCode} /></ListItem>
        <ListItem><ListItemText primary="Description" secondary={values.description} /></ListItem>
        <ListItem><ListItemText primary="Category" secondary={getCategoryName(values.categoryId)} /></ListItem>
        <ListItem><ListItemText primary="Supplier" secondary={getSupplierName(values.supplierId)} /></ListItem>
        <Divider />
        <ListItem><ListItemText primary="Cost Price" secondary={values.costPrice} /></ListItem>
        <ListItem><ListItemText primary="Selling Price" secondary={values.sellingPrice} /></ListItem>
        <ListItem><ListItemText primary="MRP" secondary={values.mrp} /></ListItem>
        <ListItem><ListItemText primary="Markup %" secondary={values.markupPercent} /></ListItem>
        <ListItem><ListItemText primary="Unit of Measure" secondary={values.unitOfMeasure} /></ListItem>
        <ListItem><ListItemText primary="Minimum Stock" secondary={values.minimumStock} /></ListItem>
        <ListItem><ListItemText primary="Maximum Stock" secondary={values.maximumStock} /></ListItem>
        <ListItem><ListItemText primary="Reorder Level" secondary={values.reorderLevel} /></ListItem>
        <ListItem><ListItemText primary="Reorder Quantity" secondary={values.reorderQuantity} /></ListItem>
        <ListItem><ListItemText primary="Lead Time (Days)" secondary={values.leadTimeDays} /></ListItem>
        <Divider />
        <ListItem><ListItemText primary="Dimensions" secondary={values.dimensions} /></ListItem>
        <ListItem><ListItemText primary="Weight" secondary={values.weight} /></ListItem>
        <ListItem><ListItemText primary="Material" secondary={values.material} /></ListItem>
        <ListItem><ListItemText primary="Color" secondary={values.color} /></ListItem>
        <ListItem><ListItemText primary="Warranty (months)" secondary={values.warranty} /></ListItem>
        <ListItem><ListItemText primary="Quality Grade" secondary={values.qualityGrade} /></ListItem>
        <ListItem><ListItemText primary="OEM Approved" secondary={values.isOemApproved ? 'Yes' : 'No'} /></ListItem>
        <ListItem><ListItemText primary="Active" secondary={values.isActive ? 'Yes' : 'No'} /></ListItem>
        <ListItem><ListItemText primary="Hazardous" secondary={values.isHazardous ? 'Yes' : 'No'} /></ListItem>
        <ListItem><ListItemText primary="Compatible Vehicle Models" secondary={getModelNames(values.compatibility)} /></ListItem>
      </List>
    </Box>
  );
};

export default ReviewStep;
