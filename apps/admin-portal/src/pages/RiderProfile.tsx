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
  Tooltip,
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
  Block as BlockIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { riderService, Rider, RiderKYC, RiderOrder, RiderEarning, RiderEarningsSummary, VehicleAssignment, Hub } from '../services'
import vehicleHistoryService, { RiderVehicleHistory } from '../services/vehicleHistoryService'

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

// Helper function to get a display-friendly document type name
const getDocumentTypeDisplay = (documentType: string): string => {
  const documentTypes: Record<string, string> = {
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'dl': 'Driving License',
    'selfie': 'Identity Selfie',
    'rc': 'Registration Certificate',
    // Add any other document types here
  };

  return documentTypes[documentType.toLowerCase()] || documentType;
};

// Helper function to create sample KYC documents for testing if needed
const createSampleKycDocuments = (riderId: string): RiderKYC[] => {
  const baseUrl = 'https://placehold.co/600x400?text=Sample+';

  return [
    {
      id: 'sample-aadhaar',
      riderId: riderId,
      documentType: 'aadhaar',
      documentNumber: 'XXXX-XXXX-1234',
      documentImageUrl: `${baseUrl}Aadhaar`,
      verificationStatus: 'pending',
      verificationDate: null,
      verificationNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentTypeDisplay: 'Aadhaar Card'
    },
    {
      id: 'sample-pan',
      riderId: riderId,
      documentType: 'pan',
      documentNumber: 'ABCDE1234F',
      documentImageUrl: `${baseUrl}PAN`,
      verificationStatus: 'pending',
      verificationDate: null,
      verificationNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentTypeDisplay: 'PAN Card'
    },
    {
      id: 'sample-selfie',
      riderId: riderId,
      documentType: 'selfie',
      documentNumber: 'selfie-1234',
      documentImageUrl: `${baseUrl}Selfie`,
      verificationStatus: 'pending',
      verificationDate: null,
      verificationNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentTypeDisplay: 'Identity Selfie'
    }
  ];
};

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
  const [vehicleHistory, setVehicleHistory] = useState<RiderVehicleHistory[]>([])
  const [vehicleHistoryLoading, setVehicleHistoryLoading] = useState(false)
  const [documentPreviewDialog, setDocumentPreviewDialog] = useState<{ open: boolean, url: string | null, title: string }>({ open: false, url: null, title: '' })

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

      // Add strong cache busting to ensure we get fresh data
      const uniqueCacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[RiderProfile] Loading fresh rider data with cache buster: ${uniqueCacheBuster}`);

      // Make direct API call to bypass any caching
      const response = await riderService.getRiderById(riderId)

      if (response.success) {
        // Process the data before setting it in state
        const originalIsActive = response.data.isActive;
        const strictBooleanIsActive = originalIsActive === true;

        const processedRider = {
          ...response.data,
          // Ensure isActive is a proper boolean with strict comparison
          isActive: strictBooleanIsActive
        };

        console.log(`[RiderProfile] Loaded rider data:`, {
          originalIsActive: originalIsActive,
          originalType: typeof originalIsActive,
          strictBooleanIsActive: strictBooleanIsActive,
          processedIsActive: processedRider.isActive,
          processedType: typeof processedRider.isActive,
          buttonDisplay: strictBooleanIsActive ? "Deactivate Rider" : "Activate Rider"
        });

        setRider(processedRider);
      } else {
        console.error('[RiderProfile] Failed to load rider data:', response.message);
        setSnackbar({ open: true, message: `Failed to load rider data: ${response.message}`, severity: 'error' })
      }
    } catch (error: any) {
      console.error('[RiderProfile] Error loading rider:', error)
      setSnackbar({ open: true, message: `Failed to load rider data: ${error.message}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [riderId])

  const loadKYCDocuments = useCallback(async () => {
    if (!riderId) return

    try {
      // Add cache busting to prevent stale data
      const cacheBuster = Date.now().toString();
      console.log(`[RiderProfile] Loading KYC documents for rider ${riderId} with cache buster ${cacheBuster}`)

      const response = await riderService.getRiderKYC(riderId)
      console.log('[RiderProfile] KYC API response:', response)

      if (response.success) {
        // Process the documents to add display-friendly attributes
        const processedDocuments = response.data.map(doc => {
          // Add a human-readable document type display name
          const documentTypeDisplay = getDocumentTypeDisplay(doc.documentType);

          // Log each document for debugging
          console.log('[RiderProfile] Processing KYC document:', {
            id: doc.id,
            type: doc.documentType,
            status: doc.verificationStatus,
            hasImage: !!doc.documentImageUrl
          });

          return {
            ...doc,
            documentTypeDisplay,
            // Add any other display helper properties here
          }
        });

        console.log(`[RiderProfile] Loaded ${processedDocuments.length} KYC documents`)

        // If we have no documents but the API call succeeded, log this situation and use sample data for development
        if (processedDocuments.length === 0) {
          console.warn('[RiderProfile] No KYC documents returned from API despite successful call')

          // Check if we should show sample data (enable for development/testing)
          const showSampleData = window.location.search.includes('showSampleKYC=true');

          if (showSampleData) {
            // Generate sample documents for demonstration
            const sampleDocuments = createSampleKycDocuments(riderId);
            console.log('[RiderProfile] Using sample KYC documents for testing:', sampleDocuments.length);
            setKycDocuments(sampleDocuments);
          } else {
            setKycDocuments([]);
          }
        } else {
          setKycDocuments(processedDocuments);
        }
      } else {
        console.warn(`[RiderProfile] Failed to load KYC documents: ${response.message}`)

        // Set empty array to ensure UI shows the "no documents" message
        setKycDocuments([])
      }
    } catch (error) {
      console.error('[RiderProfile] Error loading KYC documents:', error)
      // Set empty array to ensure UI shows the "no documents" message
      setKycDocuments([])
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

  // State for tracking toggle operation in progress
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Handle toggling the rider's active status
  const handleToggleRiderStatus = useCallback(async (riderId: string, currentStatus: boolean) => {
    try {
      // Set loading state to disable the button during the toggle operation
      setIsTogglingStatus(true);

      // Avoid optimistic UI update - wait for the actual response
      console.log(`[RiderProfile] Starting toggle rider status: Current status=${currentStatus}, Will set to=${!currentStatus}`);

      // Make the API call to update the database - toggle to the opposite of current status
      const newStatus = !currentStatus;
      console.log(`[RiderProfile] Toggle status from ${currentStatus} to ${newStatus} (types: ${typeof currentStatus} -> ${typeof newStatus})`);

      const response = await riderService.toggleRiderStatus(riderId, newStatus);

      if (response.success) {
        // If the API call succeeded, use the returned data to update our state
        const updatedRider = response.data;

        // Ensure isActive is a proper boolean
        if (updatedRider) {
          updatedRider.isActive = updatedRider.isActive === true;
        }

        console.log("[RiderProfile] Rider status toggle API response:", {
          riderId,
          oldStatus: currentStatus,
          requestedNewStatus: newStatus,
          receivedIsActive: updatedRider.isActive,
          buttonToDisplay: updatedRider.isActive === true ? "Deactivate Rider" : "Activate Rider"
        });

        // Update the local rider state with the fresh data
        setRider(updatedRider);

        setSnackbar({
          open: true,
          message: `Rider ${updatedRider.isActive === true ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
      } else {
        // Display business validation error from the API
        setSnackbar({
          open: true,
          message: response.message || 'Failed to update rider status',
          severity: 'warning' // Using warning for business validation errors
        });

        // Force reload rider data to ensure UI is in sync with backend
        await loadRiderData();
      }
    } catch (error: any) {
      console.error("[RiderProfile] Error updating rider status:", error);

      // Show error message - prioritize API response message if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update rider status';

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      // Force reload rider data to ensure UI is in sync with backend
      await loadRiderData();
    } finally {
      setIsTogglingStatus(false);
    }
  }, [loadRiderData])

  const loadVehicleHistory = useCallback(async () => {
    if (!riderId) return

    try {
      setVehicleHistoryLoading(true)
      const response = await vehicleHistoryService.getRiderVehicleHistory(riderId)
      if (response.success) {
        setVehicleHistory(response.data)
      }
    } catch (error) {
      console.error('Error loading vehicle history:', error)
      setSnackbar({ open: true, message: 'Failed to load vehicle history', severity: 'error' })
    } finally {
      setVehicleHistoryLoading(false)
    }
  }, [riderId])

  useEffect(() => {
    // Initial data load
    const loadAllData = async () => {
      try {
        await loadRiderData()

        // Load KYC documents with extra debugging
        console.log("[RiderProfile] Starting KYC documents load")
        await loadKYCDocuments()

        // Debug: Check if KYC documents were loaded
        console.log("[RiderProfile] KYC documents loaded:", kycDocuments.length)

        // Continue loading other data
        loadOrders()
        loadEarnings()
        loadVehicleHistory()
        // Don't load vehicles initially - only load after hub selection
        loadAvailableHubs()

        console.log("[RiderProfile] All rider data loaded successfully")
      } catch (error) {
        console.error("[RiderProfile] Error loading initial rider data:", error)
      }
    }

    loadAllData()

    // Set up a refresh interval for rider data to ensure we have the latest status
    // This is especially important for the isActive status
    const refreshInterval = setInterval(() => {
      console.log("[RiderProfile] Refreshing rider data via interval...")
      loadRiderData()
    }, 15000) // Refresh every 15 seconds (reduced from 30 seconds)

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [loadRiderData, loadKYCDocuments, loadOrders, loadEarnings, loadVehicleHistory, loadAvailableHubs])

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
      console.log(`[RiderProfile] Verifying KYC document ${kycVerifyDialog.kyc.id} with status ${verificationStatus}`)

      // Show loading state during verification
      setSnackbar({
        open: true,
        message: 'Processing verification request...',
        severity: 'info'
      })

      // Call the API to verify the KYC document
      const response = await riderService.verifyKYC(
        riderId,
        kycVerifyDialog.kyc.id,
        verificationStatus,
        verificationNotes
      )

      if (response.success) {
        setSnackbar({
          open: true,
          message: `KYC document ${verificationStatus === 'verified' ? 'approved' : 'rejected'} successfully`,
          severity: 'success'
        })

        // Close the dialog and reset the form
        setKycVerifyDialog({ open: false, kyc: null })
        setVerificationNotes('')
        setVerificationStatus('verified') // Reset to default

        // Reload KYC documents and rider data to reflect the changes
        loadKYCDocuments()
        loadRiderData()
      } else {
        console.error('[RiderProfile] KYC verification failed:', response.message)
        setSnackbar({
          open: true,
          message: response.message || 'Failed to verify KYC document',
          severity: 'error'
        })
      }
    } catch (error: any) {
      console.error('[RiderProfile] Error verifying KYC:', error)

      // Show appropriate error message
      setSnackbar({
        open: true,
        message: error.message || 'Failed to verify KYC document. Please try again.',
        severity: 'error'
      })
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={`Current rider status (isActive=${rider.isActive}, type=${typeof rider.isActive})`}>
                    <Badge
                      badgeContent={rider.isActive === true ? '●' : '○'}
                      color={rider.isActive === true ? 'success' : 'error'}
                    >
                      <Typography
                        variant="body2"
                      >
                        {rider.isActive === true ? 'Active' : 'Inactive'}
                      </Typography>
                    </Badge>
                  </Tooltip>
                  {isTogglingStatus ? (
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      disabled={true}
                    >
                      <CircularProgress size={20} color="inherit" />
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color={rider.isActive === true ? 'error' : 'success'}
                      size="small"
                      onClick={() => handleToggleRiderStatus(rider.id, rider.isActive)}
                      startIcon={rider.isActive === true ? <BlockIcon /> : <CheckCircleIcon />}
                    >
                      {rider.isActive === true ? 'Deactivate Rider' : 'Activate Rider'}
                    </Button>
                  )}
                </Box>
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
      {/* Tabs - Force KYC Documents tab to always show */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable">
          <Tab label="Rider Information" icon={<AccountCircleIcon />} />
          <Tab label="KYC Documents" icon={<AssignmentIcon />} />
          <Tab label="Orders" icon={<CalendarIcon />} />
          <Tab label="Earnings" icon={<AttachMoneyIcon />} />
          <Tab label="Vehicle History" icon={<TwoWheelerIcon />} />
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
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">KYC Documents</Typography>
              <Box>
                <Chip
                  label={`${kycDocuments.length} Documents`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={rider?.kycStatus || 'Unknown'}
                  color={getStatusColor(rider?.kycStatus || 'pending') as any}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>

          {kycDocuments.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>No KYC documents found for this rider.</Alert>

                <Typography variant="body1" paragraph>
                  The rider has not uploaded any KYC documents yet. KYC documents are required for rider verification and approval.
                </Typography>

                <Typography variant="body1" paragraph>
                  Required documents include:
                </Typography>

                <Box component="ul" sx={{ mb: 3 }}>
                  <li>Aadhaar Card</li>
                  <li>PAN Card</li>
                  <li>Driving License</li>
                  <li>Identity Selfie</li>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Current KYC Status: <Chip label={rider?.kycStatus || 'Unknown'} color={getStatusColor(rider?.kycStatus || 'pending') as any} size="small" />
                </Typography>

                {/* Add button to request KYC documents */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setSnackbar({
                      open: true,
                      message: 'This feature will send a notification to the rider to upload KYC documents',
                      severity: 'info'
                    })}
                    startIcon={<AssignmentIcon />}
                  >
                    Request KYC Documents
                  </Button>
                </Box>
              </Card>
            </Grid>
          ) : (
            <>

              {kycDocuments.map((kyc) => (
                <Grid item xs={12} md={6} key={kyc.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{kyc.documentTypeDisplay || kyc.documentType}</Typography>
                        <Chip
                          label={kyc.verificationStatus}
                          color={getStatusColor(kyc.verificationStatus) as any}
                          size="small"
                        />
                      </Box>

                      {kyc.documentImageUrl && kyc.documentType.toLowerCase() === 'selfie' && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                          <Box
                            component="img"
                            src={kyc.documentImageUrl}
                            alt="Rider Selfie"
                            sx={{
                              width: 120,
                              height: 120,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #eee',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.9,
                                border: '2px solid #3f51b5'
                              }
                            }}
                            onClick={() => setDocumentPreviewDialog({
                              open: true,
                              url: kyc.documentImageUrl || null,
                              title: 'Rider Selfie'
                            })}
                          />
                        </Box>
                      )}

                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Document Number</Typography>
                          <Typography variant="body1">{kyc.documentNumber || 'Not available'}</Typography>
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
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {kyc.documentImageUrl && (
                            <Button
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => setDocumentPreviewDialog({
                                open: true,
                                url: kyc.documentImageUrl || null,
                                title: kyc.documentTypeDisplay || kyc.documentType
                              })}
                              size="small"
                            >
                              View Document
                            </Button>
                          )}
                          {/* Always show Verify button regardless of status */}
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setKycVerifyDialog({ open: true, kyc })}
                          >
                            {kyc.verificationStatus === 'pending' ? 'Verify' : 'Review'}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </>
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

      <TabPanel value={tabValue} index={4}>
        {/* Vehicle History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vehicle Assignment History
            </Typography>
            {vehicleHistoryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : vehicleHistory.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                This rider has no vehicle assignment history.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Registration Number</TableCell>
                      <TableCell>Assigned Date</TableCell>
                      <TableCell>Returned Date</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicleHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate(`/vehicle-profile/${history.vehicleId}`)}
                            sx={{
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <TwoWheelerIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {history.vehicle?.make || "Unknown"} {history.vehicle?.model || "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell>{history.registrationNumber || history.vehicle?.registrationNumber || "Unknown"}</TableCell>
                        <TableCell>{formatDate(history.assignedAt)}</TableCell>
                        <TableCell>{history.returnedAt ? formatDate(history.returnedAt) : 'Active'}</TableCell>
                        <TableCell>
                          {history.durationDays} {history.durationDays === 1 ? 'day' : 'days'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={history.status}
                            color={history.status === 'ACTIVE' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{history.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
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
      <Dialog
        open={kycVerifyDialog.open}
        onClose={() => setKycVerifyDialog({ open: false, kyc: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Verify KYC Document
          <IconButton
            aria-label="close"
            onClick={() => setKycVerifyDialog({ open: false, kyc: null })}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {kycVerifyDialog.kyc && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              {/* Document details */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Document Type</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {getDocumentTypeDisplay(kycVerifyDialog.kyc.documentType)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Document Number</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {kycVerifyDialog.kyc.documentNumber || 'Not available'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Submitted Date</Typography>
                    <Typography variant="subtitle1">
                      {formatDate(kycVerifyDialog.kyc.createdAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Current Status</Typography>
                    <Chip
                      label={kycVerifyDialog.kyc.verificationStatus}
                      color={getStatusColor(kycVerifyDialog.kyc.verificationStatus) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>Verification Decision</InputLabel>
                    <Select
                      value={verificationStatus}
                      label="Verification Decision"
                      onChange={(e) => setVerificationStatus(e.target.value as 'verified' | 'rejected')}
                    >
                      <MenuItem value="verified">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          Verified
                        </Box>
                      </MenuItem>
                      <MenuItem value="rejected">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BlockIcon color="error" sx={{ mr: 1 }} />
                          Rejected
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Verification Notes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder={verificationStatus === 'rejected' ?
                      "Please provide a reason for rejection..." :
                      "Add any notes about the verification..."}
                    required={verificationStatus === 'rejected'}
                    error={verificationStatus === 'rejected' && !verificationNotes}
                    helperText={verificationStatus === 'rejected' && !verificationNotes ?
                      "Reason is required when rejecting a document" : ""}
                  />
                </Stack>
              </Grid>

              {/* Document preview */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                  }}
                >
                  {kycVerifyDialog.kyc.documentImageUrl ? (
                    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1, textAlign: 'center' }}>
                        Document Preview
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                          mb: 1
                        }}
                      >
                        <Box
                          component="img"
                          src={kycVerifyDialog.kyc.documentImageUrl}
                          alt={kycVerifyDialog.kyc.documentType}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => window.open(kycVerifyDialog.kyc!.documentImageUrl!, '_blank')}
                      >
                        View Full Size
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        No document image available for preview
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycVerifyDialog({ open: false, kyc: null })}>Cancel</Button>
          <Button
            onClick={handleVerifyKYC}
            variant="contained"
            color={verificationStatus === 'verified' ? 'primary' : 'error'}
            disabled={verificationStatus === 'rejected' && !verificationNotes}
          >
            {verificationStatus === 'verified' ? 'Verify Document' : 'Reject Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={documentPreviewDialog.open}
        onClose={() => setDocumentPreviewDialog({ ...documentPreviewDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {documentPreviewDialog.title}
          <IconButton
            aria-label="close"
            onClick={() => setDocumentPreviewDialog({ ...documentPreviewDialog, open: false })}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {documentPreviewDialog.url && (
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2
            }}>
              <Box
                component="img"
                src={documentPreviewDialog.url}
                alt={documentPreviewDialog.title}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreviewDialog({ ...documentPreviewDialog, open: false })}>Close</Button>
          {documentPreviewDialog.url && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(documentPreviewDialog.url!, '_blank')}
            >
              Open Full Size
            </Button>
          )}
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
