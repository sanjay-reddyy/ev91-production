import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  Snackbar,
  Drawer,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
  Skeleton,
  Fade,
  Autocomplete,
  TableSortLabel,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  DirectionsBike as BikeIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Battery20 as BatteryLowIcon,
  Battery80 as BatteryGoodIcon,
  BatteryFull as BatteryFullIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  ClearAll as ClearIcon,
  TableChart as TableIcon,
  GridView as GridIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { usePermissions } from '../hooks/usePermissions';

// Enhanced Types
interface Vehicle {
  id: string;
  make: string;
  model: { name: string; displayName: string; };
  year: number;
  vin: string;
  registrationNumber: string;
  color: string;
  oem: string; // OEM display name for filtering and display
  oemId: string; // OEM ID for reference
  status: string; // Transformed lowercase status for filtering
  rawOperationalStatus: string; // Original backend operationalStatus
  batteryLevel?: number;
  range?: number;
  location?: string;
  lastService?: string;
  nextService?: string;
  mileage?: number;
  operationalHours?: number;
  averageSpeed?: number;
  efficiency?: number;
  lastUpdated?: string;
  assignedDriver?: string;
  totalTrips?: number;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface VehicleStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  retired: number;
  totalMileage: number;
  averageBatteryLevel: number;
  lowBatteryCount: number;
  maintenanceDue: number;
  averageEfficiency: number;
  totalTrips: number;
}

interface VehicleFilters {
  status?: string;
  oem?: string;
  year?: string;
  location?: string;
  batteryLevel?: string;
  maintenanceStatus?: string;
  assignedDriver?: string;
}

interface SortConfig {
  key: keyof Vehicle | null;
  direction: 'asc' | 'desc';
}

// Advanced Vehicle Inventory Component
const VehicleInventoryPage: React.FC = () => {
  console.log('🚀 VehicleInventory: Advanced component rendered');

  const navigate = useNavigate();
  const { hasCreatePermission, hasUpdatePermission, hasDeletePermission, hasReadPermission } = usePermissions();

  // Check if user has read access to vehicles
  if (!hasReadPermission('vehicle', 'vehicles')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view vehicle inventory. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  // Core State Management
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalVehicles, setTotalVehicles] = useState(0); // Total count from backend
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [quickFilters, setQuickFilters] = useState({
    lowBattery: false,
    maintenanceDue: false,
    recentlyUpdated: false,
  });

  // UI State
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = 30000; // 30 seconds

  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Enhanced Status Colors - mapping backend operationalStatus to frontend status
  const statusConfig: Record<string, { color: any; icon: any; label: string }> = {
    active: { color: 'success', icon: SuccessIcon, label: 'Active' },
    available: { color: 'success', icon: SuccessIcon, label: 'Available' },
    assigned: { color: 'info', icon: PendingIcon, label: 'Assigned' },
    inactive: { color: 'default', icon: PendingIcon, label: 'Inactive' },
    maintenance: { color: 'warning', icon: WarningIcon, label: 'Maintenance' },
    'under maintenance': { color: 'warning', icon: WarningIcon, label: 'Under Maintenance' },
    retired: { color: 'error', icon: ErrorIcon, label: 'Retired' },
    damaged: { color: 'error', icon: ErrorIcon, label: 'Damaged' },
  };

  // Memoized calculations - with backend pagination, displayedVehicles is just the current vehicles
  const displayedVehicles = useMemo(() => {
    console.log('🔍 Pagination Debug:', {
      totalVehicles: totalVehicles,
      currentPageVehicles: vehicles.length,
      currentPage: page,
      rowsPerPage: rowsPerPage,
      backendPagination: true
    });

    // With backend pagination, we don't need to slice - the backend already returns the right page
    return vehicles;
  }, [vehicles, totalVehicles, page, rowsPerPage]);

  // Enhanced data loading with retry logic
  const loadVehicles = useCallback(async (showLoader = true) => {
    try {
      console.log('📡 VehicleInventory: Loading vehicles data...');

      if (showLoader) setLoading(true);
      setError(null);

      // Load vehicles with backend pagination instead of client-side
      const vehiclesResponse = await vehicleService.getVehicles(
        {
          search: searchQuery || undefined,
          operationalStatus: filters.status || undefined,
          oemType: filters.oem || undefined,
          location: filters.location || undefined,
        },
        {
          page: page + 1, // Backend uses 1-based pagination
          limit: rowsPerPage, // Use actual rows per page for backend pagination
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }
      );

      console.log('✅ VehicleInventory: Vehicles loaded:', vehiclesResponse);
      console.log('📊 Vehicle data debug:', {
        totalVehiclesFromAPI: (vehiclesResponse.vehicles || vehiclesResponse.data || []).length,
        hasMorePages: vehiclesResponse.pagination?.totalPages > 1,
        currentPage: vehiclesResponse.pagination?.currentPage,
        totalPages: vehiclesResponse.pagination?.totalPages,
        totalItems: vehiclesResponse.pagination?.totalItems
      });

      // Transform the data to match the frontend interface
      const transformedVehicles = (vehiclesResponse.vehicles || vehiclesResponse.data || []).map((vehicle: any) => ({
        ...vehicle,
        make: vehicle.model?.oem?.displayName || vehicle.model?.oem?.name || 'Unknown',
        oem: vehicle.model?.oem?.displayName || vehicle.model?.oem?.name || 'Unknown', // Store OEM name for filtering
        oemId: vehicle.model?.oem?.id || 'unknown', // Store OEM ID for reference
        batteryLevel: vehicle.batteryCapacity || Math.floor(Math.random() * 100), // Use batteryCapacity or generate random for demo
        range: vehicle.maxRange || 0,
        status: (vehicle.operationalStatus || 'unknown').toLowerCase().replace(/\s+/g, ' ').trim(),
        rawOperationalStatus: vehicle.operationalStatus || 'unknown', // Keep original for filtering
        lastUpdated: vehicle.updatedAt,
        vin: vehicle.chassisNumber || vehicle.registrationNumber,
        location: vehicle.location || vehicle.hub?.name || vehicle.hub?.city?.displayName || 'Unknown',
      }));

      setVehicles(transformedVehicles);
      setTotalVehicles(vehiclesResponse.pagination?.totalItems || transformedVehicles.length);
      console.log('🚗 Vehicles after transformation:', {
        totalTransformed: transformedVehicles.length,
        totalCount: vehiclesResponse.pagination?.totalItems || transformedVehicles.length,
        currentPage: vehiclesResponse.pagination?.currentPage,
        totalPages: vehiclesResponse.pagination?.totalPages,
        first5VehicleIds: transformedVehicles.slice(0, 5).map((v: Vehicle) => v.id)
      });

      // Load enhanced stats
      const statsResponse = await vehicleService.getVehicleStats();
      console.log('✅ VehicleInventory: Stats loaded:', statsResponse);

      // Extract and map the stats data to match our interface
      if (statsResponse.success && statsResponse.data) {
        const statsData = statsResponse.data;
        const mappedStats: VehicleStats = {
          total: statsData.totalVehicles || 0,
          active: statsData.activeVehicles || statsData.availableVehicles || 0,
          inactive: statsData.inactiveVehicles || 0,
          maintenance: statsData.underMaintenance || 0,
          retired: statsData.retired || 0,
          totalMileage: 0, // This would need to be calculated from vehicle data
          averageBatteryLevel: 0, // This would need to be calculated from vehicle data
          lowBatteryCount: 0, // This would need to be calculated from vehicle data
          maintenanceDue: 0, // This would need to be calculated from vehicle data
          averageEfficiency: 0, // This would need to be calculated from vehicle data
          totalTrips: 0, // This would need to be calculated from vehicle data
        };
        setStats(mappedStats);
      } else {
        // Fallback: calculate stats from the loaded vehicles
        const calculatedStats: VehicleStats = {
          total: transformedVehicles.length,
          active: transformedVehicles.filter((v: Vehicle) => ['available', 'assigned'].includes(v.status)).length,
          inactive: transformedVehicles.filter((v: Vehicle) => ['retired', 'damaged'].includes(v.status)).length,
          maintenance: transformedVehicles.filter((v: Vehicle) => ['maintenance', 'under maintenance'].includes(v.status)).length,
          retired: transformedVehicles.filter((v: Vehicle) => v.status === 'retired').length,
          totalMileage: transformedVehicles.reduce((sum: number, v: Vehicle) => sum + (v.mileage || 0), 0),
          averageBatteryLevel: transformedVehicles.length > 0
            ? transformedVehicles.reduce((sum: number, v: Vehicle) => sum + (v.batteryLevel || 0), 0) / transformedVehicles.length
            : 0,
          lowBatteryCount: transformedVehicles.filter((v: Vehicle) => (v.batteryLevel || 0) < 20).length,
          maintenanceDue: transformedVehicles.filter((v: Vehicle) => {
            if (!v.nextService) return false;
            return new Date(v.nextService) <= new Date();
          }).length,
          averageEfficiency: transformedVehicles.length > 0
            ? transformedVehicles.reduce((sum: number, v: Vehicle) => sum + (v.efficiency || 0), 0) / transformedVehicles.length
            : 0,
          totalTrips: transformedVehicles.reduce((sum: number, v: Vehicle) => sum + (v.totalTrips || 0), 0),
        };
        setStats(calculatedStats);
      }

    } catch (error) {
      console.error('❌ VehicleInventory: Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vehicle data');
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle data. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, page, rowsPerPage]); // Add page and rowsPerPage dependencies

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing vehicle data...');
      loadVehicles(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadVehicles]);

  // Effects
  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    // Reload data when pagination or filters change
    loadVehicles();
  }, [loadVehicles]);

  // Enhanced Event Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehicles();
  }, [loadVehicles]);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleFilterChange = useCallback((filterType: keyof VehicleFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value || undefined,
    }));
  }, []);

  const handleQuickFilterChange = useCallback((filter: keyof typeof quickFilters, checked: boolean) => {
    setQuickFilters(prev => ({
      ...prev,
      [filter]: checked,
    }));
  }, []);

  const handleSort = useCallback((key: keyof Vehicle) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setQuickFilters({
      lowBattery: false,
      maintenanceDue: false,
      recentlyUpdated: false,
    });
    setSearchQuery('');
  }, []);

  const handlePageChange = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('📄 Rows per page changing:', {
      oldValue: rowsPerPage,
      newValue: newRowsPerPage,
      resetPage: true
    });
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, [rowsPerPage]);

  // Navigation handlers
  const handleAddVehicle = useCallback(() => {
    navigate('/vehicles/add');
  }, [navigate]);

  const handleEditVehicle = useCallback((vehicleId: string) => {
    navigate(`/vehicles/edit/${vehicleId}`);
  }, [navigate]);

  const handleViewVehicle = useCallback((vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`); // Now unified to use VehicleProfile
  }, [navigate]);

  // Enhanced vehicle actions
  const handleArchiveVehicle = useCallback(async (vehicleId: string) => {
    try {
      await vehicleService.updateVehicleStatus(vehicleId, 'Retired', 'Archived by admin');
      setSnackbar({
        open: true,
        message: 'Vehicle archived successfully',
        severity: 'success',
      });
      loadVehicles(false);
    } catch (error) {
      console.error('Error archiving vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to archive vehicle',
        severity: 'error',
      });
    }
  }, [loadVehicles]);

  const handleExportData = useCallback(() => {
    // Implement data export
    const csvData = vehicles.map(vehicle => ({
      VIN: vehicle.vin,
      Make: vehicle.make,
      Model: vehicle.model,
      Year: vehicle.year,
      Status: vehicle.status,
      'Battery Level': vehicle.batteryLevel,
      'Mileage': vehicle.mileage,
      Location: vehicle.location,
    }));

    const csvContent = "data:text/csv;charset=utf-8,"
      + "VIN,Make,Model,Year,Status,Battery Level,Mileage,Location\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({
      open: true,
      message: 'Vehicle data exported successfully',
      severity: 'success',
    });
  }, [vehicles]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Helper functions
  const getBatteryIcon = (level?: number) => {
    if (!level) return BatteryLowIcon;
    if (level < 20) return BatteryLowIcon;
    if (level < 80) return BatteryGoodIcon;
    return BatteryFullIcon;
  };

  const getBatteryColor = (level?: number) => {
    if (!level || level < 20) return 'error';
    if (level < 50) return 'warning';
    return 'success';
  };

  const getUniqueLocations = useMemo(() => {
    return [...new Set(vehicles.map(v => v.location).filter(Boolean))];
  }, [vehicles]);

  const getUniqueOEMs = useMemo(() => {
    return [...new Set(vehicles.map(v => v.oem).filter(Boolean))];
  }, [vehicles]);

  const getUniqueYears = useMemo(() => {
    return [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a);
  }, [vehicles]);

  // Loading skeleton
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[...Array(5)].map((_, i) => (
            <Grid item xs={12} sm={6} md={2.4} key={i}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="80%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="100%" height={60} />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="text" width="100%" height={60} sx={{ my: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Enhanced Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Vehicle Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor your vehicle fleet
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-refresh"
              sx={{ mr: 2 }}
            />

            <Tooltip title="Filter vehicles">
              <IconButton onClick={() => setFilterDrawerOpen(true)}>
                <Badge badgeContent={Object.keys(filters).length} color="primary">
                  <FilterIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={refreshing ? "Refreshing..." : "Refresh data"}>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon className={refreshing ? 'rotating' : ''} />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportData}
            >
              Export
            </Button>

            {hasCreatePermission('vehicle', 'vehicles') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddVehicle}
              >
                Add Vehicle
              </Button>
            )}
          </Box>
        </Box>

        {/* Enhanced Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="primary.main">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Vehicles
                      </Typography>
                    </Box>
                    <BikeIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {stats.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active
                      </Typography>
                    </Box>
                    <SuccessIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {stats.maintenance}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Maintenance
                      </Typography>
                    </Box>
                    <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {stats.inactive}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Inactive
                      </Typography>
                    </Box>
                    <PendingIcon color="info" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        {/* Enhanced Search and Quick Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search vehicles by VIN, make, model, registration..."
                  value={searchQuery}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quickFilters.lowBattery}
                        onChange={(e) => handleQuickFilterChange('lowBattery', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Low Battery"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quickFilters.maintenanceDue}
                        onChange={(e) => handleQuickFilterChange('maintenanceDue', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Maintenance Due"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quickFilters.recentlyUpdated}
                        onChange={(e) => handleQuickFilterChange('recentlyUpdated', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Recently Updated"
                  />
                </Box>
              </Grid>
            </Grid>

            {(Object.keys(filters).length > 0 || Object.values(quickFilters).some(Boolean)) && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Active filters:
                </Typography>
                {Object.entries(filters).map(([key, value]) => value && (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key as keyof VehicleFilters, '')}
                  />
                ))}
                {Object.entries(quickFilters).map(([key, value]) => value && (
                  <Chip
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    size="small"
                    onDelete={() => handleQuickFilterChange(key as keyof typeof quickFilters, false)}
                  />
                ))}
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Vehicles Table */}
        <Paper variant="outlined">
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Vehicles ({totalVehicles})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Table view">
                <IconButton
                  color={viewMode === 'table' ? 'primary' : 'default'}
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Grid view">
                <IconButton
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <GridIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'vin'}
                      direction={sortConfig.key === 'vin' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('vin')}
                    >
                      VIN
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'status'}
                      direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Battery</TableCell>
                  <TableCell>Range</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedVehicles.map((vehicle) => {
                  const StatusIcon = statusConfig[vehicle.status]?.icon;
                  const BatteryIcon = getBatteryIcon(vehicle.batteryLevel);

                  return (
                    <TableRow key={vehicle.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => handleViewVehicle(vehicle.id)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                            <BikeIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {vehicle.registrationNumber || 'No Registration'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.make} {vehicle.model?.displayName} • {vehicle.year}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.875rem' }}>
                          {vehicle.vin}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={StatusIcon ? <StatusIcon /> : <PendingIcon />}
                          label={statusConfig[vehicle.status]?.label || 'Unknown'}
                          color={statusConfig[vehicle.status]?.color || 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        {vehicle.batteryLevel !== undefined ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BatteryIcon color={getBatteryColor(vehicle.batteryLevel)} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {vehicle.batteryLevel}%
                            </Typography>
                            <Box sx={{ width: 50, ml: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={vehicle.batteryLevel}
                                color={getBatteryColor(vehicle.batteryLevel)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {vehicle.range ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SpeedIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {vehicle.range} km
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {vehicle.location || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {vehicle.lastUpdated ? (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(vehicle.lastUpdated).toLocaleDateString()}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewVehicle(vehicle.id);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {hasUpdatePermission('vehicle', 'vehicles') && (
                            <Tooltip title="Edit Vehicle">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVehicle(vehicle.id);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {hasDeletePermission('vehicle', 'vehicles') && (
                            <Tooltip title="Archive Vehicle">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveVehicle(vehicle.id);
                                }}
                              >
                                <ArchiveIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalVehicles > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalVehicles}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              showFirstButton
              showLastButton
            />
          )}

          {totalVehicles === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No vehicles found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalVehicles === 0
                  ? "No vehicles have been added yet."
                  : "Try adjusting your search or filter criteria."
                }
              </Typography>
              {totalVehicles === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddVehicle}
                  sx={{ mt: 2 }}
                >
                  Add First Vehicle
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: 320, p: 2 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active (Available + Assigned)</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="maintenance">Under Maintenance</MenuItem>
                <MenuItem value="inactive">Inactive (Retired + Damaged)</MenuItem>
                <MenuItem value="retired">Retired</MenuItem>
                <MenuItem value="damaged">Damaged</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>OEM</InputLabel>
              <Select
                value={filters.oem || ''}
                onChange={(e) => handleFilterChange('oem', e.target.value)}
                label="OEM"
              >
                <MenuItem value="">All</MenuItem>
                {getUniqueOEMs.map((oemName) => (
                  <MenuItem key={oemName} value={oemName}>
                    {oemName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={getUniqueYears}
              value={filters.year ? parseInt(filters.year) : null}
              onChange={(_, value) => handleFilterChange('year', value?.toString() || '')}
              renderInput={(params) => (
                <TextField {...params} label="Year" fullWidth />
              )}
            />

            <Autocomplete
              options={getUniqueLocations}
              value={filters.location || null}
              onChange={(_, value) => handleFilterChange('location', value || '')}
              renderInput={(params) => (
                <TextField {...params} label="Location" fullWidth />
              )}
            />

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear All Filters
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* Enhanced Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* CSS for animations */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .rotating {
              animation: spin 1s linear infinite;
            }
          `}
        </style>
      </Box>
    </Fade>
  );
};

export default VehicleInventoryPage;
