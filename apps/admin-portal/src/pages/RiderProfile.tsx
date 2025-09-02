import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  TwoWheeler as TwoWheelerIcon,
  AccountCircle as AccountCircleIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { riderService, Rider, RiderKYC, RiderOrder, RiderEarning, RiderEarningsSummary, VehicleAssignment, Hub } from '../services'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rider-tabpanel-${index}`}
      aria-labelledby={`rider-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const RiderProfile: React.FC = () => {
  const { riderId } = useParams<{ riderId: string }>()
  const navigate = useNavigate()

  const [rider, setRider] = useState<Rider | null>(null)
  const [kycDocuments, setKycDocuments] = useState<RiderKYC[]>([])
  const [orders, setOrders] = useState<RiderOrder[]>([])
  const [earnings, setEarnings] = useState<RiderEarning[]>([])
  const [earningsSummary, setEarningsSummary] = useState<RiderEarningsSummary | null>(null)
  const [availableVehicles, setAvailableVehicles] = useState<VehicleAssignment[]>([])
  const [availableHubs, setAvailableHubs] = useState<Hub[]>([])
  const [selectedHub, setSelectedHub] = useState('')

  const [loading, setLoading] = useState(true)
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [earningsPeriod, setEarningsPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  // Dialogs
  const [vehicleAssignDialog, setVehicleAssignDialog] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [kycVerifyDialog, setKycVerifyDialog] = useState<{ open: boolean, kyc: RiderKYC | null }>({ open: false, kyc: null })
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected'>('verified')
  const [verificationNotes, setVerificationNotes] = useState('')

  const loadRiderData = useCallback(async () => {
    if (!riderId) return

    try {
      setLoading(true)
      const response = await riderService.getRiderById(riderId)
      if (response.success) {
        setRider(response.data)
      }
    } catch (error) {
      console.error('Error loading rider:', error)
      setSnackbar({ open: true, message: 'Failed to load rider data', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [riderId])

  const loadKYCDocuments = useCallback(async () => {
    if (!riderId) return

    try {
      const response = await riderService.getRiderKYC(riderId)
      if (response.success) {
        setKycDocuments(response.data)
      }
    } catch (error) {
      console.error('Error loading KYC documents:', error)
    }
  }, [riderId])

  const loadOrders = useCallback(async () => {
    if (!riderId) return

    try {
      const response = await riderService.getRiderOrders(riderId, {
        limit: 50,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      })
      if (response.success) {
        setOrders(response.data)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }, [riderId])

  const loadEarnings = useCallback(async () => {
    if (!riderId) return

    try {
      const [earningsResponse, summaryResponse] = await Promise.all([
        riderService.getRiderEarnings(riderId, {
          period: earningsPeriod,
          limit: 50,
          sortBy: 'orderDate',
          sortOrder: 'desc'
        }),
        riderService.getRiderEarningsSummary(riderId, earningsPeriod)
      ])

      if (earningsResponse.success) {
        setEarnings(earningsResponse.data)
      }

      if (summaryResponse.success) {
        setEarningsSummary(summaryResponse.data)
      }
    } catch (error) {
      console.error('Error loading earnings:', error)
    }
  }, [riderId, earningsPeriod])

  const loadAvailableVehicles = useCallback(async (hubId?: string) => {
    try {
      // Only load vehicles if a hub is selected, or if no hubId is provided, clear the vehicles
      if (!hubId) {
        setAvailableVehicles([])
        return
      }

      setVehiclesLoading(true)
      console.log("loadAvailableVehicles - Loading vehicles for hubId:", hubId);
      const response = await riderService.getAvailableVehicles(hubId)
      console.log("loadAvailableVehicles - API response:", response);
      if (response.success) {
        // No need to filter again since the API already filters by operationalStatus=Available
        const availableVehicles = response.data;
        console.log("loadAvailableVehicles - Setting vehicles:", availableVehicles);
        setAvailableVehicles(availableVehicles)
      }
    } catch (error) {
      console.error('Error loading available vehicles:', error)
      setAvailableVehicles([])
    } finally {
      setVehiclesLoading(false)
    }
  }, [])

  const loadAvailableHubs = useCallback(async () => {
    try {
      console.log('Loading available hubs...')
      const response = await riderService.getHubs()
      console.log('Hubs response:', response)
      if (response.success) {
        console.log('Setting available hubs:', response.data)
        console.log('First hub sample:', response.data[0]) // Log first hub to see structure
        setAvailableHubs(response.data)
      } else {
        console.error('Failed to load hubs:', response.message)
        setSnackbar({ open: true, message: `Failed to load hubs: ${response.message}`, severity: 'error' })
      }
    } catch (error) {
      console.error('Error loading available hubs:', error)
      setSnackbar({ open: true, message: 'Failed to load hubs', severity: 'error' })
    }
  }, [])

  useEffect(() => {
    loadRiderData()
    loadKYCDocuments()
    loadOrders()
    loadEarnings()
    // Don't load vehicles initially - only load after hub selection
    loadAvailableHubs()
  }, [loadRiderData, loadKYCDocuments, loadOrders, loadEarnings, loadAvailableHubs])

  useEffect(() => {
    loadEarnings()
  }, [earningsPeriod, loadEarnings])

  const handleHubChange = (hubId: string) => {
    setSelectedHub(hubId)
    setSelectedVehicle('') // Reset vehicle selection when hub changes
    loadAvailableVehicles(hubId) // Load vehicles for selected hub
  }

  const handleAssignVehicle = async () => {
    if (!riderId || !selectedVehicle) return

    try {
      await riderService.assignVehicle(riderId, selectedVehicle, selectedHub)
      setSnackbar({ open: true, message: 'Vehicle assigned successfully', severity: 'success' })
      setVehicleAssignDialog(false)
      setSelectedVehicle('')
      const currentHubId = selectedHub
      setSelectedHub('')
      loadRiderData()
      // Reload vehicles for the current hub if there was one selected
      if (currentHubId) {
        loadAvailableVehicles(currentHubId)
      }
    } catch (error) {
      console.error('Error assigning vehicle:', error)
      setSnackbar({ open: true, message: 'Failed to assign vehicle', severity: 'error' })
    }
  }

  const handleUnassignVehicle = async () => {
    if (!riderId || !window.confirm('Are you sure you want to unassign the vehicle?')) return

    try {
      await riderService.unassignVehicle(riderId)
      setSnackbar({ open: true, message: 'Vehicle unassigned successfully', severity: 'success' })
      loadRiderData()
      // Clear available vehicles since no hub is selected now
      setAvailableVehicles([])
    } catch (error) {
      console.error('Error unassigning vehicle:', error)
      setSnackbar({ open: true, message: 'Failed to unassign vehicle', severity: 'error' })
    }
  }

  const handleVerifyKYC = async () => {
    if (!riderId || !kycVerifyDialog.kyc) return

    try {
      await riderService.verifyKYC(riderId, kycVerifyDialog.kyc.id, verificationStatus, verificationNotes)
      setSnackbar({ open: true, message: 'KYC verification updated successfully', severity: 'success' })
      setKycVerifyDialog({ open: false, kyc: null })
      setVerificationNotes('')
      loadKYCDocuments()
      loadRiderData()
    } catch (error) {
      console.error('Error verifying KYC:', error)
      setSnackbar({ open: true, message: 'Failed to verify KYC', severity: 'error' })
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
      case 'delivered':
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'error'
      case 'processing':
      case 'picked_up':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading || !rider) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/rider-management')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Rider Profile
        </Typography>
      </Box>

      {/* Rider Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2 }}>
                  {rider.name ? rider.name.charAt(0).toUpperCase() : rider.phone.charAt(0)}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {rider.name || 'No Name'}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  ID: {rider.id}
                </Typography>
                <Badge
                  badgeContent={rider.isActive ? '●' : '○'}
                  color={rider.isActive ? 'success' : 'error'}
                >
                  <Typography variant="body2">
                    {rider.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Badge>
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon color="primary" />
                      <Typography variant="body2">
                        {rider.phone}
                        {rider.phoneVerified && <CheckCircleIcon color="success" sx={{ ml: 1, fontSize: 16 }} />}
                      </Typography>
                    </Box>
                    {rider.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="primary" />
                        <Typography variant="body2">{rider.email}</Typography>
                      </Box>
                    )}
                    {(rider.city || rider.state) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon color="primary" />
                        <Typography variant="body2">
                          {[rider.city, rider.state].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Registration Status</Typography>
                      <Chip
                        label={rider.registrationStatus}
                        color={getStatusColor(rider.registrationStatus) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">KYC Status</Typography>
                      <Chip
                        label={rider.kycStatus}
                        color={getStatusColor(rider.kycStatus) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Registration Date</Typography>
                      <Typography variant="body2">{formatDate(rider.createdAt)}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable">
          <Tab label="Rider Information" icon={<AccountCircleIcon />} />
          <Tab label="KYC Documents" icon={<AssignmentIcon />} />
          <Tab label="Orders" icon={<CalendarIcon />} />
          <Tab label="Earnings" icon={<AttachMoneyIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Rider Information */}
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Full Name</Typography>
                    <Typography variant="body1">{rider.name || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Date of Birth</Typography>
                    <Typography variant="body1">{rider.dob ? formatDate(rider.dob) : 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                    <Typography variant="body1">
                      {rider.phone}
                      {rider.phoneVerified && <CheckCircleIcon color="success" sx={{ ml: 1, fontSize: 16 }} />}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{rider.email || 'Not provided'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Address Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Address</Typography>
                    <Typography variant="body1">
                      {[rider.address1, rider.address2].filter(Boolean).join(', ') || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">City</Typography>
                    <Typography variant="body1">{rider.city || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">State</Typography>
                    <Typography variant="body1">{rider.state || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">PIN Code</Typography>
                    <Typography variant="body1">{rider.pincode || 'Not provided'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Document Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Aadhar Number</Typography>
                    <Typography variant="body1">{rider.aadharNumber || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">PAN Number</Typography>
                    <Typography variant="body1">{rider.panNumber || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Driving License</Typography>
                    <Typography variant="body1">{rider.drivingLicenseNumber || 'Not provided'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Vehicle Assignment */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Vehicle Assignment
                  </Typography>
                  {rider.assignedVehicle ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleUnassignVehicle}
                    >
                      Unassign
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<TwoWheelerIcon />}
                      onClick={() => setVehicleAssignDialog(true)}
                    >
                      Assign Vehicle
                    </Button>
                  )}
                </Box>
                {rider.assignedVehicle ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Registration Number</Typography>
                      <Link
                        component="button"
                        variant="body1"
                        fontWeight="medium"
                        onClick={() => navigate(`/vehicle-profile/${rider.assignedVehicle?.id}`)}
                        sx={{
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {rider.assignedVehicle.registrationNumber}
                      </Link>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Vehicle</Typography>
                      <Typography variant="body1">
                        {rider.assignedVehicle.make} {rider.assignedVehicle.model}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Assigned Date</Typography>
                      <Typography variant="body1">{formatDate(rider.assignedVehicle.assignedDate)}</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No vehicle assigned
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">Name</Typography>
                    <Typography variant="body1">{rider.emergencyName || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">Phone</Typography>
                    <Typography variant="body1">{rider.emergencyPhone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">Relation</Typography>
                    <Typography variant="body1">{rider.emergencyRelation || 'Not provided'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* KYC Documents */}
        <Grid container spacing={3}>
          {kycDocuments.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No KYC documents found for this rider.</Alert>
            </Grid>
          ) : (
            kycDocuments.map((kyc) => (
              <Grid item xs={12} md={6} key={kyc.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{kyc.documentType}</Typography>
                      <Chip
                        label={kyc.verificationStatus}
                        color={getStatusColor(kyc.verificationStatus) as any}
                        size="small"
                      />
                    </Box>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Document Number</Typography>
                        <Typography variant="body1">{kyc.documentNumber}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Submitted Date</Typography>
                        <Typography variant="body1">{formatDate(kyc.createdAt)}</Typography>
                      </Box>
                      {kyc.verificationDate && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">Verification Date</Typography>
                          <Typography variant="body1">{formatDate(kyc.verificationDate)}</Typography>
                        </Box>
                      )}
                      {kyc.verificationNotes && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">Verification Notes</Typography>
                          <Typography variant="body1">{kyc.verificationNotes}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {kyc.documentImageUrl && (
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => window.open(kyc.documentImageUrl!, '_blank')}
                          >
                            View Document
                          </Button>
                        )}
                        {kyc.verificationStatus === 'pending' && (
                          <Button
                            variant="contained"
                            onClick={() => setKycVerifyDialog({ open: true, kyc })}
                          >
                            Verify
                          </Button>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Orders */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Order Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Customer Rating</TableCell>
                    <TableCell>Distance</TableCell>
                    <TableCell>Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.orderId}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{formatCurrency(order.orderValue)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.deliveryStatus}
                            color={getStatusColor(order.deliveryStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {order.customerRating ? `${order.customerRating}/5` : 'Not rated'}
                        </TableCell>
                        <TableCell>
                          {order.distance ? `${order.distance} km` : 'N/A'}
                        </TableCell>
                        <TableCell>{formatCurrency(order.totalEarning)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Earnings */}
        <Grid container spacing={3}>
          {/* Earnings Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    Earnings Summary
                  </Typography>
                  <FormControl size="small">
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={earningsPeriod}
                      label="Period"
                      onChange={(e) => setEarningsPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {earningsSummary && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {formatCurrency(earningsSummary.totalEarnings)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Earnings
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {earningsSummary.totalOrders}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Orders
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {formatCurrency(earningsSummary.averageEarningPerOrder)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg per Order
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {earningsSummary.totalDistance} km
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Distance
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Earnings Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order Date</TableCell>
                        <TableCell>Store</TableCell>
                        <TableCell>Base Rate</TableCell>
                        <TableCell>Bonuses</TableCell>
                        <TableCell>Final Earning</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Distance</TableCell>
                        <TableCell>Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {earnings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                            No earnings found
                          </TableCell>
                        </TableRow>
                      ) : (
                        earnings.map((earning) => (
                          <TableRow key={earning.id}>
                            <TableCell>{formatDate(earning.orderDate)}</TableCell>
                            <TableCell>
                              {earning.store?.storeName || 'Unknown Store'}
                            </TableCell>
                            <TableCell>{formatCurrency(earning.baseRate)}</TableCell>
                            <TableCell>
                              {formatCurrency(
                                earning.bulkOrderBonus +
                                earning.performanceBonus +
                                earning.weeklyTargetBonus +
                                earning.specialEventBonus
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium' }}>
                              {formatCurrency(earning.finalEarning)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={earning.paymentStatus}
                                color={getStatusColor(earning.paymentStatus) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {earning.distance ? `${earning.distance} km` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {earning.riderRating ? `${earning.riderRating}/5` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Vehicle Assignment Dialog */}
      <Dialog open={vehicleAssignDialog} onClose={() => setVehicleAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Vehicle to Rider</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Hub</InputLabel>
              <Select
                value={selectedHub}
                label="Select Hub"
                onChange={(e) => handleHubChange(e.target.value)}
              >
                {availableHubs.map((hub) => (
                  <MenuItem key={hub.id} value={hub.id}>
                    {hub.name} - {hub.cityName || hub.city?.name || 'Unknown City'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedHub || vehiclesLoading}>
              <InputLabel>Select Vehicle</InputLabel>
              <Select
                value={selectedVehicle}
                label="Select Vehicle"
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                {availableVehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                    {vehicle.operationalStatus && (
                      <Chip size="small" label={vehicle.operationalStatus} sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {vehiclesLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading available vehicles...
                </Typography>
              </Box>
            )}

            {!selectedHub && !vehiclesLoading && (
              <Alert severity="info">
                Please select a hub first to view available vehicles for that location.
              </Alert>
            )}

            {selectedHub && !vehiclesLoading && availableVehicles.length === 0 && (
              <Alert severity="warning">
                No available vehicles found in the selected hub. All vehicles may be currently assigned or under maintenance.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVehicleAssignDialog(false)
            setSelectedHub('')
            setSelectedVehicle('')
          }}>Cancel</Button>
          <Button onClick={handleAssignVehicle} variant="contained" disabled={!selectedVehicle}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* KYC Verification Dialog */}
      <Dialog open={kycVerifyDialog.open} onClose={() => setKycVerifyDialog({ open: false, kyc: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Verify KYC Document</DialogTitle>
        <DialogContent>
          {kycVerifyDialog.kyc && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Document Type</Typography>
                <Typography variant="body1">{kycVerifyDialog.kyc.documentType}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Document Number</Typography>
                <Typography variant="body1">{kycVerifyDialog.kyc.documentNumber}</Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Verification Status</InputLabel>
                <Select
                  value={verificationStatus}
                  label="Verification Status"
                  onChange={(e) => setVerificationStatus(e.target.value as 'verified' | 'rejected')}
                >
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Verification Notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Add notes about the verification..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycVerifyDialog({ open: false, kyc: null })}>Cancel</Button>
          <Button onClick={handleVerifyKYC} variant="contained">
            Submit Verification
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RiderProfile
