import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ActiveIcon,
  Warning as InactiveIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import vehicleService, { City } from '../services/vehicleService';

// Define comprehensive city interface based on backend schema
interface ExtendedCity extends City {
  timezone?: string;
  pinCodeRange?: string;
  regionCode?: string;
  launchDate?: string;
  estimatedPopulation?: number;
  marketPotential?: number;
  version?: number;
  eventSequence?: number;
  hubCount?: number;
  vehicleCount?: number;
}

interface CityStats {
  totalCities: number;
  activeCities: number;
  operationalCities: number;
  recentlyAdded: number;
  avgPopulation: number;
  topMarkets: { name: string; potential: number }[];
}

interface CityFilters {
  search: string;
  state: string;
  country: string;
  isActive: boolean | null;
  isOperational: boolean | null;
  region: string;
}

const CityManagement: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [cities, setCities] = useState<ExtendedCity[]>([]);
  const [filteredCities, setFilteredCities] = useState<ExtendedCity[]>([]);
  const [stats, setStats] = useState<CityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCity, setSelectedCity] = useState<ExtendedCity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<ExtendedCity | null>(null);

  // Filters and search
  const [filters, setFilters] = useState<CityFilters>({
    search: '',
    state: '',
    country: '',
    isActive: null,
    isOperational: null,
    region: ''
  });

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Fetch cities data
  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getCities();
      if (response.success) {
        setCities(response.data);
        setFilteredCities(response.data);
        calculateStats(response.data);
      } else {
        showSnackbar('Failed to fetch cities', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching cities:', error);
      showSnackbar('Error fetching cities', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (cityData: ExtendedCity[]) => {
    const totalCities = cityData.length;
    const activeCities = cityData.filter(city => city.isActive).length;
    const operationalCities = cityData.filter(city => city.isOperational).length;
    const recentlyAdded = cityData.filter(city => {
      const createdDate = new Date(city.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;

    const avgPopulation = cityData.reduce((sum, city) =>
      sum + (city.estimatedPopulation || 0), 0) / totalCities;

    const topMarkets = cityData
      .filter(city => city.marketPotential)
      .sort((a, b) => (b.marketPotential || 0) - (a.marketPotential || 0))
      .slice(0, 5)
      .map(city => ({ name: city.name, potential: city.marketPotential || 0 }));

    setStats({
      totalCities,
      activeCities,
      operationalCities,
      recentlyAdded,
      avgPopulation,
      topMarkets
    });
  };

  // Filter cities based on current filters
  useEffect(() => {
    let filtered = cities.filter(city => {
      const matchesSearch = !filters.search ||
        city.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        city.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        city.state.toLowerCase().includes(filters.search.toLowerCase());

      const matchesState = !filters.state || city.state === filters.state;
      const matchesCountry = !filters.country || city.country === filters.country;
      const matchesActive = filters.isActive === null || city.isActive === filters.isActive;
      const matchesOperational = filters.isOperational === null || city.isOperational === filters.isOperational;
      const matchesRegion = !filters.region || city.regionCode === filters.region;

      return matchesSearch && matchesState && matchesCountry &&
             matchesActive && matchesOperational && matchesRegion;
    });

    setFilteredCities(filtered);
  }, [cities, filters]);

  // Load data on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewCity = (city: ExtendedCity) => {
    setSelectedCity(city);
    setDialogOpen(true);
  };

  const handleEditCity = (city: ExtendedCity) => {
    navigate(`/cities/${city.id}/edit`);
  };

  const handleDeleteCity = (city: ExtendedCity) => {
    setCityToDelete(city);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCity = async () => {
    if (!cityToDelete) return;

    try {
      await vehicleService.deleteCity(cityToDelete.id);
      showSnackbar('City deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setCityToDelete(null);
      fetchCities(); // Refresh data after deletion
    } catch (error) {
      showSnackbar('Error deleting city', 'error');
    }
  };

  const getStatusChip = (city: ExtendedCity) => {
    if (!city.isActive) {
      return <Chip label="Inactive" color="error" size="small" icon={<InactiveIcon />} />;
    }
    if (city.isOperational) {
      return <Chip label="Operational" color="success" size="small" icon={<ActiveIcon />} />;
    }
    return <Chip label="Active" color="warning" size="small" icon={<ScheduleIcon />} />;
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number | undefined) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
  };

  // Get unique values for filter dropdowns
  const uniqueStates = [...new Set(cities.map(city => city.state))].sort();
  const uniqueCountries = [...new Set(cities.map(city => city.country))].sort();
  const uniqueRegions = [...new Set(cities.map(city => city.regionCode).filter(Boolean))].sort();

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            City Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage cities, regions, and operational areas for your fleet
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/cities/add')}
          size="large"
        >
          Add New City
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Total Cities
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalCities}
                    </Typography>
                  </Box>
                  <PublicIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Active Cities
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.activeCities}
                    </Typography>
                  </Box>
                  <ActiveIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Operational
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.operationalCities}
                    </Typography>
                  </Box>
                  <BusinessIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Recently Added
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.recentlyAdded}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="All Cities" icon={<PublicIcon />} />
          <Tab label="Market Analysis" icon={<AssessmentIcon />} />
          <Tab label="Geographic View" icon={<MapIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters & Search
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Search Cities"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={filters.state}
                      label="State"
                      onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    >
                      <MenuItem value="">All States</MenuItem>
                      {uniqueStates.map(state => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={filters.country}
                      label="Country"
                      onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    >
                      <MenuItem value="">All Countries</MenuItem>
                      {uniqueCountries.map(country => (
                        <MenuItem key={country} value={country}>{country}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.isActive === null ? '' : filters.isActive ? 'active' : 'inactive'}
                      label="Status"
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilters({
                          ...filters,
                          isActive: value === '' ? null : value === 'active'
                        });
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Operational</InputLabel>
                    <Select
                      value={filters.isOperational === null ? '' : filters.isOperational ? 'operational' : 'not_operational'}
                      label="Operational"
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilters({
                          ...filters,
                          isOperational: value === '' ? null : value === 'operational'
                        });
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="operational">Operational</MenuItem>
                      <MenuItem value="not_operational">Not Operational</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={1}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({
                      search: '',
                      state: '',
                      country: '',
                      isActive: null,
                      isOperational: null,
                      region: ''
                    })}
                    fullWidth
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Loading indicator */}
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Cities Table */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Cities ({filteredCities.length})
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>City</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Population</TableCell>
                      <TableCell>Market Potential</TableCell>
                      <TableCell>Launch Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCities.map((city) => (
                      <TableRow key={city.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {city.displayName || city.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {city.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={city.code} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                            <Box>
                              <Typography variant="body2">
                                {city.state}, {city.country}
                              </Typography>
                              {city.regionCode && (
                                <Typography variant="caption" color="text.secondary">
                                  Region: {city.regionCode}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{getStatusChip(city)}</TableCell>
                        <TableCell>{formatNumber(city.estimatedPopulation)}</TableCell>
                        <TableCell>{formatCurrency(city.marketPotential)}</TableCell>
                        <TableCell>
                          {city.launchDate ? format(parseISO(city.launchDate), 'dd MMM yyyy') : 'Not Set'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewCity(city)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit City">
                              <IconButton size="small" onClick={() => handleEditCity(city)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete City">
                              <IconButton size="small" onClick={() => handleDeleteCity(city)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredCities.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No cities found matching your criteria
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Market Analysis Tab */}
      {activeTab === 1 && stats && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Top Markets by Potential
                </Typography>
                {stats.topMarkets.map((market, index) => (
                  <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{market.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(market.potential)}
                    </Typography>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Population Statistics
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Average Population
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(Math.round(stats.avgPopulation))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Geographic View Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Interactive map view coming soon...
            </Typography>
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>Cities by State</Typography>
              {uniqueStates.map(state => (
                <Box key={state} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{state}</Typography>
                  <Chip
                    label={cities.filter(city => city.state === state).length}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* City Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          City Details
        </DialogTitle>
        <DialogContent>
          {selectedCity && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Display Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.displayName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Code</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">State</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.state}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.country}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Timezone</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.timezone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Coordinates</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedCity.latitude}, {selectedCity.longitude}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box gutterBottom>{getStatusChip(selectedCity)}</Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Population</Typography>
                <Typography variant="body1" gutterBottom>
                  {formatNumber(selectedCity.estimatedPopulation)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Market Potential</Typography>
                <Typography variant="body1" gutterBottom>
                  {formatCurrency(selectedCity.marketPotential)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Launch Date</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedCity.launchDate ? format(parseISO(selectedCity.launchDate), 'dd MMM yyyy') : 'Not Set'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Pin Code Range</Typography>
                <Typography variant="body1" gutterBottom>{selectedCity.pinCodeRange || 'N/A'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {selectedCity && (
            <Button
              variant="contained"
              onClick={() => {
                setDialogOpen(false);
                handleEditCity(selectedCity);
              }}
            >
              Edit City
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the city "{cityToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteCity}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CityManagement;
