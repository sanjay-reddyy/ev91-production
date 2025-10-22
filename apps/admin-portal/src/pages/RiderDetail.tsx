import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  LocalShipping as LocalShippingIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Edit as EditIcon,
  TwoWheeler as TwoWheelerIcon,
  AccountBalance as AccountBalanceIcon,
  VerifiedUser as VerifiedUserIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  riderService,
  vehicleHistoryService,
  Rider,
  RiderKYC,
  RiderEarning,
  RiderEarningsSummary,
  VehicleAssignment,
} from '../services';
import { RiderVehicleHistory } from '../services/vehicleHistoryService';
import {
  getCurrentRental,
  getRentalPayments,
} from '../services/evRentalService';
import type {
  RentalWithPayments,
} from '../types/evRental';

// Import the new modular components
import RiderProfileTab from '../components/rider/RiderProfileTab';
import RiderKYCTab from '../components/rider/RiderKYCTab';
import RiderEarningsTab from '../components/rider/RiderEarningsTab';
import RiderVehicleHistoryTab from '../components/rider/RiderVehicleHistoryTab';
import RiderPaymentHistoryTab from '../components/rider/RiderPaymentHistoryTab';
import RiderRegistrationCompleter from '../components/rider/RiderRegistrationCompleter';
import BankDetailsSection from '../components/rider/BankDetailsSection';

// Import EV Rental components
import {
  VehiclePreferenceSelector,
  RentalAssignmentDialog as EVRentalAssignmentDialog,
  RentalPaymentTab,
} from '../components/ev-rental';

// Import the dialog components
import DocumentPreviewDialog from '../components/rider/dialogs/DocumentPreviewDialog';
import VehicleAssignmentDialog from '../components/rider/dialogs/VehicleAssignmentDialog';
import VehicleUnassignmentDialog from '../components/rider/dialogs/VehicleUnassignmentDialog';
import KYCVerificationDialog from '../components/rider/dialogs/KYCVerificationDialog';
import EnhancedRiderForm from '../components/EnhancedRiderForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rider-tabpanel-${index}`}
      aria-labelledby={`rider-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `rider-tab-${index}`,
    'aria-controls': `rider-tabpanel-${index}`,
  };
}

const RiderDetail: React.FC = () => {
  const { riderId } = useParams<{ riderId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State for rider data
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState<number>(0);

  // State for KYC documents
  const [kycDocuments, setKycDocuments] = useState<RiderKYC[]>([]);
  const [kycLoading, setKycLoading] = useState<boolean>(false);

  // State for earnings
  const [earnings, setEarnings] = useState<RiderEarning[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<RiderEarningsSummary | null>(null);
  const [earningsPeriod, setEarningsPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // State for vehicle history
  const [vehicleHistory, setVehicleHistory] = useState<RiderVehicleHistory[]>([]);
  const [vehicleHistoryLoading, setVehicleHistoryLoading] = useState<boolean>(false);

  // State for payment history
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // State for EV Rental
  const [currentRental, setCurrentRental] = useState<RentalWithPayments | null>(null);
  const [rentalLoading, setRentalLoading] = useState<boolean>(false);
  const [rentalAssignmentDialog, setRentalAssignmentDialog] = useState<boolean>(false);

  // Dialog states
  const [documentPreviewDialog, setDocumentPreviewDialog] = useState<{
    open: boolean;
    documentUrl: string | null;
    documentType: string;
  }>({
    open: false,
    documentUrl: null,
    documentType: '',
  });

  const [vehicleAssignmentDialog, setVehicleAssignmentDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  const [vehicleUnassignmentDialog, setVehicleUnassignmentDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  const [kycVerificationDialog, setKycVerificationDialog] = useState<{
    open: boolean;
    kyc: RiderKYC | null;
  }>({
    open: false,
    kyc: null,
  });

  // Edit rider dialog state
  const [editRiderDialog, setEditRiderDialog] = useState<boolean>(false);

  // Vehicle assignment state
  const [hubs, setHubs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<VehicleAssignment[]>([]);
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [assignmentLoading, setAssignmentLoading] = useState<boolean>(false);

  // Fetch rider details
  const fetchRiderDetails = useCallback(async () => {
    if (!riderId) return;

    try {
      setLoading(true);
      const response = await riderService.getRiderById(riderId);

      if (response.success && response.data) {
        setRider(response.data);
      } else {
        enqueueSnackbar('Failed to load rider details', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error fetching rider details:', error);
      enqueueSnackbar(error.message || 'Error loading rider details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [riderId, enqueueSnackbar]);

  // Fetch KYC documents
  const fetchKYCDocuments = useCallback(async () => {
    if (!riderId) return;

    try {
      setKycLoading(true);
      const response = await riderService.getRiderKYC(riderId);

      if (response.success) {
        setKycDocuments(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching KYC documents:', error);
    } finally {
      setKycLoading(false);
    }
  }, [riderId]);

  // Fetch earnings
  const fetchEarnings = useCallback(async () => {
    if (!riderId) return;

    try {
      const [earningsResponse, summaryResponse] = await Promise.all([
        riderService.getRiderEarnings(riderId, {
          page: 1,
          limit: 50,
          period: earningsPeriod,
          sortBy: 'orderDate',
          sortOrder: 'desc',
        }),
        riderService.getRiderEarningsSummary(riderId, earningsPeriod),
      ]);

      if (earningsResponse.success) {
        setEarnings(earningsResponse.data);
      }

      if (summaryResponse.success) {
        setEarningsSummary(summaryResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching earnings:', error);
    }
  }, [riderId, earningsPeriod]);

  // Fetch vehicle history
  const fetchVehicleHistory = useCallback(async () => {
    if (!riderId) return;

    try {
      setVehicleHistoryLoading(true);
      const response = await vehicleHistoryService.getRiderVehicleHistory(riderId);

      if (response.success) {
        setVehicleHistory(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching vehicle history:', error);
    } finally {
      setVehicleHistoryLoading(false);
    }
  }, [riderId]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    if (!riderId) return;

    try {
      // TODO: Replace with actual API call when available
      // const response = await riderService.getRiderPayments(riderId);
      // if (response.success) {
      //   setPaymentHistory(response.data);
      // }

      // For now, set empty array
      setPaymentHistory([]);
      console.log('Payment history API not yet implemented');
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    }
  }, [riderId]);

  // Fetch EV Rental data
  const fetchRentalData = useCallback(async () => {
    if (!riderId) return;

    try {
      setRentalLoading(true);
      const rental = await getCurrentRental(riderId);

      if (rental) {
        // Fetch payments for this rental
        const paymentsData = await getRentalPayments(riderId, rental.id);

        // Combine rental with payments
        const rentalWithPayments: RentalWithPayments = {
          ...rental,
          payments: paymentsData.payments || [],
        };

        setCurrentRental(rentalWithPayments);
      } else {
        setCurrentRental(null);
      }
    } catch (error: any) {
      console.error('Error fetching rental data:', error);
      setCurrentRental(null);
    } finally {
      setRentalLoading(false);
    }
  }, [riderId]);

  // Fetch hubs for vehicle assignment
  const fetchHubs = useCallback(async () => {
    try {
      console.log('🔵 [RiderDetail] Fetching hubs...');
      const response = await riderService.getHubs();
      console.log('🔵 [RiderDetail] Hubs response:', response);
      if (response.success) {
        console.log('✅ [RiderDetail] Setting hubs:', response.data.length, 'hubs');
        setHubs(response.data);
      } else {
        console.warn('⚠️ [RiderDetail] Hubs fetch failed:', response.message);
      }
    } catch (error) {
      console.error('❌ [RiderDetail] Error fetching hubs:', error);
    }
  }, []);

  // Fetch available vehicles based on selected hub
  const fetchAvailableVehicles = useCallback(
    async (hubId?: string) => {
      try {
        setAssignmentLoading(true);
        setVehicles([]); // Clear previous vehicles
        console.log('🔵 [RiderDetail] Fetching available vehicles with hubId:', hubId || 'none');
        const response = await riderService.getAvailableVehicles(hubId);
        console.log('🔵 [RiderDetail] Vehicles response:', response);
        if (response.success) {
          console.log('✅ [RiderDetail] Fetched vehicles:', response.data.length, 'vehicles');
          console.log('✅ [RiderDetail] Setting vehicles:', response.data);
          setVehicles(response.data);
        } else {
          console.warn('⚠️ [RiderDetail] Failed to fetch vehicles:', response.message);
          enqueueSnackbar(response.message || 'Failed to load vehicles', { variant: 'warning' });
        }
      } catch (error) {
        console.error('❌ [RiderDetail] Error fetching vehicles:', error);
        enqueueSnackbar('Error loading vehicles', { variant: 'error' });
      } finally {
        setAssignmentLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  // Load data based on active tab
  useEffect(() => {
    fetchRiderDetails();
  }, [fetchRiderDetails]);

  useEffect(() => {
    switch (tabValue) {
      case 1: // KYC Documents
        fetchKYCDocuments();
        break;
      case 2: // Bank Details (handled by component)
        break;
      case 3: // EV Rental
        fetchRentalData();
        break;
      case 4: // Earnings
        fetchEarnings();
        break;
      case 5: // Payment History
        fetchPaymentHistory();
        break;
      case 6: // Vehicle History
        fetchVehicleHistory();
        break;
    }
  }, [tabValue, fetchKYCDocuments, fetchEarnings, fetchVehicleHistory, fetchPaymentHistory, fetchRentalData]);

  // Handle KYC document upload
  const handleKYCUpload = async (kycData: any, progressCallback?: (progress: number) => void) => {
    if (!riderId) return;

    try {
      const response = await riderService.submitKYC(
        riderId,
        kycData,
        progressCallback
      );

      if (response.success) {
        enqueueSnackbar('KYC document uploaded successfully', { variant: 'success' });
        fetchKYCDocuments();
        fetchRiderDetails(); // Refresh rider data to update KYC status
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to upload KYC document', { variant: 'error' });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  // Handle KYC verification
  const handleKYCVerify = async (status: 'verified' | 'rejected', notes: string) => {
    if (!riderId || !kycVerificationDialog.kyc) return;

    try {
      const response = await riderService.verifyKYC(
        riderId,
        kycVerificationDialog.kyc.id,
        status,
        notes
      );

      if (response.success) {
        enqueueSnackbar(
          `KYC document ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
          { variant: 'success' }
        );
        fetchKYCDocuments();
        setKycVerificationDialog({ open: false, kyc: null });
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to verify KYC document', { variant: 'error' });
    }
  };

  // Handle vehicle assignment
  const handleVehicleAssignment = async () => {
    if (!riderId || !selectedVehicle) {
      enqueueSnackbar('Please select a vehicle', { variant: 'warning' });
      return;
    }

    try {
      setAssignmentLoading(true);
      const response = await riderService.assignVehicleToRider(riderId, {
        vehicleId: selectedVehicle,
        hubId: selectedHub || undefined,
      });

      if (response.success) {
        enqueueSnackbar('Vehicle assigned successfully', { variant: 'success' });
        setVehicleAssignmentDialog({ open: false });
        setSelectedHub('');
        setSelectedVehicle('');
        fetchRiderDetails();
        fetchVehicleHistory();
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to assign vehicle', { variant: 'error' });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle vehicle unassignment
  const handleUnassignVehicle = async (reason: string) => {
    if (!riderId) return;

    try {
      const response = await riderService.unassignVehicleFromRider(riderId, reason);

      if (response.success) {
        enqueueSnackbar('Vehicle unassigned successfully', { variant: 'success' });
        setVehicleUnassignmentDialog({ open: false });
        fetchRiderDetails();
        fetchVehicleHistory();
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to unassign vehicle', { variant: 'error' });
      throw error; // Re-throw to let dialog handle the error
    }
  };

  // Open unassignment dialog
  const handleOpenUnassignmentDialog = () => {
    setVehicleUnassignmentDialog({ open: true });
  };

  // Handle opening vehicle assignment dialog
  // Handle vehicle assignment button click
  const handleAssignVehicle = () => {
    console.log('🚀 [RiderDetail] Opening vehicle assignment dialog');
    console.log('🚀 [RiderDetail] Current hubs:', hubs.length);
    console.log('🚀 [RiderDetail] Current vehicles:', vehicles.length);
    setVehicleAssignmentDialog({ open: true });
    console.log('🚀 [RiderDetail] Fetching hubs...');
    fetchHubs();
    console.log('🚀 [RiderDetail] Fetching available vehicles...');
    fetchAvailableVehicles();
  };

  // Handle navigate to vehicle detail page
  const handleNavigateToVehicle = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  // Handle edit rider
  const handleOpenEditRider = () => {
    setEditRiderDialog(true);
  };

  const handleCloseEditRider = () => {
    setEditRiderDialog(false);
  };

  const handleSaveRider = async (formData: any) => {
    if (!riderId) return;

    try {
      const response = await riderService.updateRider(riderId, formData);

      if (response.success) {
        enqueueSnackbar('Rider updated successfully', { variant: 'success' });
        handleCloseEditRider();
        fetchRiderDetails(); // Refresh rider data
      } else {
        enqueueSnackbar(response.message || 'Failed to update rider', { variant: 'error' });
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update rider', { variant: 'error' });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/rider-management');
  };

  // Handle EV Rental actions
  const handleOpenRentalAssignment = () => {
    setRentalAssignmentDialog(true);
  };

  const handleRentalCreated = () => {
    enqueueSnackbar('EV Rental assigned successfully', { variant: 'success' });
    setRentalAssignmentDialog(false);
    fetchRentalData();
    fetchRiderDetails(); // Refresh rider data to update rental status
  };

  const handlePreferenceSelected = (_preference: any, modelId: string, _ownVehicleType?: any) => {
    enqueueSnackbar('Vehicle preference saved successfully', { variant: 'success' });
    fetchRiderDetails(); // Refresh rider data
    // Auto-open rental assignment if rider selected a model
    if (modelId && !currentRental) {
      setTimeout(() => {
        handleOpenRentalAssignment();
      }, 500);
    }
  };

  const handlePaymentUpdated = () => {
    fetchRentalData(); // Refresh rental and payment data
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Rider not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleBack();
          }}
        >
          Rider Management
        </Link>
        <Typography color="text.primary">{rider.name || 'Rider Details'}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ArrowBackIcon
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={handleBack}
          />
          <Typography variant="h4" component="h1">
            Rider Details
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleOpenEditRider}
        >
          Edit Rider
        </Button>
      </Box>

      {/* Rider Info Header Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
            {rider.name ? rider.name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5">
                {rider.name || 'No Name'}
              </Typography>
              {rider.publicRiderId && (
                <Chip
                  label={rider.publicRiderId}
                  color="primary"
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
                />
              )}
              {rider.workType && (
                <Typography variant="body1" color="text.secondary" sx={{ ml: 'auto', fontWeight: 500 }}>
                  {rider.workType === 'FULL_TIME' ? 'Full-Time' : 'Part-Time'}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={rider.isActive ? 'Active' : 'Inactive'}
                color={rider.isActive ? 'success' : 'error'}
                size="small"
              />
              <Chip
                label={`Registration: ${rider.registrationStatus}`}
                color={rider.registrationStatus?.toLowerCase() === 'completed' ? 'success' : 'warning'}
                size="small"
              />
              <Chip
                label={`KYC: ${rider.kycStatus}`}
                color={rider.kycStatus === 'verified' ? 'success' : 'warning'}
                size="small"
              />
              {rider.phoneVerified && (
                <Chip label="Phone Verified" color="success" size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ReceiptIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {rider.totalOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CurrencyRupeeIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
                  </Typography>
                </Box>
                <Typography variant="h5">
                  ₹{rider.totalEarnings?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalShippingIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {rider.completionRate ? `${rider.completionRate.toFixed(1)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {rider.averageRating ? `${rider.averageRating.toFixed(1)} ⭐` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Registration Status Completer */}
      {riderId && (
        <RiderRegistrationCompleter
          riderId={riderId}
          onRegistrationUpdated={fetchRiderDetails}
        />
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="rider detail tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              '&.Mui-selected': {
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="KYC Documents" icon={<VerifiedUserIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Bank Details" icon={<AccountBalanceIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="EV Rental" icon={<TwoWheelerIcon />} iconPosition="start" {...a11yProps(3)} />
          <Tab label="Earnings" icon={<CurrencyRupeeIcon />} iconPosition="start" {...a11yProps(4)} />
          <Tab label="Payment History" icon={<PaymentIcon />} iconPosition="start" {...a11yProps(5)} />
          <Tab label="Vehicle History" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(6)} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {/* Index 0: Profile */}
      <TabPanel value={tabValue} index={0}>
        <RiderProfileTab rider={rider} />
      </TabPanel>

      {/* Index 1: KYC Documents */}
      <TabPanel value={tabValue} index={1}>
        <RiderKYCTab
          kycDocuments={kycDocuments}
          kycStatus={rider.kycStatus}
          loading={kycLoading}
          onViewDocument={(url, title) =>
            setDocumentPreviewDialog({ open: true, documentUrl: url, documentType: title })
          }
          onVerifyDocument={(kyc: RiderKYC) => setKycVerificationDialog({ open: true, kyc })}
          onRequestDocuments={() => {
            enqueueSnackbar('Document request feature coming soon', { variant: 'info' });
          }}
          onUploadDocument={handleKYCUpload}
        />
      </TabPanel>

      {/* Index 2: Bank Details */}
      <TabPanel value={tabValue} index={2}>
        {riderId && <BankDetailsSection riderId={riderId} />}
      </TabPanel>

      {/* Index 3: EV Rental */}
      <TabPanel value={tabValue} index={3}>
        <Box>
          {rentalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : currentRental ? (
            <Box>
              {/* Rental Payment Tab */}
              <RentalPaymentTab
                riderId={riderId!}
                rental={currentRental}
                onPaymentUpdated={handlePaymentUpdated}
              />
            </Box>
          ) : (
            <Box sx={{ px: 3, pb: 3 }}>
              <Grid container spacing={3}>
                {/* Info Alert at Top */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    Select a vehicle preference to enable EV rental for this rider. The rider can then be assigned a rental vehicle.
                  </Alert>
                </Grid>

                {/* EV Rental Preference Section - Full Width at Top */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        EV Rental Preference
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {/* Warning Alert when Vehicle is Assigned */}
                      {rider.assignedVehicle && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Vehicle Currently Assigned:</strong> {rider.assignedVehicle.registrationNumber}{' '}
                            ({rider.assignedVehicle.make} {rider.assignedVehicle.model})
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            EV Rental preference is locked to <strong>"Yes"</strong> while a vehicle is assigned.
                            To change this to "No", please unassign the vehicle first.
                          </Typography>
                        </Alert>
                      )}

                      <VehiclePreferenceSelector
                        riderId={riderId!}
                        needsEvRental={rider.needsEvRental ?? false}
                        currentPreference={(rider.vehiclePreference as any) ?? undefined}
                        currentModelId={rider.preferredVehicleModelId ?? undefined}
                        currentOwnVehicleType={(rider.ownVehicleType as any) ?? undefined}
                        onPreferenceSelected={handlePreferenceSelected}
                        disabled={!!rider.assignedVehicle}
                      />

                      {/* Helper text when vehicle is assigned */}
                      {rider.assignedVehicle && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Vehicle assigned: {rider.assignedVehicle.registrationNumber} - Cannot change to "No" until vehicle is unassigned
                        </Typography>
                      )}

                      {/* Display current own vehicle type if set */}
                      {rider.ownVehicleType && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Rider's Current Vehicle:</strong> {
                              rider.ownVehicleType === 'OWN_VEHICLE' ? 'Own Vehicle' :
                              rider.ownVehicleType === 'RENTED_VEHICLE' ? 'Rented Vehicle' :
                              rider.ownVehicleType === 'CYCLE' ? 'Cycle' :
                              rider.ownVehicleType === 'WALK' ? 'Walk' :
                              rider.ownVehicleType
                            }
                          </Typography>
                        </Alert>
                      )}

                      {rider.preferredVehicleModelId && (
                        <Box sx={{ mt: 2 }}>
                          {/* Warning if assignment criteria not met */}
                          {(!rider.needsEvRental || rider.registrationStatus?.toLowerCase() !== 'completed' || !rider.isActive) && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Vehicle assignment is currently disabled:
                              </Typography>
                              {!rider.needsEvRental && (
                                <Typography variant="body2">
                                  • Vehicle preference must be set to <strong>"Yes"</strong> to enable EV rental vehicle assignment.
                                </Typography>
                              )}
                              {rider.registrationStatus?.toLowerCase() !== 'completed' && (
                                <Typography variant="body2">
                                  • Rider registration must be completed before assigning a vehicle. Current status: <strong>{rider.registrationStatus}</strong>
                                </Typography>
                              )}
                              {!rider.isActive && (
                                <Typography variant="body2">
                                  • Rider account must be active to assign a vehicle. Please activate the rider first.
                                </Typography>
                              )}
                            </Alert>
                          )}

                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleOpenRentalAssignment}
                              size="large"
                              startIcon={<TwoWheelerIcon />}
                              disabled={
                                !rider.needsEvRental ||
                                rider.registrationStatus?.toLowerCase() !== 'completed' ||
                                !rider.isActive
                              }
                            >
                              Assign EV Rental Vehicle
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Vehicle Assignment Section - Full Width Below */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Vehicle Assignment</Typography>
                        {rider.assignedVehicle ? (
                          <Button variant="outlined" color="error" size="small" onClick={handleOpenUnassignmentDialog}>
                            Unassign
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<TwoWheelerIcon />}
                            size="small"
                            onClick={handleAssignVehicle}
                            disabled={
                              !rider.needsEvRental ||
                              rider.registrationStatus?.toLowerCase() !== 'completed' ||
                              !rider.isActive
                            }
                          >
                            Assign Vehicle
                          </Button>
                        )}
                      </Box>

                      {/* Show warning if vehicle assignment is disabled */}
                      {!rider.assignedVehicle && (!rider.needsEvRental || rider.registrationStatus?.toLowerCase() !== 'completed' || !rider.isActive) && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          {!rider.needsEvRental && (
                            <Typography variant="body2">
                              • Vehicle preference must be set to <strong>"Yes"</strong> to enable vehicle assignment. Please update the EV Rental Preference above.
                            </Typography>
                          )}
                          {rider.registrationStatus?.toLowerCase() !== 'completed' && (
                            <Typography variant="body2">
                              • Rider registration must be completed before assigning a vehicle. Current status: <strong>{rider.registrationStatus}</strong>
                            </Typography>
                          )}
                          {!rider.isActive && (
                            <Typography variant="body2">
                              • Rider account must be active to assign a vehicle. Please activate the rider first.
                            </Typography>
                          )}
                        </Alert>
                      )}

                      <Divider sx={{ mb: 2 }} />

                      {rider.assignedVehicle ? (
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Registration Number
                            </Typography>
                            <Link
                              component="button"
                              variant="body1"
                              fontWeight="medium"
                              onClick={() => handleNavigateToVehicle(rider.assignedVehicle!.id)}
                              sx={{
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {rider.assignedVehicle.registrationNumber}
                            </Link>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Vehicle
                            </Typography>
                            <Typography variant="body1">
                              {rider.assignedVehicle.make} {rider.assignedVehicle.model}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Assigned Date
                            </Typography>
                            <Typography variant="body1">
                              {rider.assignedVehicle.assignedDate
                                ? new Date(rider.assignedVehicle.assignedDate).toLocaleDateString('en-IN')
                                : 'Not available'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Status
                            </Typography>
                            <Chip
                              label="Active"
                              color="success"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                        </Grid>
                      ) : (
                        <Alert severity="info">
                          No vehicle currently assigned. Use "Assign EV Rental Vehicle" button above after selecting a vehicle preference.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Index 4: Earnings */}
      <TabPanel value={tabValue} index={4}>
        <RiderEarningsTab
          earnings={earnings}
          earningsSummary={earningsSummary}
          earningsPeriod={earningsPeriod}
          onPeriodChange={(period) => {
            setEarningsPeriod(period);
          }}
        />
      </TabPanel>

      {/* Index 5: Payment History */}
      <TabPanel value={tabValue} index={5}>
        <RiderPaymentHistoryTab payments={paymentHistory} />
      </TabPanel>

      {/* Index 6: Vehicle History */}
      <TabPanel value={tabValue} index={6}>
        <RiderVehicleHistoryTab vehicleHistory={vehicleHistory} loading={vehicleHistoryLoading} />
      </TabPanel>

      {/* Dialogs */}
      <DocumentPreviewDialog
        open={documentPreviewDialog.open}
        url={documentPreviewDialog.documentUrl}
        title={documentPreviewDialog.documentType}
        onClose={() =>
          setDocumentPreviewDialog({ open: false, documentUrl: null, documentType: '' })
        }
      />

      <VehicleAssignmentDialog
        open={vehicleAssignmentDialog.open}
        availableHubs={hubs}
        availableVehicles={vehicles}
        selectedHub={selectedHub}
        selectedVehicle={selectedVehicle}
        vehiclesLoading={assignmentLoading}
        onHubChange={(hubId) => {
          console.log('🔄 [RiderDetail] Hub changed to:', hubId);
          setSelectedHub(hubId);
          console.log('🔄 [RiderDetail] Fetching vehicles for hub:', hubId);
          fetchAvailableVehicles(hubId);
        }}
        onVehicleChange={(vehicleId) => {
          console.log('🔄 [RiderDetail] Vehicle changed to:', vehicleId);
          setSelectedVehicle(vehicleId);
        }}
        onAssign={handleVehicleAssignment}
        onClose={() => {
          console.log('❌ [RiderDetail] Closing vehicle assignment dialog');
          setVehicleAssignmentDialog({ open: false });
          setSelectedHub('');
          setSelectedVehicle('');
        }}
      />

      <KYCVerificationDialog
        open={kycVerificationDialog.open}
        kyc={kycVerificationDialog.kyc}
        onClose={() => setKycVerificationDialog({ open: false, kyc: null })}
        onVerify={handleKYCVerify}
      />

      {/* Vehicle Unassignment Dialog */}
      <VehicleUnassignmentDialog
        open={vehicleUnassignmentDialog.open}
        onClose={() => setVehicleUnassignmentDialog({ open: false })}
        onConfirm={handleUnassignVehicle}
        vehicleInfo={
          rider?.assignedVehicle
            ? {
                registrationNumber: rider.assignedVehicle.registrationNumber,
                make: rider.assignedVehicle.make,
                model: rider.assignedVehicle.model,
              }
            : undefined
        }
      />

      {/* Edit Rider Dialog */}
      <EnhancedRiderForm
        open={editRiderDialog}
        rider={rider}
        onClose={handleCloseEditRider}
        onSave={handleSaveRider}
      />

      {/* EV Rental Assignment Dialog */}
      {riderId && (
        <EVRentalAssignmentDialog
          open={rentalAssignmentDialog}
          riderId={riderId}
          riderName={rider.name || 'Rider'}
          preferredModelId={rider.preferredVehicleModelId ?? undefined}
          onClose={() => setRentalAssignmentDialog(false)}
          onRentalCreated={handleRentalCreated}
        />
      )}
    </Box>
  );
};

export default RiderDetail;
