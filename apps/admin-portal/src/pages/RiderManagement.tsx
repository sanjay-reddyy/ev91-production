import React, { useState, useEffect, useCallback } from 'react'

/**
 * PAGINATION FIX IMPLEMENTATION
 *
 * Updated pagination to match the VehicleInventory implementation:
 * 1. Using TablePagination component for consistent UI
 * 2. Moved loadRiders into a useCallback to ensure consistent dependencies
 * 3. Improved error handling and state management for pagination
 * 4. Added enhanced logging for better debugging
 *
 * To debug pagination issues:
 * - Check browser console for detailed request/response logs
 * - Verify that page parameters are correctly passed to the backend
 * - Ensure backend is returning the correct page of results
 */
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Avatar,
  Stack,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { riderService, Rider } from '../services'
import EnhancedRiderForm from '../components/EnhancedRiderForm'

const REGISTRATION_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'incomplete', label: 'Incomplete', color: 'default' },
]

const KYC_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'incomplete', label: 'Incomplete', color: 'default' },
  { value: 'submitted', label: 'Submitted', color: 'info' },
  { value: 'review', label: 'Under Review', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'verified', label: 'Verified', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
]

interface RiderFormData {
  name: string
  phone: string
  email: string
  dob: string
  address1: string
  address2: string
  city: string
  state: string
  pincode: string
  aadharNumber: string
  panNumber: string
  drivingLicenseNumber: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

const RiderManagement: React.FC = () => {
  const navigate = useNavigate()
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRider, setEditingRider] = useState<Rider | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [kycStatusFilter, setKycStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [cities, setCities] = useState<Array<{id: string; name: string}>>([])
  const [stores, setStores] = useState<Array<{id: string; storeName: string; storeCode: string}>>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingStores, setLoadingStores] = useState(false)
  const [stats, setStats] = useState({
    totalRiders: 0,
    activeRiders: 0,
    pendingRegistrations: 0,
    pendingKYC: 0,
    verifiedRiders: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
  })

  // Enhanced loadRiders function with useCallback for consistent dependency tracking
  // Track when filters are being applied
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);

  const loadRiders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      // Check if we have any active filters to show in the UI
      const hasActiveFilters = !!(
        searchTerm ||
        kycStatusFilter ||
        cityFilter ||
        storeFilter
      );
      setFiltersApplied(hasActiveFilters);

      // Create a unique request ID for tracking this request in logs
      const requestId = Date.now().toString();
      console.log('📡 RiderManagement: Loading riders data...', {
        requestId,
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
        filters: {
          search: searchTerm,
          kycStatus: kycStatusFilter,
          city: cityFilter,
          storeId: storeFilter
        }
      });

      // Use riderService instead of direct fetch for consistent API handling
      console.log('🔍 REQUEST - KYC Status Filter:', {
        kycStatusFilter,
        willSendToAPI: kycStatusFilter || undefined
      });

      const response = await riderService.getRiders({
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
        search: searchTerm || undefined,
        kycStatus: kycStatusFilter || undefined,
        city: cityFilter || undefined,
        storeId: storeFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('✅ RiderManagement: Riders loaded:', {
        requestId,
        success: response.success,
        dataCount: response.data?.length,
        pagination: response.pagination
      });

      // Debug: Check what KYC statuses we actually received
      if (response.data) {
        const receivedStatuses = response.data.map(r => r.kycStatus);
        console.log('📊 RESPONSE - KYC Statuses received:', {
          filter: kycStatusFilter,
          uniqueStatuses: [...new Set(receivedStatuses)],
          sample: response.data.slice(0, 3).map(r => ({
            id: r.id,
            name: r.name,
            kycStatus: r.kycStatus
          }))
        });
      }

      if (response.success) {
        // Enhanced logging to debug filter issues
        const activeRiders = response.data?.filter(r => r.isActive === true);
        const inactiveRiders = response.data?.filter(r => r.isActive === false);

        // Check filter effectiveness by showing counts for each status
        const registrationStatusCounts = response.data?.reduce((acc: Record<string, number>, rider: Rider) => {
          const status = rider.registrationStatus;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const kycStatusCounts = response.data?.reduce((acc: Record<string, number>, rider: Rider) => {
          const status = rider.kycStatus;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        console.log('📋 Setting riders state with data:', {
          count: response.data?.length,
          firstRider: response.data?.[0] ? {
            id: response.data[0].id,
            name: response.data[0].name,
            isActive: response.data[0].isActive,
            registrationStatus: response.data[0].registrationStatus,
            kycStatus: response.data[0].kycStatus,
            // Added vehicle assignment debug info
            assignedVehicleId: response.data[0].assignedVehicleId,
            hasAssignedVehicleObject: !!response.data[0].assignedVehicle,
            assignedVehicleDetails: response.data[0].assignedVehicle ? {
              registrationNumber: response.data[0].assignedVehicle.registrationNumber,
              operationalStatus: response.data[0].assignedVehicle.operationalStatus
            } : null
          } : null,
          // Filter statistics
          activeCount: activeRiders?.length,
          inactiveCount: inactiveRiders?.length,
          // Status counts
          registrationStatusCounts,
          kycStatusCounts,
          // Vehicle assignment summary
          vehicleAssignmentCount: response.data?.filter(r => r.assignedVehicleId).length,
          vehicleObjectCount: response.data?.filter(r => r.assignedVehicle).length,
          // Applied filters
          appliedFilters: {
            kycStatus: kycStatusFilter,
            city: cityFilter,
            storeId: storeFilter,
          }
        });

        setRiders(response.data);
        setTotalCount(response.pagination?.totalItems || 0);

        // Check for data integrity
        if (response.data.length === 0 && response.pagination?.totalItems && response.pagination.totalItems > 0 && page > 0) {
          console.warn('⚠️ Data integrity issue: Empty page with non-zero total count', {
            page: page + 1,
            totalItems: response.pagination?.totalItems || 0
          });

          // Auto-correct by going back to first page if we're on an empty page
          setPage(0);
          setSnackbar({
            open: true,
            message: 'Showing first page as the requested page had no data.',
            severity: 'info'
          });
        }
      } else {
        console.error('❌ API returned failure:', response.message);
        setSnackbar({
          open: true,
          message: `Failed to load riders: ${response.message || 'Unknown error'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Error loading riders:', error);
      setSnackbar({
        open: true,
        message: `Failed to load riders: ${(error as Error).message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, kycStatusFilter, cityFilter, storeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const response = await riderService.getRiderStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading rider stats:', error)
    }
  }, [])

  // Fetch cities for dropdown
  const loadCities = useCallback(async () => {
    try {
      setLoadingCities(true);
      const response = await fetch('/internal/cities');
      const data = await response.json();
      if (data.success && data.data) {
        setCities(data.data.map((city: any) => ({
          id: city.id,
          name: city.name
        })));
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Fetch stores for dropdown
  const loadStores = useCallback(async () => {
    try {
      setLoadingStores(true);
      const response = await fetch('/internal/stores');
      const data = await response.json();
      if (data.success && data.data) {
        setStores(data.data.map((store: any) => ({
          id: store.id,
          storeName: store.storeName,
          storeCode: store.storeCode
        })));
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Effects for data loading
  useEffect(() => {
    // Initial data loading on component mount
    loadStats();
    loadCities();
    loadStores();
  }, [loadStats, loadCities, loadStores]);

  // Separate effect for riders that responds to filter changes
  useEffect(() => {
    loadRiders();
  }, [loadRiders, page, rowsPerPage, searchTerm, kycStatusFilter, cityFilter, storeFilter]);

  // Debug effect to track pagination changes
  useEffect(() => {
    console.log('🔍 Pagination Debug:', {
      totalRiders: totalCount,
      currentPageRiders: riders.length,
      currentPage: page,
      rowsPerPage: rowsPerPage,
      backendPagination: true
    });
  }, [page, rowsPerPage, riders, totalCount]);

  const handleViewRider = useCallback((riderId: string) => {
    navigate(`/rider-management/${riderId}`)
  }, [navigate])

  const handleOpenDialog = useCallback(async (rider?: Rider) => {
    if (rider) {
      try {
        // Fetch full rider details to ensure we have all fields
        const response = await riderService.getRiderById(rider.id)
        if (response.success) {
          const fullRiderData = response.data
          setEditingRider(fullRiderData)
        } else {
          console.error('Failed to fetch rider details:', response.message)
          // Fallback to existing rider data
          setEditingRider(rider)
        }
      } catch (error) {
        console.error('Error fetching rider details:', error)
        // Fallback to existing rider data
        setEditingRider(rider)
      }
    } else {
      setEditingRider(null)
    }
    setOpenDialog(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false)
    setEditingRider(null)
  }, [])

  const handleSaveRider = useCallback(async (formData: RiderFormData) => {
    try {
      // Clean the form data before submission
      const cleanedData = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address1: formData.address1.trim(),
        address2: formData.address2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        aadharNumber: formData.aadharNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        drivingLicenseNumber: formData.drivingLicenseNumber.trim(),
        emergencyName: formData.emergencyName.trim(),
        emergencyPhone: formData.emergencyPhone.trim(),
        emergencyRelation: formData.emergencyRelation.trim(),
      }

      if (editingRider) {
        await riderService.updateRider(editingRider.id, cleanedData)
        setSnackbar({ open: true, message: 'Rider updated successfully', severity: 'success' })
      } else {
        await riderService.createRider(cleanedData)
        setSnackbar({ open: true, message: 'Rider created successfully', severity: 'success' })
      }
      handleCloseDialog()
      loadRiders()
      loadStats()
    } catch (error) {
      console.error('Error saving rider:', error)
      setSnackbar({ open: true, message: 'Failed to save rider', severity: 'error' })
    }
  }, [editingRider, loadRiders, loadStats])

  const handleApproveRider = useCallback(async (riderId: string) => {
    if (!window.confirm('Are you sure you want to approve this rider registration?')) return

    try {
      await riderService.approveRider(riderId)
      setSnackbar({ open: true, message: 'Rider approved successfully', severity: 'success' })
      loadRiders()
      loadStats()
    } catch (error) {
      console.error('Error approving rider:', error)
      setSnackbar({ open: true, message: 'Failed to approve rider', severity: 'error' })
    }
  }, [loadRiders, loadStats])

  const handleRejectRider = useCallback(async (riderId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      await riderService.rejectRider(riderId, reason)
      setSnackbar({ open: true, message: 'Rider rejected successfully', severity: 'success' })
      loadRiders()
      loadStats()
    } catch (error) {
      console.error('Error rejecting rider:', error)
      setSnackbar({ open: true, message: 'Failed to reject rider', severity: 'error' })
    }
  }, [loadRiders, loadStats])

  // Memoized utility functions
  const getStatusColor = useCallback((status: string, statuses: typeof REGISTRATION_STATUSES) => {
    const statusConfig = statuses.find(s => s.value === status)
    return statusConfig?.color || 'default'
  }, [])

  const getStatusLabel = useCallback((status: string, statuses: typeof REGISTRATION_STATUSES) => {
    const statusConfig = statuses.find(s => s.value === status)
    return statusConfig?.label || status
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }, [])

  const maskPhoneNumber = useCallback((phone: string) => {
    // Mask first 6 digits: 9876543210 -> ******3210
    if (!phone || phone.length < 6) return phone
    return '******' + phone.slice(6)
  }, [])

  const handleExportRiders = useCallback(async () => {
    try {
      const filters = {
        search: searchTerm,
        kycStatus: kycStatusFilter,
        city: cityFilter,
        storeId: storeFilter,
      }

      const blob = await riderService.exportRiders(filters)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `riders-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSnackbar({ open: true, message: 'Riders exported successfully', severity: 'success' })
    } catch (error) {
      console.error('Error exporting riders:', error)
      setSnackbar({ open: true, message: 'Failed to export riders', severity: 'error' })
    }
  }, [searchTerm, kycStatusFilter, cityFilter, storeFilter])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Rider Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportRiders}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadRiders()
              loadStats()
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Rider
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Riders
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalRiders}
                  </Typography>
                </Box>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Riders
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {stats.activeRiders}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Registrations
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats.pendingRegistrations}
                  </Typography>
                </Box>
                <PendingIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending KYC
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {stats.pendingKYC}
                  </Typography>
                </Box>
                <AssignmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Reset page to 0 when searching
                  setPage(0);
                  // Add debounce for search to avoid too many API calls while typing
                  if (e.target.value === '') {
                    // When clearing search, reload immediately
                    setTimeout(loadRiders, 0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTimeout(loadRiders, 0);
                  }
                }}
                placeholder="Name, Phone, Rider ID..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <Button onClick={() => loadRiders()}>
                        Search
                      </Button>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>KYC Status</InputLabel>
                <Select
                  value={kycStatusFilter}
                  label="KYC Status"
                  onChange={(e) => {
                    setKycStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {KYC_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <Autocomplete
                options={cities}
                getOptionLabel={(option) => option.name}
                value={cities.find(c => c.name === cityFilter) || null}
                onChange={(_, newValue) => {
                  setCityFilter(newValue ? newValue.name : '');
                  setPage(0);
                }}
                loading={loadingCities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="City"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <Autocomplete
                options={stores}
                getOptionLabel={(option) => `${option.storeCode} - ${option.storeName}`}
                value={stores.find(s => s.id === storeFilter) || null}
                onChange={(_, newValue) => {
                  setStoreFilter(newValue ? newValue.id : '');
                  setPage(0);
                }}
                loading={loadingStores}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Store"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStores ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setKycStatusFilter('')
                  setCityFilter('')
                  setStoreFilter('')
                  setPage(0)
                  loadRiders();
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Active Filters Indicator */}
      {filtersApplied && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setKycStatusFilter('');
                setCityFilter('');
                setStoreFilter('');
                setPage(0);
              }}
            >
              Clear All
            </Button>
          }
        >
          Filters are currently active. Results are filtered based on your criteria.
        </Alert>
      )}

      {/* Riders Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rider</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Work Type</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : riders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      No riders found
                    </TableCell>
                  </TableRow>
                ) : (
                  riders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            onClick={() => handleViewRider(rider.id)}
                            sx={{
                              cursor: 'pointer',
                              position: 'relative',
                              '&:hover .avatar-overlay': {
                                opacity: 1,
                              }
                            }}
                          >
                            <Avatar
                              src={(rider.kycStatus === 'verified' && rider.selfie) ? rider.selfie : undefined}
                              sx={{
                                bgcolor: 'primary.main',
                                border: `2px solid ${rider.isActive ? '#4caf50' : '#f44336'}`,
                                width: 48,
                                height: 48,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              {(rider.kycStatus !== 'verified' || !rider.selfie) && (rider.name ? rider.name.charAt(0).toUpperCase() : rider.phone.charAt(0))}
                            </Avatar>
                            {/* Status Indicator Badge */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: rider.isActive ? '#4caf50' : '#f44336',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                            />
                            {/* Hover Overlay */}
                            <Box
                              className="avatar-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: '50%',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              <ViewIcon sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                          </Box>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              onClick={() => handleViewRider(rider.id)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                }
                              }}
                            >
                              {rider.name || 'No Name'}
                            </Typography>
                            <Chip
                              label={rider.publicRiderId || rider.id}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                mt: 0.5,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: '20px'
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {maskPhoneNumber(rider.phone)}
                          </Typography>
                          {rider.phoneVerified && (
                            <Chip label="Verified" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {rider.assignedStore ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {rider.assignedStore.storeCode}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {rider.assignedStore.city}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No Store
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {rider.workType ? (
                          <Chip
                            label={rider.workType === 'FULL_TIME' ? 'Full-Time' : 'Part-Time'}
                            color={rider.workType === 'FULL_TIME' ? 'primary' : 'info'}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(rider.kycStatus, KYC_STATUSES)}
                          color={getStatusColor(rider.kycStatus, KYC_STATUSES) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rider.assignedVehicle?.registrationNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <Typography variant="body2" fontWeight={500}>
                              {rider.assignedVehicle.registrationNumber}
                            </Typography>
                          </Box>
                        ) : rider.assignedVehicleId ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <Chip
                              label="Assigned"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No Vehicle
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontSize="0.8rem">
                            Orders: {rider.totalOrders || 0}
                          </Typography>
                          <Typography variant="body2" fontSize="0.8rem">
                            Earnings: {formatCurrency(rider.totalEarnings || 0)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRider(rider.id)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Rider">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(rider)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {rider.registrationStatus === 'pending' && (
                            <>
                              <Tooltip title="Approve Rider">
                                <IconButton
                                  size="small"
                                  onClick={() => handleApproveRider(rider.id)}
                                  color="success"
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject Rider">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRejectRider(rider.id)}
                                  color="error"
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* MUI TablePagination Component - Same as VehicleInventory */}
          {totalCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => {
                console.log('📄 Changing to page:', newPage);
                setPage(newPage);
              }}
              onRowsPerPageChange={(event) => {
                const newRowsPerPage = parseInt(event.target.value, 10);
                console.log('📄 Rows per page changing:', {
                  oldValue: rowsPerPage,
                  newValue: newRowsPerPage,
                  resetPage: true
                });
                setRowsPerPage(newRowsPerPage);
                setPage(0);
              }}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Rider Dialog */}
      <EnhancedRiderForm
        open={openDialog}
        rider={editingRider}
        onClose={handleCloseDialog}
        onSave={handleSaveRider}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RiderManagement
