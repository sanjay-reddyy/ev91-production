import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Snackbar,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Build as ServiceIcon,
  Warning as DamageIcon,
  PhotoCamera as PhotoIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vehicleService, Vehicle, ServiceRecord, DamageRecord, MediaFile } from '../services/vehicleService';
import VehicleServiceManager from '../components/VehicleServiceManager';

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
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

  const statusColors = {
    'Available': 'success',
    'Assigned': 'info',
    'Under Maintenance': 'warning',
    'Retired': 'error',
    'Damaged': 'error',
  } as const;const serviceStatusColors = {
  'Completed': 'success',
  'In Progress': 'warning',
  'Scheduled': 'info',
  'Cancelled': 'error',
} as const;

const damageStatusColors = {
  'Reported': 'warning',
  'Under Review': 'info',
  'Approved for Repair': 'primary',
  'In Repair': 'warning',
  'Resolved': 'success',
  'Rejected': 'error',
} as const;

const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);
  
  // Status change dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    newStatus: string;
    reason: string;
  }>({
    open: false,
    newStatus: '',
    reason: '',
  });

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

  // Load vehicle data
  const loadVehicle = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [vehicleResponse, mediaResponse, serviceResponse, damageResponse] = await Promise.all([
        vehicleService.getVehicle(id),
        vehicleService.getMediaFiles(id),
        vehicleService.getServiceRecords({ vehicleId: id }),
        vehicleService.getDamageRecords({ vehicleId: id }),
      ]);

      setVehicle(vehicleResponse.data);
      setMediaFiles(mediaResponse.data);
      setServiceRecords(serviceResponse.data);
      setDamageRecords(damageResponse.data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle details. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const handleStatusChange = async () => {
    if (!vehicle || !statusDialog.newStatus) return;

    try {
      await vehicleService.updateVehicleStatus(
        vehicle.id,
        statusDialog.newStatus,
        statusDialog.reason
      );
      
      setSnackbar({
        open: true,
        message: 'Vehicle status updated successfully',
        severity: 'success',
      });
      
      setStatusDialog({ open: false, newStatus: '', reason: '' });
      loadVehicle();
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update vehicle status. Please try again.',
        severity: 'error',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getVehicleAge = (purchaseDate?: Date) => {
    if (!purchaseDate) return 'N/A';
    const years = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const getMediaByType = (type: string) => {
    return mediaFiles.filter(file => file.fileType === type);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading vehicle details...</Typography>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Vehicle not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/vehicles')} size="large">
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {vehicle.model?.oem?.name} {vehicle.model?.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {vehicle.registrationNumber}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
        >
          Edit Vehicle
        </Button>
      </Box>

      {/* Vehicle Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.light', fontSize: '2rem' }}
                >
                  🏍️
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {vehicle.model?.oem?.name} {vehicle.model?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.registrationNumber}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={vehicle.operationalStatus}
                  color={statusColors[vehicle.operationalStatus]}
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={() => setStatusDialog({ open: true, newStatus: '', reason: '' })}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">Mileage</Typography>
              <Typography variant="h6" fontWeight="bold">
                {vehicle.mileage.toLocaleString()} km
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="h6" fontWeight="bold">
                {getVehicleAge(vehicle.purchaseDate)}
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">Location</Typography>
              <Typography variant="h6" fontWeight="bold">
                {vehicle.location}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Basic Info" icon={<AssignmentIcon />} />
          <Tab label="Service History" icon={<ServiceIcon />} />
          <Tab label="Damage Records" icon={<DamageIcon />} />
          <Tab label="Photos & Documents" icon={<PhotoIcon />} />
        </Tabs>

        {/* Basic Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">OEM Type</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.model?.oem?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.model?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Battery Capacity</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.batteryCapacity} kWh</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Range</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.maxRange} km</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {vehicle.purchaseDate ? format(new Date(vehicle.purchaseDate), 'dd MMM yyyy') : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Current Value</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(vehicle.currentValue || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Registration & Insurance</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Chassis Number</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.chassisNumber || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Engine Number</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.engineNumber || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Vehicle Year</Typography>
                      <Typography variant="body1" fontWeight="bold">{vehicle.year || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Service History Tab */}
        <TabPanel value={tabValue} index={1}>
          <VehicleServiceManager
            vehicleId={vehicle.id}
            vehicleInfo={{
              registrationNumber: vehicle.registrationNumber,
              model: vehicle.model?.name || 'Unknown',
              make: vehicle.model?.oem?.name || 'Unknown',
              mileage: vehicle.mileage || 0
            }}
          />
        </TabPanel>

        {/* Damage Records Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Damage Records</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/damage/report?vehicleId=${vehicle.id}`)}
            >
              Report Damage
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Estimated Cost</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {damageRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No damage records found
                    </TableCell>
                  </TableRow>
                ) : (
                  damageRecords.map((damage) => (
                    <TableRow key={damage.id} hover>
                      <TableCell>
                        {format(new Date(damage.reportedDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Chip label={damage.damageType} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={damage.severity}
                          color={damage.severity === 'Major' ? 'error' : damage.severity === 'Moderate' ? 'warning' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{damage.location}</TableCell>
                      <TableCell>
                        <Chip
                          label={damage.damageStatus}
                          color={damageStatusColors[damage.damageStatus]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {damage.estimatedCost ? formatCurrency(damage.estimatedCost) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/damage/${damage.id}`)}
                        >
                          <DamageIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Photos & Documents Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {['Vehicle Photo', 'RC Document', 'Insurance Document', 'Service Photo', 'Damage Photo', 'Rider Upload'].map((fileType) => {
              const files = getMediaByType(fileType);
              
              return (
                <Grid item xs={12} md={6} key={fileType}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{fileType}s</Typography>
                        <Button
                          size="small"
                          startIcon={<PhotoIcon />}
                          onClick={() => {/* Handle file upload */}}
                        >
                          Upload
                        </Button>
                      </Box>
                      
                      {files.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                          No {fileType.toLowerCase()}s uploaded
                        </Typography>
                      ) : (
                        <ImageList cols={2} gap={8}>
                          {files.map((file) => (
                            <ImageListItem key={file.id}>
                              <img
                                src={file.fileUrl}
                                alt={file.fileName}
                                loading="lazy"
                                style={{ height: 140, objectFit: 'cover' }}
                              />
                              <ImageListItemBar
                                title={file.fileName}
                                subtitle={format(new Date(file.uploadDate), 'dd MMM yyyy')}
                                actionIcon={
                                  <Box>
                                    <IconButton
                                      size="small"
                                      sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                      onClick={() => window.open(file.fileUrl, '_blank')}
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Box>
                                }
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Card>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, newStatus: '', reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Vehicle Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={statusDialog.newStatus}
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Change"
                multiline
                rows={3}
                value={statusDialog.reason}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a reason for this status change..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, newStatus: '', reason: '' })}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={!statusDialog.newStatus}
          >
            Update Status
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

export default VehicleDetailsPage;
