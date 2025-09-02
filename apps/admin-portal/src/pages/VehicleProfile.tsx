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
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Link,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PhotoLibrary as PhotoIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  DirectionsBike as VehicleIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService, Vehicle, MediaFile } from '../services/vehicleService';
import { riderService } from '../services';

interface ServiceRecord {
  id: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  workPerformed?: string;
  serviceStatus: string;
  cost?: number;
  serviceCenter?: string;
  technicianName?: string;
  nextServiceDate?: string;
}

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

const VehicleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [currentRiderName, setCurrentRiderName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchVehicleData();
      fetchMediaFiles();
      fetchServiceHistory();
    }
  }, [id]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicle(id!);
      console.log('Vehicle data received:', response.data);
      console.log('Hub data:', response.data.hub);
      console.log('Insurance data:', response.data.insuranceDetails);
      setVehicle(response.data);

      // Fetch rider name if there's a currentRiderId
      if (response.data.currentRiderId) {
        fetchCurrentRiderName(response.data.currentRiderId);
      }
    } catch (error: any) {
      console.error('Error fetching vehicle:', error);
      setError('Failed to fetch vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceHistory = async () => {
    try {
      setServiceLoading(true);
      const response = await vehicleService.getVehicleServiceHistory(id!);
      console.log('Service history received:', response.data);
      setServiceHistory(response.data?.serviceHistory || []);
    } catch (error: any) {
      console.error('Error fetching service history:', error);
      // Don't set a general error for service history, just log it
      setServiceHistory([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const fetchCurrentRiderName = async (riderId: string) => {
    try {
      console.log('Fetching rider data for ID:', riderId);
      const response = await riderService.getRiderById(riderId);
      console.log('Rider data received:', response);

      if (response.success && response.data) {
        const riderName = response.data.name || `${response.data.phone}`;
        console.log('Setting rider name:', riderName);
        setCurrentRiderName(riderName);
      } else {
        console.log('Rider API call failed or no data, using fallback:', riderId);
        setCurrentRiderName(riderId);
      }
    } catch (error: any) {
      console.error('Error fetching rider:', error);
      // Keep the riderId as fallback
      setCurrentRiderName(riderId);
    }
  };

  const fetchMediaFiles = async () => {
    try {
      setMediaLoading(true);
      const response = await vehicleService.getMediaFiles(id!);
      setMediaFiles(response.data || []);
    } catch (error: any) {
      console.error('Error fetching media files:', error);
      setError('Failed to fetch media files');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getMediaByType = (type: string) => {
    return mediaFiles.filter(media =>
      media.mediaType.toLowerCase().includes(type.toLowerCase()) ||
      media.mediaCategory.toLowerCase().includes(type.toLowerCase())
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Assigned': return 'primary';
      case 'Under Maintenance': return 'warning';
      case 'Retired': return 'default';
      case 'Damaged': return 'error';
      default: return 'default';
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleDownload = (mediaFile: MediaFile) => {
    // For S3 files, open the view URL which will redirect to presigned URL
    window.open(vehicleService.getMediaViewUrl(mediaFile.id), '_blank');
  };

  const handleView = (mediaFile: MediaFile) => {
    // Open in new tab for viewing
    window.open(vehicleService.getMediaViewUrl(mediaFile.id), '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMediaGrid = (mediaList: MediaFile[], title: string) => {
    if (mediaList.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No {title.toLowerCase()} available
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {mediaList.map((media) => (
          <Grid item xs={12} sm={6} md={4} key={media.id}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {media.fileType.startsWith('image/') ? (
                    <PhotoIcon color="primary" />
                  ) : (
                    <FileIcon color="action" />
                  )}
                  <Typography variant="subtitle2" sx={{ ml: 1, flex: 1 }} noWrap>
                    {media.fileName}
                  </Typography>
                </Box>

                {media.fileType.startsWith('image/') && media.url && (
                  <Box
                    component="img"
                    src={media.url}
                    alt={media.fileName}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      mb: 2
                    }}
                    onClick={() => handleImageClick(media.url!)}
                  />
                )}

                <Typography variant="caption" color="text.secondary" display="block">
                  {media.mediaType}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Size: {formatFileSize(media.fileSize)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Uploaded: {new Date(media.uploadDate).toLocaleDateString()}
                </Typography>

                {media.description && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {media.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleView(media)}
                    variant="outlined"
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(media)}
                    variant="text"
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Vehicle not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/vehicles')}
          sx={{ mt: 2 }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/vehicles')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Vehicle Profile
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

      {/* Main Content with Tabs */}
      <Card variant="outlined">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Debug Info: Hub Data Available: {vehicle.hub ? 'Yes' : 'No'} |
              Insurance Data Available: {vehicle.insuranceDetails && vehicle.insuranceDetails.length > 0 ? 'Yes' : 'No'}
            </Typography>
            {vehicle.hub && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                Hub Properties: {Object.keys(vehicle.hub).join(', ')}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="vehicle profile tabs">
            <Tab label="Basic Information" />
            <Tab label="Service History" />
            <Tab label={`All Documents (${mediaFiles.length})`} />
            <Tab label={`Photos (${getMediaByType('photo').length})`} />
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {/* Vehicle Overview */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                        <VehicleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" gutterBottom>
                          {vehicle.registrationNumber}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {vehicle.model?.oem?.name} {vehicle.model?.name}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Chip
                        label={vehicle.operationalStatus}
                        color={getStatusColor(vehicle.operationalStatus) as any}
                        variant="filled"
                      />
                      <Chip
                        label={vehicle.serviceStatus}
                        color={vehicle.serviceStatus === 'Active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Color</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.color}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Year</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.year || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Mileage</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.mileage} km</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Assigned Hub</Typography>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          {(vehicle.hub as any)?.hubName || vehicle.hub?.name || 'Not assigned'}
                        </Typography>
                        {vehicle.hub?.address && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            📍 {vehicle.hub.address}
                          </Typography>
                        )}
                        {vehicle.hub?.city && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            🏙️ {vehicle.hub.city.name || vehicle.hub.city.displayName}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Vehicle Specifications */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Vehicle Specifications</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Chassis Number</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.chassisNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Engine Number</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.engineNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Variant</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.variant || 'N/A'}</Typography>
                  </Grid>
                  {vehicle.batteryCapacity && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Battery Capacity</Typography>
                      <Typography variant="body2" fontWeight="medium">{vehicle.batteryCapacity} kWh</Typography>
                    </Grid>
                  )}
                  {vehicle.maxRange && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Max Range</Typography>
                      <Typography variant="body2" fontWeight="medium">{vehicle.maxRange} km</Typography>
                    </Grid>
                  )}
                  {vehicle.maxSpeed && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Max Speed</Typography>
                      <Typography variant="body2" fontWeight="medium">{vehicle.maxSpeed} km/h</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Hub Assignment Details */}
            {vehicle.hub && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Assigned Hub Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Hub Name</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {(vehicle.hub as any)?.hubName || vehicle.hub?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Hub Code</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {(vehicle.hub as any)?.hubCode || vehicle.hub?.code || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">City</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.hub.city?.name || vehicle.hub.city?.displayName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.hub.address || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Hub Type</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.hub.hubType || 'N/A'}
                      </Typography>
                    </Grid>
                    {vehicle.hub.contactNumber && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Contact Number</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.hub.contactNumber}</Typography>
                      </Grid>
                    )}
                    {vehicle.hub.managerName && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Manager</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.hub.managerName}</Typography>
                      </Grid>
                    )}
                    {vehicle.hub.vehicleCapacity && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Vehicle Capacity</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.hub.vehicleCapacity} vehicles</Typography>
                      </Grid>
                    )}
                    {vehicle.hub.chargingPoints && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Charging Points</Typography>
                        <Typography variant="body2" fontWeight="medium">{vehicle.hub.chargingPoints}</Typography>
                      </Grid>
                    )}
                    {vehicle.hub.hasChargingStation !== undefined && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Charging Station</Typography>
                        <Chip
                          label={vehicle.hub.hasChargingStation ? 'Available' : 'Not Available'}
                          color={vehicle.hub.hasChargingStation ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Show message if no hub assigned */}
            {!vehicle.hub && (
              <Card variant="outlined" sx={{ mb: 3, bgcolor: 'warning.light', borderColor: 'warning.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning.contrastText">Hub Assignment</Typography>
                  <Typography color="warning.contrastText">
                    🚨 This vehicle is not assigned to any hub. Please assign it to a hub for proper operation.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Registration Details */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Registration Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">RC Number</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.rcDetails?.rcNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">RC Valid Upto</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.rcDetails?.validUpto ? new Date(vehicle.rcDetails.validUpto).toLocaleDateString() : 'N/A'}</Typography>
                  </Grid>
                  {vehicle.purchaseDate && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Purchase Date</Typography>
                      <Typography variant="body2" fontWeight="medium">{new Date(vehicle.purchaseDate).toLocaleDateString()}</Typography>
                    </Grid>
                  )}
                  {vehicle.purchasePrice && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Purchase Price</Typography>
                      <Typography variant="body2" fontWeight="medium">₹{vehicle.purchasePrice.toLocaleString()}</Typography>
                    </Grid>
                  )}
                  {vehicle.currentValue && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Current Value</Typography>
                      <Typography variant="body2" fontWeight="medium">₹{vehicle.currentValue.toLocaleString()}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Insurance Details */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Insurance Details</Typography>
                {vehicle.insuranceDetails && vehicle.insuranceDetails.length > 0 ? (
                  vehicle.insuranceDetails.map((insurance, index) => (
                    <Card variant="outlined" key={index} sx={{ mb: index < vehicle.insuranceDetails!.length - 1 ? 2 : 0, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="primary.main">
                          Policy #{index + 1} • {insurance.insuranceType || 'Comprehensive'}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Provider</Typography>
                            <Typography variant="body2" fontWeight="medium">{insurance.providerName}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Policy Number</Typography>
                            <Typography variant="body2" fontWeight="medium">{insurance.policyNumber}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Start Date</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {new Date(insurance.policyStartDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              color={new Date(insurance.policyEndDate) < new Date() ? 'error.main' : 'text.primary'}
                            >
                              {new Date(insurance.policyEndDate).toLocaleDateString()}
                              {new Date(insurance.policyEndDate) < new Date() && (
                                <Chip label="Expired" color="error" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Premium Amount</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ₹{insurance.premiumAmount?.toLocaleString() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Coverage Amount</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ₹{insurance.coverageAmount?.toLocaleString() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Chip
                              label={insurance.isActive ? 'Active' : 'Inactive'}
                              color={insurance.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Verification</Typography>
                            <Chip
                              label={insurance.verificationStatus}
                              color={insurance.verificationStatus === 'Verified' ? 'success' :
                                     insurance.verificationStatus === 'Rejected' ? 'error' : 'warning'}
                              size="small"
                            />
                          </Grid>
                          {insurance.renewalReminder && (
                            <Grid item xs={6} sm={4}>
                              <Typography variant="caption" color="text.secondary">Renewal Reminder</Typography>
                              <Chip label="Enabled" color="info" size="small" />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card variant="outlined" sx={{ bgcolor: 'error.light', borderColor: 'error.main' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="error.contrastText">⚠️ No Insurance Coverage</Typography>
                      <Typography color="error.contrastText">
                        This vehicle does not have any insurance details on record. This is a compliance risk and should be addressed immediately.
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="error.contrastText">
                          Required actions:
                        </Typography>
                        <Typography variant="body2" color="error.contrastText">
                          • Add valid insurance policy details
                        </Typography>
                        <Typography variant="body2" color="error.contrastText">
                          • Upload insurance certificate documents
                        </Typography>
                        <Typography variant="body2" color="error.contrastText">
                          • Verify coverage amounts and validity
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Service Information Summary */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Service Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Last Service Date</Typography>
                    <Typography variant="body2" fontWeight="medium">{vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Next Service Due</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color={vehicle.nextServiceDue && new Date(vehicle.nextServiceDue) < new Date() ? 'error.main' : 'text.primary'}
                    >
                      {vehicle.nextServiceDue ? new Date(vehicle.nextServiceDue).toLocaleDateString() : 'N/A'}
                      {vehicle.nextServiceDue && new Date(vehicle.nextServiceDue) < new Date() && (
                        <Chip label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Current Rider</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {vehicle.currentRiderId ? (
                        <Link
                          component="button"
                          variant="body2"
                          fontWeight="medium"
                          onClick={() => navigate(`/rider-management/${vehicle.currentRiderId}`)}
                          sx={{
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            cursor: 'pointer',
                            textAlign: 'left',
                            p: 0,
                            border: 'none',
                            background: 'none'
                          }}
                        >
                          {currentRiderName || vehicle.currentRiderId}
                        </Link>
                      ) : (
                        <Typography variant="body2" fontWeight="medium">
                          Not assigned
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </CardContent>
        </TabPanel>

        {/* Service History Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Service History</Typography>
            {serviceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : serviceHistory.length > 0 ? (
              <Box>
                {serviceHistory.map((service, index) => (
                  <Card key={service.id || index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" color="primary" gutterBottom>
                            {service.serviceType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {service.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={service.serviceStatus}
                          color={
                            service.serviceStatus === 'Completed' ? 'success' :
                            service.serviceStatus === 'In Progress' ? 'warning' :
                            service.serviceStatus === 'Scheduled' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Service Date</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.serviceDate ? new Date(service.serviceDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Cost</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.cost ? `₹${service.cost.toLocaleString()}` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Service Center</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.serviceCenter || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Technician</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.technicianName || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {service.workPerformed && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">Work Performed</Typography>
                          <Typography variant="body2">
                            {service.workPerformed}
                          </Typography>
                        </Box>
                      )}

                      {service.nextServiceDate && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">Next Service Due</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(service.nextServiceDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No service history available for this vehicle
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Service records will appear here once maintenance activities are logged
                </Typography>
              </Box>
            )}
          </CardContent>
        </TabPanel>

        {mediaLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* All Documents Tab */}
            <TabPanel value={tabValue} index={2}>
              {renderMediaGrid(mediaFiles, 'All Documents')}
            </TabPanel>

            {/* Photos Tab */}
            <TabPanel value={tabValue} index={3}>
              {renderMediaGrid(getMediaByType('photo'), 'Photos')}
            </TabPanel>
          </>
        )}
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Image Preview</Typography>
            <IconButton onClick={() => setSelectedImage(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Preview"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VehicleProfile;
