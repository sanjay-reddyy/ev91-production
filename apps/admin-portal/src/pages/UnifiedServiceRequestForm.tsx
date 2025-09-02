import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Chip,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Build as ServiceIcon,
  Schedule as ScheduleIcon,
  Inventory as PartsIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  ServiceRequest,
  ServiceRequestPart,
  UnifiedServiceRequestFormProps,
} from '../types/unifiedService';

const serviceTypeOptions = [
  { value: 'PREVENTIVE', label: 'Preventive Maintenance' },
  { value: 'REPAIR', label: 'Repair Service' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'RECALL', label: 'Recall Service' },
  { value: 'WARRANTY', label: 'Warranty Service' },
  { value: 'EMERGENCY', label: 'Emergency Service' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'success' as const },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' as const },
  { value: 'HIGH', label: 'High', color: 'error' as const },
  { value: 'CRITICAL', label: 'Critical', color: 'error' as const },
];

const commonSymptoms = [
  'Engine noise',
  'Brake issues',
  'Electrical problems',
  'Transmission issues',
  'Battery problems',
  'Tire wear',
  'Oil leak',
  'Overheating',
  'Warning lights',
  'Performance issues',
];

export const UnifiedServiceRequestForm: React.FC<UnifiedServiceRequestFormProps> = ({
  vehicleId,
  initialData,
  open,
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<ServiceRequest>({
    vehicleId: vehicleId || '',
    serviceType: 'PREVENTIVE',
    priority: 'MEDIUM',
    status: 'DRAFT',
    title: '',
    description: '',
    customerApprovalRequired: false,
    parts: [],
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedSymptoms(initialData.symptoms || []);
    } else {
      // Reset form when no initial data
      setFormData({
        vehicleId: vehicleId || '',
        serviceType: 'PREVENTIVE',
        priority: 'MEDIUM',
        status: 'DRAFT',
        title: '',
        description: '',
        customerApprovalRequired: false,
        parts: [],
      });
      setSelectedSymptoms([]);
    }
  }, [initialData, vehicleId]);

  useEffect(() => {
    // Load available parts from spare parts service
    loadAvailableParts();
  }, []);

  const loadAvailableParts = async () => {
    try {
      const response = await fetch('/api/v1/spare-parts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const parts = await response.json();
        setAvailableParts(parts);
      }
    } catch (error) {
      console.error('Failed to load parts:', error);
    }
  };

  const handleInputChange = (field: keyof ServiceRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSymptomsChange = (symptoms: string[]) => {
    setSelectedSymptoms(symptoms);
    setFormData(prev => ({
      ...prev,
      symptoms,
    }));
  };

  const addPart = (part: any) => {
    const newPart: ServiceRequestPart = {
      partId: part.id,
      partName: part.name,
      partNumber: part.partNumber,
      quantity: 1,
      unitPrice: part.price || 0,
      totalPrice: part.price || 0,
      isRequired: true,
      specifications: part.specifications,
    };

    setFormData(prev => ({
      ...prev,
      parts: [...(prev.parts || []), newPart],
    }));
  };

  const updatePart = (index: number, field: keyof ServiceRequestPart, value: any) => {
    setFormData(prev => {
      const updatedParts = [...(prev.parts || [])];
      updatedParts[index] = {
        ...updatedParts[index],
        [field]: value,
      };

      // Recalculate total price for this part
      if (field === 'quantity' || field === 'unitPrice') {
        updatedParts[index].totalPrice = updatedParts[index].quantity * updatedParts[index].unitPrice;
      }

      return {
        ...prev,
        parts: updatedParts,
        totalEstimatedCost: updatedParts.reduce((sum, part) => sum + part.totalPrice, 0),
      };
    });
  };

  const removePart = (index: number) => {
    setFormData(prev => {
      const updatedParts = prev.parts?.filter((_, i) => i !== index) || [];
      return {
        ...prev,
        parts: updatedParts,
        totalEstimatedCost: updatedParts.reduce((sum, part) => sum + part.totalPrice, 0),
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = initialData?.id
        ? `/api/v1/unified-service/requests/${initialData.id}`
        : '/api/v1/unified-service/requests';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(initialData?.id ? 'Service request updated successfully' : 'Service request created successfully');
        onSubmit(result);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save service request');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      vehicleId: vehicleId || '',
      serviceType: 'PREVENTIVE',
      priority: 'MEDIUM',
      status: 'DRAFT',
      title: '',
      description: '',
      customerApprovalRequired: false,
      parts: [],
    });
    setSelectedSymptoms([]);
    setActiveTab(0);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ServiceIcon />
            <Typography variant="h6">
              {initialData?.id ? 'Edit Service Request' : 'Create Service Request'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Basic Information" icon={<ServiceIcon />} />
              <Tab label="Service Details" icon={<ScheduleIcon />} />
              <Tab label="Parts & Materials" icon={<PartsIcon />} />
            </Tabs>

            {/* Basic Information Tab */}
            {activeTab === 0 && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={formData.serviceType}
                        onChange={(e) => handleInputChange('serviceType', e.target.value)}
                        label="Service Type"
                      >
                        {serviceTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        label="Priority"
                      >
                        {priorityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Chip label={option.label} color={option.color} size="small" />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Service Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Issue Reported"
                      multiline
                      rows={3}
                      value={formData.issueReported || ''}
                      onChange={(e) => handleInputChange('issueReported', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Service Details Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Requested Date"
                      value={formData.requestedDate ? new Date(formData.requestedDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleInputChange('requestedDate', new Date(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Service Location"
                      value={formData.serviceLocation || ''}
                      onChange={(e) => handleInputChange('serviceLocation', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Estimated Duration (hours)"
                      value={formData.estimatedDuration || ''}
                      onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value))}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.customerApprovalRequired}
                          onChange={(e) => handleInputChange('customerApprovalRequired', e.target.checked)}
                        />
                      }
                      label="Customer Approval Required"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={commonSymptoms}
                      value={selectedSymptoms}
                      onChange={(_, newValue) => handleSymptomsChange(newValue)}
                      freeSolo
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Symptoms"
                          placeholder="Select or type symptoms"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Parts & Materials Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Required Parts & Materials</Typography>
                  <Autocomplete
                    options={availableParts}
                    getOptionLabel={(option) => `${option.name} (${option.partNumber})`}
                    onChange={(_, selectedPart) => {
                      if (selectedPart) {
                        addPart(selectedPart);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add Part"
                        variant="outlined"
                        size="small"
                        sx={{ width: 300 }}
                      />
                    )}
                  />
                </Box>

                {formData.parts && formData.parts.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Name</TableCell>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.parts.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell>{part.partName}</TableCell>
                            <TableCell>{part.partNumber}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={part.quantity}
                                onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value))}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={part.unitPrice}
                                onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value))}
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell>₹{part.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Checkbox
                                checked={part.isRequired}
                                onChange={(e) => updatePart(index, 'isRequired', e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                color="error"
                                onClick={() => removePart(index)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No parts added yet. Use the search box above to add parts.</Alert>
                )}

                {formData.totalEstimatedCost && formData.totalEstimatedCost > 0 && (
                  <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                    <Typography variant="h6">
                      Total Estimated Cost: ₹{formData.totalEstimatedCost.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleReset} startIcon={<CancelIcon />}>
            Reset
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.title || !formData.vehicleId}
          >
            {loading ? 'Saving...' : (initialData?.id ? 'Update' : 'Create')} Request
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UnifiedServiceRequestForm;
