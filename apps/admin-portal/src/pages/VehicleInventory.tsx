import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  DirectionsBike as BikeIcon,
  Build as ServiceIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { vehicleService, Vehicle, VehicleStats, VehicleFilters } from '../services/vehicleService';

  const statusColors = {
    'Available': 'success',
    'Assigned': 'info',
    'Under Maintenance': 'warning',
    'Retired': 'error',
    'Damaged': 'error',
  } as const;const oemLogos: Record<string, string> = {
  'Ather': '🏍️',
  'Ola': '⚡',
  'TVS': '🏁',
  'Bajaj': '🔧',
  'Hero': '⭐',
  'Other': '🛵',
};

const VehicleInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [oems, setOems] = useState<Array<{id: string, name: string, displayName: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy] = useState('updatedAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filters
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Archive dialog
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
  }>({
    open: false,
    vehicle: null,
  });

  // Load data
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, statsResponse, oemsResponse] = await Promise.all([
        vehicleService.getVehicles(
          { ...filters, search: searchQuery },
          { page: page + 1, limit: rowsPerPage, sortBy, sortOrder }
        ),
        vehicleService.getVehicleStats(),
        vehicleService.getOEMs()
      ]);

      setVehicles(vehiclesResponse.data);
      setTotalCount(vehiclesResponse.pagination?.totalItems || 0);
      setStats(statsResponse.data);
      setOems(oemsResponse.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicles. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [page, rowsPerPage, sortBy, sortOrder, filters, searchQuery]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleFilterChange = (key: keyof VehicleFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(0);
  };

  const handleArchiveVehicle = async () => {
    if (!archiveDialog.vehicle) return;

    try {
      await vehicleService.updateVehicleStatus(
        archiveDialog.vehicle.id,
        'Retired',
        'Archived by admin'
      );
      
      setSnackbar({
        open: true,
        message: 'Vehicle archived successfully',
        severity: 'success',
      });
      
      setArchiveDialog({ open: false, vehicle: null });
      loadVehicles();
    } catch (error) {
      console.error('Error archiving vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to archive vehicle. Please try again.',
        severity: 'error',
      });
    }
  };

  const getServiceDueStatus = (vehicle: Vehicle) => {
    if (!vehicle.nextServiceDue) return 'unknown';
    
    const daysUntilService = Math.ceil(
      (new Date(vehicle.nextServiceDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilService < 0) return 'overdue';
    if (daysUntilService <= 7) return 'due-soon';
    return 'ok';
  };

  const getDamageCount = (vehicle: Vehicle) => {
    return vehicle.damageRecords?.filter(d => d.damageStatus !== 'Resolved').length || 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Vehicle Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vehicles/add')}
          size="large"
        >
          Add Vehicle
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BikeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Vehicles</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalVehicles.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ActiveIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {(stats.vehiclesByServiceStatus?.Active || stats.vehiclesByStatus?.Available || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ServiceIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Under Service</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {(stats.vehiclesByStatus?.['Under Maintenance'] || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Services Due</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {(stats.vehiclesByServiceStatus?.['Scheduled for Service'] || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>OEM Type</InputLabel>
                <Select
                  value={filters.oemType || ''}
                  onChange={(e) => handleFilterChange('oemType', e.target.value)}
                >
                  <MenuItem value="">All OEMs</MenuItem>
                  {oems.map((oem) => (
                    <MenuItem key={oem.id} value={oem.name}>
                      {oem.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.operationalStatus || ''}
                  onChange={(e) => handleFilterChange('operationalStatus', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  <MenuItem value="Bangalore">Bangalore</MenuItem>
                  <MenuItem value="Mumbai">Mumbai</MenuItem>
                  <MenuItem value="Delhi">Delhi</MenuItem>
                  <MenuItem value="Chennai">Chennai</MenuItem>
                  <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                  <MenuItem value="Pune">Pune</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={!Object.keys(filters).length && !searchQuery}
                >
                  Clear Filters
                </Button>
                <IconButton onClick={loadVehicles} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Registration</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Service Due</TableCell>
                <TableCell>Damage Reports</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    Loading vehicles...
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => {
                  const serviceDueStatus = getServiceDueStatus(vehicle);
                  const damageCount = getDamageCount(vehicle);
                  const vehicleAge = Math.floor(
                    (Date.now() - new Date(vehicle.purchaseDate || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 365)
                  );

                  return (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                            {oemLogos[vehicle.model?.oem?.name || ''] || '🛵'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {vehicle.model?.oem?.name} {vehicle.model?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.mileage.toLocaleString()} km
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {vehicle.registrationNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicleAge} year{vehicleAge !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.operationalStatus}
                          color={statusColors[vehicle.operationalStatus]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {vehicle.nextServiceDue ? (
                          <Chip
                            label={
                              serviceDueStatus === 'overdue'
                                ? 'Overdue'
                                : serviceDueStatus === 'due-soon'
                                ? 'Due Soon'
                                : 'OK'
                            }
                            color={
                              serviceDueStatus === 'overdue'
                                ? 'error'
                                : serviceDueStatus === 'due-soon'
                                ? 'warning'
                                : 'success'
                            }
                            size="small"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not scheduled
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {damageCount > 0 ? (
                          <Chip
                            label={`${damageCount} open`}
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Typography variant="caption" color="success.main">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicle.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Vehicle">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {vehicle.operationalStatus !== 'Retired' && (
                            <Tooltip title="Archive Vehicle">
                              <IconButton
                                size="small"
                                onClick={() => setArchiveDialog({ open: true, vehicle })}
                              >
                                <ArchiveIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Archive Dialog */}
      <Dialog
        open={archiveDialog.open}
        onClose={() => setArchiveDialog({ open: false, vehicle: null })}
      >
        <DialogTitle>Archive Vehicle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to archive{' '}
            <strong>
              {archiveDialog.vehicle?.model?.oem?.name} {archiveDialog.vehicle?.model?.name} (
              {archiveDialog.vehicle?.registrationNumber})
            </strong>
            ? This will mark the vehicle as retired and it will no longer be available for assignments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialog({ open: false, vehicle: null })}>
            Cancel
          </Button>
          <Button onClick={handleArchiveVehicle} color="error" variant="contained">
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleInventoryPage;
