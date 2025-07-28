import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  DirectionsCar as CarIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { vehicleModelService, VehicleModel } from '../services/vehicleModelService';
import { oemService, OEM } from '../services/oemService';

interface VehicleModelManagementProps {}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const VehicleModelManagement: React.FC<VehicleModelManagementProps> = () => {
  const [searchParams] = useSearchParams();
  const preselectedOemId = searchParams.get('oemId');
  
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOemId, setSelectedOemId] = useState<string>(preselectedOemId || '');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; model: VehicleModel | null }>({
    open: false,
    model: null,
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);

  useEffect(() => {
    loadOEMs();
    loadModels();
  }, [selectedOemId]);

  const loadOEMs = async () => {
    try {
      const response = await oemService.getAllOEMs({ isActive: true });
      setOEMs(response.data);
    } catch (error) {
      console.error('Error loading OEMs:', error);
    }
  };

  const loadModels = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedOemId) params.oemId = selectedOemId;
      if (vehicleTypeFilter) params.vehicleType = vehicleTypeFilter;
      
      const response = await vehicleModelService.getAllVehicleModels(params);
      setModels(response.data);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle models',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteDialog.model) return;

    try {
      await vehicleModelService.deleteVehicleModel(deleteDialog.model.id);
      setSnackbar({
        open: true,
        message: 'Vehicle model deleted successfully',
        severity: 'success',
      });
      setDeleteDialog({ open: false, model: null });
      loadModels();
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete vehicle model',
        severity: 'error',
      });
    }
  };

  const handleTogglePopular = async (model: VehicleModel) => {
    try {
      await vehicleModelService.updateVehicleModel(model.id, {
        isPopular: !model.isPopular,
      });
      setSnackbar({
        open: true,
        message: `Model ${model.isPopular ? 'removed from' : 'added to'} popular list`,
        severity: 'success',
      });
      loadModels();
    } catch (error) {
      console.error('Error updating model:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update model',
        severity: 'error',
      });
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, model: VehicleModel) => {
    setAnchorEl(event.currentTarget);
    setSelectedModel(model);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModel(null);
  };

  const handleOemFilterChange = (event: SelectChangeEvent) => {
    setSelectedOemId(event.target.value);
  };

  const handleVehicleTypeFilterChange = (event: SelectChangeEvent) => {
    setVehicleTypeFilter(event.target.value);
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.oem?.name && model.oem.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const vehicleTypes = ['2-wheeler', '3-wheeler', '4-wheeler', 'Commercial'];

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Vehicle Model Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          href="/vehicle-models/new"
          sx={{ px: 3 }}
        >
          Add New Model
        </Button>
      </Box>

      {/* Filters and Search */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          variant="outlined"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by OEM</InputLabel>
          <Select
            value={selectedOemId}
            onChange={handleOemFilterChange}
            label="Filter by OEM"
          >
            <MenuItem value="">
              <em>All OEMs</em>
            </MenuItem>
            {oems.map((oem) => (
              <MenuItem key={oem.id} value={oem.id}>
                {oem.name} ({oem.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Vehicle Type</InputLabel>
          <Select
            value={vehicleTypeFilter}
            onChange={handleVehicleTypeFilterChange}
            label="Vehicle Type"
          >
            <MenuItem value="">
              <em>All Types</em>
            </MenuItem>
            {vehicleTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box display="flex" gap={1} alignItems="center">
          <Chip 
            label={`Total: ${models.length}`} 
            variant="outlined" 
          />
          <Chip 
            label={`Active: ${models.filter(m => m.isActive).length}`} 
            color="success" 
            variant="outlined" 
          />
          <Chip 
            label={`Popular: ${models.filter(m => m.isPopular).length}`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </Box>

      {/* Models Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>OEM</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Battery</TableCell>
              <TableCell>Range</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Popular</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No models found matching your search' : 'No models found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow key={model.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={model.imageUrl}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: 'primary.main' 
                        }}
                      >
                        <CarIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {model.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.modelCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={model.oem?.logoUrl}
                        sx={{ width: 24, height: 24 }}
                      >
                        {model.oem?.code}
                      </Avatar>
                      <Typography variant="body2">
                        {model.oem?.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={model.vehicleType || 'N/A'} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {model.batteryCapacity ? `${model.batteryCapacity}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {model.range ? `${model.range} km` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {model.priceRange || formatCurrency(model.basePrice)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.isActive ? 'Active' : 'Inactive'}
                      color={getStatusColor(model.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleTogglePopular(model)}
                      color={model.isPopular ? 'primary' : 'default'}
                    >
                      {model.isPopular ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(model.createdAt), 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        href={`/vehicle-models/${model.id}/edit`}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, model)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedModel) {
            window.location.href = `/vehicles?modelId=${selectedModel.id}`;
          }
          handleMenuClose();
        }}>
          View Vehicles
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedModel) {
            setDeleteDialog({ open: true, model: selectedModel });
          }
          handleMenuClose();
        }}>
          Delete Model
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, model: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will permanently delete the vehicle model and all associated vehicles.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.model?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, model: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteModel}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleModelManagement;
