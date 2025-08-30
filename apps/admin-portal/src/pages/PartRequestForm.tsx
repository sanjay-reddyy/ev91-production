import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { outwardFlowService, ServiceRequest } from '../services/outwardFlowService';

interface SparePart {
  id: string;
  name: string;
  displayName: string;
  partNumber: string;
  avgCost: number;
  category?: {
    name: string;
    displayName: string;
  };
}

interface PartRequestItem {
  id?: string;
  sparePartId: string;
  sparePart?: SparePart;
  quantity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedCost: number;
  notes?: string;
}

const PartRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Service request selection
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
  const [serviceRequestSearch, setServiceRequestSearch] = useState('');

  // Spare parts
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);
  const [partRequestItems, setPartRequestItems] = useState<PartRequestItem[]>([]);

  // Dialog states
  const [addPartDialogOpen, setAddPartDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [partQuantity, setPartQuantity] = useState(1);
  const [partPriority, setPartPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [partNotes, setPartNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Load initial data
  useEffect(() => {
    loadServiceRequests();
    loadAvailableParts();
    if (isEditing) {
      loadPartRequest();
    }
  }, [isEditing, id]);

  // Update estimated cost when part or quantity changes
  useEffect(() => {
    if (selectedPart) {
      setEstimatedCost(selectedPart.avgCost * partQuantity);
    }
  }, [selectedPart, partQuantity]);

  const loadServiceRequests = async () => {
    try {
      const response = await outwardFlowService.serviceRequests.getAll({
        status: 'OPEN',
        limit: 100,
      });
      if (response.success) {
        setServiceRequests(response.data || []);
      }
    } catch (err) {
      console.error('Error loading service requests:', err);
    }
  };

  const loadAvailableParts = async () => {
    try {
      // This would be a spare parts service call
      // For now, we'll use the outward flow service
      const response = await outwardFlowService.analytics.getAll();
      if (response.success) {
        // Mock spare parts data
        setAvailableParts([]);
      }
    } catch (err) {
      console.error('Error loading spare parts:', err);
    }
  };

  const loadPartRequest = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await outwardFlowService.partRequests.getById(id);
      if (response.success && response.data) {
        const request = response.data;

        // Set service request
        if (request.serviceRequest) {
          setSelectedServiceRequest(request.serviceRequest);
        }

        // Set part request items
        setPartRequestItems([{
          id: request.id,
          sparePartId: request.sparePartId,
          sparePart: request.sparePart,
          quantity: request.quantity,
          priority: request.priority as any,
          estimatedCost: request.estimatedCost,
          notes: request.notes,
        }]);
      } else {
        setError('Part request not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load part request');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceRequestChange = (_: any, newValue: ServiceRequest | null) => {
    setSelectedServiceRequest(newValue);
  };

  const handleAddPart = () => {
    setAddPartDialogOpen(true);
    setSelectedPart(null);
    setPartQuantity(1);
    setPartPriority('MEDIUM');
    setPartNotes('');
    setEstimatedCost(0);
  };

  const confirmAddPart = () => {
    if (!selectedPart) return;

    const newItem: PartRequestItem = {
      sparePartId: selectedPart.id,
      sparePart: selectedPart,
      quantity: partQuantity,
      priority: partPriority,
      estimatedCost,
      notes: partNotes,
    };

    setPartRequestItems(prev => [...prev, newItem]);
    setAddPartDialogOpen(false);
  };

  const handleRemovePart = (index: number) => {
    setPartRequestItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePartQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;

    setPartRequestItems(prev => prev.map((item, i) =>
      i === index
        ? {
            ...item,
            quantity,
            estimatedCost: (item.sparePart?.avgCost || 0) * quantity
          }
        : item
    ));
  };

  const handleUpdatePartPriority = (index: number, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    setPartRequestItems(prev => prev.map((item, i) =>
      i === index ? { ...item, priority } : item
    ));
  };

  const getTotalEstimatedCost = () => {
    return partRequestItems.reduce((total, item) => total + item.estimatedCost, 0);
  };

  const validateForm = () => {
    if (!selectedServiceRequest) {
      setError('Please select a service request');
      return false;
    }

    if (partRequestItems.length === 0) {
      setError('Please add at least one spare part');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (isEditing && partRequestItems.length === 1) {
        // Update existing request
        const item = partRequestItems[0];
        const response = await outwardFlowService.partRequests.update(id!, {
          quantity: item.quantity,
          priority: item.priority,
          estimatedCost: item.estimatedCost,
          notes: item.notes,
        });

        if (response.success) {
          setSuccess('Part request updated successfully');
          setTimeout(() => navigate('/spare-parts/outward/part-requests'), 2000);
        } else {
          setError(response.message || 'Failed to update part request');
        }
      } else {
        // Create new requests
        const requests = partRequestItems.map(item => ({
          serviceRequestId: selectedServiceRequest!.id,
          sparePartId: item.sparePartId,
          quantity: item.quantity,
          priority: item.priority,
          estimatedCost: item.estimatedCost,
          notes: item.notes,
        }));

        let successCount = 0;
        let errorCount = 0;

        for (const request of requests) {
          try {
            const response = await outwardFlowService.partRequests.create(request);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
          }
        }

        if (successCount > 0) {
          setSuccess(`${successCount} part request(s) created successfully`);
          if (errorCount === 0) {
            setTimeout(() => navigate('/spare-parts/outward/part-requests'), 2000);
          }
        }

        if (errorCount > 0) {
          setError(`${errorCount} part request(s) failed to create`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save part request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/spare-parts/outward/part-requests');
  };

  if (loading && isEditing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEditing ? 'Edit Part Request' : 'Create Part Request'}
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Service Request Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Request
              </Typography>
              <Autocomplete
                options={serviceRequests}
                getOptionLabel={(option) => `${option.requestNumber} - ${option.vehicleNumber || 'N/A'}`}
                value={selectedServiceRequest}
                onChange={handleServiceRequestChange}
                inputValue={serviceRequestSearch}
                onInputChange={(_, newInputValue) => setServiceRequestSearch(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Service Request"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.requestNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.vehicleNumber} | {option.priority} | {option.status}
                      </Typography>
                    </Box>
                  </li>
                )}
                disabled={isEditing}
              />

              {selectedServiceRequest && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Service Request Details
                  </Typography>
                  <Box display="flex" gap={1} mb={1}>
                    <Chip label={selectedServiceRequest.priority} size="small" color="warning" />
                    <Chip label={selectedServiceRequest.status} size="small" color="info" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle: {selectedServiceRequest.vehicleNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Issue: {selectedServiceRequest.description}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Parts
                  </Typography>
                  <Typography variant="h6">
                    {partRequestItems.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Quantity
                  </Typography>
                  <Typography variant="h6">
                    {partRequestItems.reduce((total, item) => total + item.quantity, 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Total Cost
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    ₹{getTotalEstimatedCost().toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Part Requests */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Spare Parts
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddPart}
                  disabled={!selectedServiceRequest}
                >
                  Add Part
                </Button>
              </Box>

              {partRequestItems.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Parts Added
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Add spare parts that are needed for this service request.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddPart}
                    disabled={!selectedServiceRequest}
                  >
                    Add Part
                  </Button>
                </Box>
              ) : (
                <List>
                  {partRequestItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="bold">
                                {item.sparePart?.displayName || item.sparePart?.name}
                              </Typography>
                              <Chip
                                label={item.priority}
                                size="small"
                                color={
                                  item.priority === 'CRITICAL' ? 'error' :
                                  item.priority === 'HIGH' ? 'warning' :
                                  item.priority === 'MEDIUM' ? 'info' : 'success'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Part Number: {item.sparePart?.partNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Quantity: {item.quantity} | Cost: ₹{item.estimatedCost.toLocaleString()}
                              </Typography>
                              {item.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  Notes: {item.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" alignItems="center" gap={1}>
                            <FormControl size="small" sx={{ minWidth: 80 }}>
                              <InputLabel>Qty</InputLabel>
                              <Select
                                value={item.quantity}
                                label="Qty"
                                onChange={(e) => handleUpdatePartQuantity(index, Number(e.target.value))}
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <MenuItem key={num} value={num}>{num}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <InputLabel>Priority</InputLabel>
                              <Select
                                value={item.priority}
                                label="Priority"
                                onChange={(e) => handleUpdatePartPriority(index, e.target.value as any)}
                              >
                                <MenuItem value="LOW">Low</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                                <MenuItem value="HIGH">High</MenuItem>
                                <MenuItem value="CRITICAL">Critical</MenuItem>
                              </Select>
                            </FormControl>
                            <IconButton
                              color="error"
                              onClick={() => handleRemovePart(index)}
                              size="small"
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < partRequestItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<SaveIcon />}
              disabled={loading || partRequestItems.length === 0 || !selectedServiceRequest}
            >
              {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Request' : 'Create Request')}
            </Button>
          </Box>
        </Grid>
      </Grid>

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
                onChange={(_, newValue) => setSelectedPart(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Spare Part"
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.displayName || option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.partNumber} | Avg Cost: ₹{option.avgCost}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={partQuantity}
                onChange={(e) => setPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
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
                label="Estimated Cost (₹)"
                value={estimatedCost}
                InputProps={{ readOnly: true }}
                helperText="Calculated based on average cost and quantity"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (Optional)"
                value={partNotes}
                onChange={(e) => setPartNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPartDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAddPart}
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

export default PartRequestForm;
