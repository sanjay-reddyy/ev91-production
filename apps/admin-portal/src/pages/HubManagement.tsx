import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fab,
  Tooltip,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  ElectricCar as ChargingIcon,
  Build as ServiceIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { hubService, cityService, type HubResponse, type City, type HubFilters } from '../services/hubService';

const HubManagement: React.FC = () => {
  const navigate = useNavigate();
  const [hubs, setHubs] = useState<HubResponse[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hubToDelete, setHubToDelete] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<HubFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load cities and hubs in parallel
      const [hubsData, citiesData] = await Promise.all([
        hubService.getHubs(),
        cityService.getOperationalCities()
      ]);
      
      setHubs(hubsData);
      setCities(citiesData);
    } catch (err) {
      console.error('Error loading hub data:', err);
      setError('Failed to load hub data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      const filterParams = {
        ...filters,
        search: searchTerm || undefined
      };
      
      const filteredHubs = await hubService.getHubs(filterParams);
      setHubs(filteredHubs);
    } catch (err) {
      console.error('Error applying filters:', err);
    }
  };

  const handleDeleteHub = async () => {
    if (!hubToDelete) return;

    try {
      await hubService.deleteHub(hubToDelete);
      setHubs(hubs.filter(hub => hub.id !== hubToDelete));
      setDeleteDialogOpen(false);
      setHubToDelete(null);
    } catch (err) {
      console.error('Error deleting hub:', err);
      setError('Failed to delete hub. Please try again.');
    }
  };

  const openDeleteDialog = (hubId: string) => {
    setHubToDelete(hubId);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getHubTypeIcon = (hubType: string) => {
    switch (hubType.toLowerCase()) {
      case 'charging':
        return <ChargingIcon />;
      case 'service':
        return <ServiceIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    return city?.name || 'Unknown';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Hub Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/hubs/new')}
          sx={{ ml: 2 }}
        >
          Add New Hub
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, or address"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select
                  value={filters.cityId || ''}
                  onChange={(e) => setFilters({ ...filters, cityId: e.target.value || undefined })}
                  label="City"
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Hub Type</InputLabel>
                <Select
                  value={filters.hubType || ''}
                  onChange={(e) => setFilters({ ...filters, hubType: e.target.value || undefined })}
                  label="Hub Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Storage">Storage</MenuItem>
                  <MenuItem value="Service">Service</MenuItem>
                  <MenuItem value="Charging">Charging</MenuItem>
                  <MenuItem value="Mixed">Mixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Hub Grid */}
      <Grid container spacing={3}>
        {hubs.map((hub) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={hub.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="h3" noWrap>
                      {hub.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hub.code}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    {getHubTypeIcon(hub.hubType)}
                  </Box>
                </Box>

                {/* Status and Type */}
                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={hub.status}
                    color={getStatusColor(hub.status) as any}
                    size="small"
                  />
                  <Chip
                    label={hub.hubType}
                    variant="outlined"
                    size="small"
                  />
                  {hub.is24x7 && (
                    <Chip
                      label="24x7"
                      color="primary"
                      size="small"
                    />
                  )}
                </Stack>

                {/* Location */}
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {getCityName(hub.cityId)}
                  </Typography>
                </Box>

                {/* Address */}
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {hub.address}
                </Typography>

                {/* Features */}
                <Box mb={2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {hub.hasChargingStation && (
                      <Chip
                        icon={<ChargingIcon />}
                        label="Charging"
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    )}
                    {hub.hasServiceCenter && (
                      <Chip
                        icon={<ServiceIcon />}
                        label="Service"
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </Stack>
                </Box>

                {/* Capacity Info */}
                <Box mb={2}>
                  {hub.vehicleCapacity && (
                    <Typography variant="body2" color="text.secondary">
                      Capacity: {hub.vehicleCapacity} vehicles
                    </Typography>
                  )}
                  {hub.vehicleCount !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Current: {hub.vehicleCount} vehicles
                    </Typography>
                  )}
                </Box>

                {/* Manager Info */}
                {hub.managerName && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Manager: {hub.managerName}
                  </Typography>
                )}
                {hub.contactNumber && (
                  <Typography variant="body2" color="text.secondary">
                    Contact: {hub.contactNumber}
                  </Typography>
                )}
              </CardContent>

              {/* Actions */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    size="small"
                    onClick={() => navigate(`/hubs/${hub.id}`)}
                  >
                    View Details
                  </Button>
                  <Box>
                    <Tooltip title="Edit Hub">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/hubs/${hub.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Hub">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(hub.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {hubs.length === 0 && !loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
        >
          <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hubs found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Get started by adding your first hub'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/hubs/new')}
          >
            Add New Hub
          </Button>
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/hubs/new')}
      >
        <AddIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Hub</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this hub? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteHub} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HubManagement;
