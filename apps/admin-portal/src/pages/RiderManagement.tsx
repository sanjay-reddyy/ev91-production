import React, { useState, useEffect, useCallback } from 'react'
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
  Badge,
  Stack,
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
  Block as BlockIcon,
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
  { value: 'verified', label: 'Verified', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'incomplete', label: 'Incomplete', color: 'default' },
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
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('')
  const [kycStatusFilter, setKycStatusFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
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

  const loadRiders = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        registrationStatus: registrationStatusFilter || undefined,
        kycStatus: kycStatusFilter || undefined,
        isActive: isActiveFilter !== '' ? isActiveFilter === 'true' : undefined,
        city: cityFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }

      const response = await riderService.getRiders(params)
      if (response.success) {
        setRiders(response.data)
        setTotalCount(response.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error loading riders:', error)
      setSnackbar({ open: true, message: 'Failed to load riders', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, searchTerm, registrationStatusFilter, kycStatusFilter, isActiveFilter, cityFilter])

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

  useEffect(() => {
    loadRiders()
    loadStats()
  }, [loadRiders, loadStats])

  const handleViewRider = (riderId: string) => {
    navigate(`/rider-management/${riderId}`)
  }

  const handleOpenDialog = async (rider?: Rider) => {
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
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRider(null)
  }

  const handleSaveRider = async (formData: RiderFormData) => {
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
  }

  const handleToggleRiderStatus = async (riderId: string, currentStatus: boolean) => {
    try {
      await riderService.toggleRiderStatus(riderId, !currentStatus)
      setSnackbar({
        open: true,
        message: `Rider ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        severity: 'success'
      })
      loadRiders()
      loadStats()
    } catch (error) {
      console.error('Error toggling rider status:', error)
      setSnackbar({ open: true, message: 'Failed to update rider status', severity: 'error' })
    }
  }

  const handleApproveRider = async (riderId: string) => {
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
  }

  const handleRejectRider = async (riderId: string) => {
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
  }

  const getStatusColor = (status: string, statuses: typeof REGISTRATION_STATUSES) => {
    const statusConfig = statuses.find(s => s.value === status)
    return statusConfig?.color || 'default'
  }

  const getStatusLabel = (status: string, statuses: typeof REGISTRATION_STATUSES) => {
    const statusConfig = statuses.find(s => s.value === status)
    return statusConfig?.label || status
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const handleExportRiders = async () => {
    try {
      const filters = {
        search: searchTerm,
        registrationStatus: registrationStatusFilter,
        kycStatus: kycStatusFilter,
        isActive: isActiveFilter,
        city: cityFilter,
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
  }

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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, Phone, ID..."
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
                <InputLabel>Registration Status</InputLabel>
                <Select
                  value={registrationStatusFilter}
                  label="Registration Status"
                  onChange={(e) => setRegistrationStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {REGISTRATION_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>KYC Status</InputLabel>
                <Select
                  value={kycStatusFilter}
                  label="KYC Status"
                  onChange={(e) => setKycStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {KYC_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={isActiveFilter}
                  label="Status"
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="City"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setRegistrationStatusFilter('')
                  setKycStatusFilter('')
                  setIsActiveFilter('')
                  setCityFilter('')
                  setPage(0)
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Riders Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rider</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Registration Status</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : riders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      No riders found
                    </TableCell>
                  </TableRow>
                ) : (
                  riders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {rider.name ? rider.name.charAt(0).toUpperCase() : rider.phone.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {rider.name || 'No Name'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {rider.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {rider.phone}
                          </Typography>
                          {rider.phoneVerified && (
                            <Chip label="Verified" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(rider.registrationStatus, REGISTRATION_STATUSES)}
                          color={getStatusColor(rider.registrationStatus, REGISTRATION_STATUSES) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(rider.kycStatus, KYC_STATUSES)}
                          color={getStatusColor(rider.kycStatus, KYC_STATUSES) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rider.assignedVehicle ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {rider.assignedVehicle.registrationNumber}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {rider.assignedVehicle.make} {rider.assignedVehicle.model}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No Vehicle
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            Orders: {rider.totalOrders || 0}
                          </Typography>
                          <Typography variant="body2">
                            Rating: {rider.averageRating ? rider.averageRating.toFixed(1) : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Earnings: {formatCurrency(rider.totalEarnings || 0)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={rider.isActive ? '●' : '○'}
                          color={rider.isActive ? 'success' : 'error'}
                        >
                          <Typography variant="body2">
                            {rider.isActive ? 'Active' : 'Inactive'}
                          </Typography>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(rider.createdAt)}
                        </Typography>
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
                          <Tooltip title={rider.isActive ? 'Deactivate Rider' : 'Activate Rider'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRiderStatus(rider.id, rider.isActive)}
                              color={rider.isActive ? 'error' : 'success'}
                            >
                              {rider.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
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
