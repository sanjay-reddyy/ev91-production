import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { outwardFlowService } from '../services/outwardFlowService';
import { sparePartsService, SparePart } from '../services/sparePartsService';

interface PartRequest {
  sparePartId: string;
  sparePart?: SparePart;
  quantity: number;
  estimatedCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  justification?: string;
}

const ServiceRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleNumber: '',
    riderId: '',
    riderName: '',
    hubId: '',
    hubName: '',
    requestType: 'MAINTENANCE' as const,
    description: '',
    priority: 'MEDIUM' as const,
    estimatedCost: '',
    notes: '',
  });

  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state for adding parts
  const [addPartDialogOpen, setAddPartDialogOpen] = useState(false);
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [partQuantity, setPartQuantity] = useState(1);
  const [partEstimatedCost, setPartEstimatedCost] = useState('');
  const [partPriority, setPartPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [partJustification, setPartJustification] = useState('');

  // Load service request data if editing
  useEffect(() => {
    if (isEdit && id) {
      loadServiceRequest();
    }
  }, [id, isEdit]);

  // Load available spare parts
  useEffect(() => {
    loadAvailableParts();
  }, []);

  const loadServiceRequest = async () => {
    try {
      setLoading(true);
      const response = await outwardFlowService.serviceRequests.getById(id!);
      if (response.success) {
        const request = response.data;
        setFormData({
          vehicleId: request.vehicleId,
          vehicleNumber: request.vehicleNumber || '',
          riderId: request.riderId || '',
          riderName: request.riderName || '',
          hubId: request.hubId || '',
          hubName: request.hubName || '',
          requestType: request.requestType,
          description: request.description,
          priority: request.priority,
          estimatedCost: request.estimatedCost?.toString() || '',
          notes: request.notes || '',
        });

        // Convert part requests if available
        if (request.partRequests) {
          const convertedPartRequests = request.partRequests.map((pr: any) => ({
            sparePartId: pr.sparePartId,
            sparePart: pr.sparePart,
            quantity: pr.quantity,
            estimatedCost: pr.estimatedCost,
            priority: pr.priority,
            justification: pr.justification,
          }));
          setPartRequests(convertedPartRequests);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service request');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableParts = async () => {
    try {
      const response = await sparePartsService.getAll({ limit: 1000 });
      if (response.success) {
        setAvailableParts(response.data || []);
      }
    } catch (err: any) {
      console.error('Error loading spare parts:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPart = () => {
    setAddPartDialogOpen(true);
    setSelectedPart(null);
    setPartQuantity(1);
    setPartEstimatedCost('');
    setPartPriority('MEDIUM');
    setPartJustification('');
  };

  const handleAddPartConfirm = () => {
    if (!selectedPart) return;

    const newPartRequest: PartRequest = {
      sparePartId: selectedPart.id,
      sparePart: selectedPart,
      quantity: partQuantity,
      estimatedCost: parseFloat(partEstimatedCost) || selectedPart.sellingPrice * partQuantity,
      priority: partPriority,
      justification: partJustification,
    };

    setPartRequests(prev => [...prev, newPartRequest]);
    setAddPartDialogOpen(false);
  };

  const handleRemovePart = (index: number) => {
    setPartRequests(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalEstimatedCost = () => {
    const partsCost = partRequests.reduce((sum, part) => sum + part.estimatedCost, 0);
    const serviceCost = parseFloat(formData.estimatedCost) || 0;
    return partsCost + serviceCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        vehicleId: formData.vehicleId,
        vehicleNumber: formData.vehicleNumber,
        riderId: formData.riderId,
        riderName: formData.riderName,
        hubId: formData.hubId,
        hubName: formData.hubName,
        requestType: formData.requestType,
        description: formData.description,
        priority: formData.priority,
        estimatedCost: parseFloat(formData.estimatedCost) || undefined,
        notes: formData.notes || '',
      };

      let response;
      if (isEdit) {
        response = await outwardFlowService.serviceRequests.update(id!, requestData);
      } else {
        response = await outwardFlowService.serviceRequests.create(requestData);
      }

      if (response.success) {
        setSuccess(`Service request ${isEdit ? 'updated' : 'created'} successfully!`);
        setTimeout(() => {
          navigate('/spare-parts/outward/service-requests');
        }, 2000);
      } else {
        setError(response.message || `Failed to ${isEdit ? 'update' : 'create'} service request`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} service request`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/spare-parts/outward/service-requests');
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Edit Service Request' : 'Create Service Request'}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vehicle ID"
                      value={formData.vehicleId}
                      onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vehicle Number"
                      value={formData.vehicleNumber}
                      onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rider ID"
                      value={formData.riderId}
                      onChange={(e) => handleInputChange('riderId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rider Name"
                      value={formData.riderName}
                      onChange={(e) => handleInputChange('riderName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hub ID"
                      value={formData.hubId}
                      onChange={(e) => handleInputChange('hubId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hub Name"
                      value={formData.hubName}
                      onChange={(e) => handleInputChange('hubName', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Service Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Service Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Request Type</InputLabel>
                      <Select
                        value={formData.requestType}
                        label="Request Type"
                        onChange={(e) => handleInputChange('requestType', e.target.value)}
                      >
                        <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                        <MenuItem value="REPAIR">Repair</MenuItem>
                        <MenuItem value="INSPECTION">Inspection</MenuItem>
                        <MenuItem value="EMERGENCY">Emergency</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        label="Priority"
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="CRITICAL">Critical</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Estimated Service Cost (₹)"
                      value={formData.estimatedCost}
                      onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Spare Parts Required */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Spare Parts Required
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddPart}
                  >
                    Add Part
                  </Button>
                </Box>

                {partRequests.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Name</TableCell>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Estimated Cost</TableCell>
                          <TableCell>Justification</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {partRequests.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {part.sparePart?.displayName || part.sparePart?.name}
                            </TableCell>
                            <TableCell>
                              {part.sparePart?.partNumber}
                            </TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={part.priority}
                                size="small"
                                color={
                                  part.priority === 'CRITICAL' ? 'error' :
                                  part.priority === 'HIGH' ? 'warning' :
                                  part.priority === 'MEDIUM' ? 'info' : 'success'
                                }
                              />
                            </TableCell>
                            <TableCell>₹{part.estimatedCost.toLocaleString()}</TableCell>
                            <TableCell>
                              {part.justification || '-'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemovePart(index)}
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
                  <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No spare parts added yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "Add Part" to include spare parts in this service request
                    </Typography>
                  </Box>
                )}

                {/* Total Cost Summary */}
                {(partRequests.length > 0 || formData.estimatedCost) && (
                  <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Service Cost: ₹{(parseFloat(formData.estimatedCost) || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Parts Cost: ₹{partRequests.reduce((sum, part) => sum + part.estimatedCost, 0).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h6">
                          Total Estimated Cost: ₹{calculateTotalEstimatedCost().toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {isEdit ? 'Update Request' : 'Create Request'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Add Part Dialog */}
      <Dialog open={addPartDialogOpen} onClose={() => setAddPartDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Spare Part</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={availableParts}
                getOptionLabel={(option) => `${option.displayName || option.name} (${option.partNumber})`}
                value={selectedPart}
                onChange={(_, newValue) => {
                  setSelectedPart(newValue);
                  if (newValue) {
                    setPartEstimatedCost((newValue.sellingPrice * partQuantity).toString());
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Spare Part"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">
                        {option.displayName || option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.partNumber} • ₹{option.sellingPrice}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={partQuantity}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 1;
                  setPartQuantity(qty);
                  if (selectedPart) {
                    setPartEstimatedCost((selectedPart.sellingPrice * qty).toString());
                  }
                }}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={partPriority}
                  label="Priority"
                  onChange={(e) => setPartPriority(e.target.value as any)}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Cost (₹)"
                value={partEstimatedCost}
                onChange={(e) => setPartEstimatedCost(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Justification (Optional)"
                value={partJustification}
                onChange={(e) => setPartJustification(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPartDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPartConfirm}
            variant="contained"
            disabled={!selectedPart}
          >
            Add Part
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestForm;
