import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  DirectionsBike as BikeIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { riderService, Rider, RiderKYCSubmission } from '../services';
import vehicleHistoryService from '../services/vehicleHistoryService';
import riderOrderService from '../services/riderOrderService';
import EnhancedRiderForm from '../components/EnhancedRiderForm';
import RiderRegistrationCompleter from '../components/RiderRegistrationCompleter';
import KycDocumentUpload from '../components/KycDocumentUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

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
  );
};

const RiderDetail: React.FC = () => {
  const { riderId } = useParams<{ riderId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [rider, setRider] = useState<Rider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Data for different tabs
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [documentPreviewDialog, setDocumentPreviewDialog] = useState<{
    open: boolean;
    url: string | null;
    title: string;
  }>({ open: false, url: null, title: '' });

  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);

  const loadRider = useCallback(async () => {
    if (!riderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await riderService.getRiderById(riderId);

      if (response.success) {
        // Debug log for isActive value
        console.log('RiderDetail - Rider data received:', {
          riderId: response.data.id,
          isActive: response.data.isActive,
          isActiveType: typeof response.data.isActive,
          isActiveToString: String(response.data.isActive),
          isActiveBoolCheck: response.data.isActive === true ? 'TRUE' : 'FALSE'
        });

        // Ensure isActive is a proper boolean with strict comparison
        const riderData = {
          ...response.data,
          isActive: response.data.isActive === true
        };

        console.log('RiderDetail - After strict boolean conversion:', {
          isActive: riderData.isActive,
          isActiveType: typeof riderData.isActive,
          isActiveToString: String(riderData.isActive),
        });

        setRider(riderData);
      } else {
        setError(`Failed to load rider: ${response.message}`);
      }
    } catch (err) {
      setError(`Error loading rider: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  const loadVehicleHistory = useCallback(async () => {
    if (!riderId) return;

    try {
      // Fetch vehicle assignment history
      const response = await vehicleHistoryService.getRiderVehicleHistory(riderId);
      if (response.success) {
        setVehicleHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to load vehicle history:', err);
    }
  }, [riderId]);

  const loadOrderHistory = useCallback(async () => {
    if (!riderId) return;

    try {
      // Fetch order history
      const response = await riderOrderService.getRiderOrders(riderId);
      if (response.success) {
        setOrderHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to load order history:', err);
    }
  }, [riderId]);

  const loadPaymentHistory = useCallback(async () => {
    if (!riderId) return;

    try {
      // Fetch payment history
      const response = await riderOrderService.getRiderPayments(riderId);
      if (response.success) {
        setPaymentHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to load payment history:', err);
    }
  }, [riderId]);

  // Load rider data
  useEffect(() => {
    loadRider();
  }, [loadRider]);

  // Load tab data when tab changes
  // Load KYC documents
  const loadKycDocuments = useCallback(async () => {
    if (!riderId) return;
    try {
      setKycLoading(true);
      const response = await riderService.getRiderKYC(riderId);
      if (response.success && response.data) {
        setKycDocuments(response.data);
      } else {
        console.error("Failed to load KYC documents:", response.message);
      }
    } catch (error) {
      console.error("Error loading KYC documents:", error);
    } finally {
      setKycLoading(false);
    }
  }, [riderId]);

  // Handle KYC document upload
  const handleKycDocumentUpload = async (kycData: RiderKYCSubmission) => {
    if (!riderId) return;

    try {
      const response = await riderService.submitKYC(riderId, kycData);
      if (response.success) {
        // Show success message
        enqueueSnackbar('KYC document uploaded successfully', { variant: 'success' });
        // Reload KYC documents
        loadKycDocuments();
      } else {
        enqueueSnackbar(`Failed to upload document: ${response.message}`, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      enqueueSnackbar('Error uploading document. Please try again.', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      loadKycDocuments();
    } else if (tabValue === 2) {
      loadVehicleHistory();
    } else if (tabValue === 3) {
      loadOrderHistory();
    } else if (tabValue === 4) {
      loadPaymentHistory();
    }
  }, [tabValue, loadKycDocuments, loadVehicleHistory, loadOrderHistory, loadPaymentHistory]);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditRider = useCallback(async (formData: any) => {
    if (!riderId) return;

    try {
      const response = await riderService.updateRider(riderId, formData);

      if (response.success) {
        setEditDialogOpen(false);
        loadRider(); // Reload rider data after update
      } else {
        alert(`Failed to update rider: ${response.message}`);
      }
    } catch (err) {
      alert(`Error updating rider: ${(err as Error).message}`);
    }
  }, [riderId, loadRider]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !rider) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !rider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/rider-management')}
          sx={{ mt: 2 }}
        >
          Back to Rider Management
        </Button>
      </Box>
    );
  }

  if (!rider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Rider not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/rider-management')}
          sx={{ mt: 2 }}
        >
          Back to Rider Management
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/rider-management');
          }}
        >
          Rider Management
        </Link>
        <Typography color="text.primary">
          Rider Details
        </Typography>
      </Breadcrumbs>

      {/* Rider Header */}
      <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mr: 3 }}>
            {rider.name ? rider.name.charAt(0) : <PersonIcon fontSize="large" />}
          </Avatar>

          <Box>
            <Typography variant="h4" gutterBottom>
              {rider.name || 'No Name'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body1">
                ID: {rider.id}
              </Typography>
              <Chip
                label={rider.isActive === true ? 'Active' : 'Inactive'}
                color={rider.isActive === true ? 'success' : 'error'}
                size="small"
              />
              <Chip
                label={`Registration: ${rider.registrationStatus}`}
                color={rider.registrationStatus === 'completed' ? 'success' : 'warning'}
                size="small"
              />
              <Chip
                label={`KYC: ${rider.kycStatus}`}
                color={rider.kycStatus === 'verified' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/rider-management')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Rider
          </Button>
        </Box>
      </Paper>

      {/* Registration Status and Actions */}
      <RiderRegistrationCompleter
        riderId={riderId || ''}
        onRegistrationUpdated={loadRider}
      />

      {/* Document Preview Dialog */}
      <Dialog
        open={documentPreviewDialog.open}
        onClose={() => setDocumentPreviewDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
      >
        <DialogTitle>{documentPreviewDialog.title}</DialogTitle>
        <DialogContent>
          {documentPreviewDialog.url && (
            <Box
              component="img"
              src={documentPreviewDialog.url}
              alt={documentPreviewDialog.title}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreviewDialog(prev => ({ ...prev, open: false }))}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          variant="fullWidth"
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<AssignmentIcon />} label="KYC Documents" />
          <Tab icon={<BikeIcon />} label="Vehicle History" />
          <Tab icon={<AssignmentIcon />} label="Order History" />
          <Tab icon={<ReceiptIcon />} label="Payment History" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={4}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {rider.name || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {rider.phone}
                          </Typography>
                          {rider.phoneVerified && <Chip size="small" label="Verified" color="success" />}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {rider.email || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1">
                          {rider.dob ? formatDate(rider.dob) : 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Address Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Address Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {rider.address1 || 'No address provided'}
                          {rider.address2 ? `, ${rider.address2}` : ''}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          City
                        </Typography>
                        <Typography variant="body1">
                          {rider.city || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          State
                        </Typography>
                        <Typography variant="body1">
                          {rider.state || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Pincode
                        </Typography>
                        <Typography variant="body1">
                          {rider.pincode || 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* KYC Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      KYC Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Aadhar Number
                        </Typography>
                        <Typography variant="body1">
                          {rider.aadharNumber || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          PAN Number
                        </Typography>
                        <Typography variant="body1">
                          {rider.panNumber || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Driving License Number
                        </Typography>
                        <Typography variant="body1">
                          {rider.drivingLicenseNumber || 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Emergency Contact
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {rider.emergencyName || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {rider.emergencyPhone || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Relationship
                        </Typography>
                        <Typography variant="body1">
                          {rider.emergencyRelation || 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* KYC Documents Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">KYC Documents</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setUploadDocumentDialogOpen(true)}
              >
                Upload New Document
              </Button>
            </Box>

            {kycLoading ? (
              <CircularProgress />
            ) : kycDocuments.length === 0 ? (
              <Alert severity="info">No KYC documents have been uploaded yet.</Alert>
            ) : (
              <Grid container spacing={3}>
                {kycDocuments.map((kyc) => (
                  <Grid item xs={12} md={6} key={kyc.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">{kyc.documentTypeDisplay || kyc.documentType}</Typography>
                          <Chip
                            label={kyc.verificationStatus}
                            color={kyc.verificationStatus === 'verified' ? 'success' : kyc.verificationStatus === 'rejected' ? 'error' : 'warning'}
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
                              }}
                              onClick={() => setDocumentPreviewDialog({
                                open: true,
                                url: kyc.documentImageUrl || null,
                                title: 'Rider Selfie'
                              })}
                            />
                          </Box>
                        )}

                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">Document Number</Typography>
                            <Typography>{kyc.documentNumber || 'Not available'}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">Submitted Date</Typography>
                            <Typography>{new Date(kyc.createdAt).toLocaleDateString()}</Typography>
                          </Grid>
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => setDocumentPreviewDialog({
                                open: true,
                                url: kyc.documentImageUrl || null,
                                title: kyc.documentTypeDisplay || kyc.documentType
                              })}
                              disabled={!kyc.documentImageUrl}
                              sx={{ mr: 1 }}
                            >
                              View Document
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Vehicle History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vehicle Assignment History
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Assigned On</TableCell>
                    <TableCell>Returned On</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicleHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No vehicle assignment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicleHistory.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {assignment.vehicle.registrationNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.vehicle.make} {assignment.vehicle.model}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                        <TableCell>
                          {assignment.returnedAt ? formatDate(assignment.returnedAt) : 'Active'}
                        </TableCell>
                        <TableCell>
                          {assignment.durationDays} days
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.status}
                            color={
                              assignment.status === 'ACTIVE' ? 'success' :
                              assignment.status === 'RETURNED' ? 'info' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {assignment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Order History Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order History
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No order history
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderHistory.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>₹{order.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={
                              order.status === 'DELIVERED' ? 'success' :
                              order.status === 'CANCELLED' ? 'error' :
                              'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {order.rating ? `${order.rating}/5` : 'Not rated'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No payment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>₹{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={
                              payment.status === 'COMPLETED' ? 'success' :
                              payment.status === 'FAILED' ? 'error' :
                              'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Edit Rider Dialog */}
      <EnhancedRiderForm
        open={editDialogOpen}
        rider={rider}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditRider}
      />

      {/* KYC Document Upload Dialog */}
      <KycDocumentUpload
        open={uploadDocumentDialogOpen}
        onClose={() => setUploadDocumentDialogOpen(false)}
        onSubmit={handleKycDocumentUpload}
      />

      {/* Document Preview Dialog */}
      <Dialog
        open={documentPreviewDialog.open}
        onClose={() => setDocumentPreviewDialog({ open: false, url: null, title: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{documentPreviewDialog.title}</DialogTitle>
        <DialogContent>
          {documentPreviewDialog.url ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
          ) : (
            <Typography align="center">Document image not available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDocumentPreviewDialog({ open: false, url: null, title: '' })}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiderDetail;
