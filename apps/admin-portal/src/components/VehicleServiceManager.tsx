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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Divider,
  LinearProgress,
  Rating,
  Tooltip,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Build as ServiceIcon,
  Payment as PaymentIcon,
  PhotoCamera as PhotoIcon,
  Download as DownloadIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  CalendarMonth as CalendarIcon,
  Engineering as MechanicIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Assessment as ReportIcon,
  DirectionsCar as CarIcon,
  Business as ServiceCenterIcon,
  Person as MechanicPersonIcon,
} from '@mui/icons-material';
import { format, addDays, differenceInDays } from 'date-fns';

interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  issueReported?: string;
  workPerformed: string;
  mechanicName?: string;
  serviceCenter?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  partsReplaced?: string;
  nextServiceDue?: string;
  mileageAtService?: number;
  qualityRating?: number;
  serviceNotes?: string;
  serviceStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  mediaFiles?: any[];
}

interface ServiceStatistics {
  totalServices: number;
  totalCost: number;
  averageCost: number;
  averageQualityRating: number;
  servicesByType: Array<{
    serviceType: string;
    count: number;
    totalCost: number;
  }>;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  mileage: number;
  status: string;
}

interface ServiceCenter {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  rating: number;
  capacity: string;
  contactNumber: string;
}

interface Mechanic {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  experience: number;
}

interface VehicleServiceManagerProps {
  vehicleId: string;
  vehicleInfo: {
    registrationNumber: string;
    model: string;
    make: string;
    mileage: number;
  };
}

const VehicleServiceManager: React.FC<VehicleServiceManagerProps> = ({
  vehicleId,
  vehicleInfo
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [statistics, setStatistics] = useState<ServiceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  // New state for enhanced form
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [availableMechanics, setAvailableMechanics] = useState<Mechanic[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<ServiceCenter | null>(null);

  // Schedule Service Form State
  const [scheduleForm, setScheduleForm] = useState({
    vehicleId: vehicleId || '',
    serviceType: '',
    scheduledDate: '',
    description: '',
    serviceCenter: '',
    serviceCenterId: '',
    mechanicId: '',
    estimatedCost: '',
    priority: 'medium',
    specialInstructions: '',
    reminderEnabled: true
  });

  const serviceTypes = [
    'Preventive Maintenance',
    'Battery Service',
    'Brake Service',
    'Tire Service',
    'Electrical Repair',
    'Body Work',
    'Emergency Repair',
    'Inspection',
    'Software Update',
    'Warranty Service'
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'info' as const },
    { value: 'medium', label: 'Medium', color: 'warning' as const },
    { value: 'high', label: 'High', color: 'error' as const },
    { value: 'urgent', label: 'Urgent', color: 'error' as const }
  ];

  useEffect(() => {
    fetchServiceData();
    fetchVehicles();
    fetchServiceCenters();
  }, [vehicleId]);

  useEffect(() => {
    // Set current vehicle as selected when component loads
    if (vehicleInfo && !selectedVehicle) {
      setSelectedVehicle({
        id: vehicleId,
        registrationNumber: vehicleInfo.registrationNumber,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        mileage: vehicleInfo.mileage,
        status: 'Active'
      });
      setScheduleForm(prev => ({ ...prev, vehicleId }));
    }
  }, [vehicleId, vehicleInfo, selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const authToken = localStorage.getItem('authToken');

      console.log('🔍 Service Management - Vehicles API Base URL:', apiBaseUrl);
      console.log('🔍 Service Management - Vehicles Auth Token exists:', !!authToken);

      if (!authToken) {
        console.error('🔍 Service Management - No auth token found for vehicles API');
        setAvailableVehicles([{
          id: vehicleId,
          registrationNumber: vehicleInfo.registrationNumber,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          mileage: vehicleInfo.mileage,
          status: 'Active'
        }]);
        return;
      }

      const vehiclesUrl = `${apiBaseUrl}/vehicles`;
      console.log('🔍 Service Management - Vehicles URL:', vehiclesUrl);

      const response = await fetch(vehiclesUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('🔍 Service Management - Vehicles Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Service Management - Vehicles Data:', data);
        if (data.success) {
          setAvailableVehicles(data.data.vehicles || []);
        }
      } else {
        const errorData = await response.text();
        console.warn('🔍 Service Management - Vehicles API error:', response.status, errorData);
        setAvailableVehicles([{
          id: vehicleId,
          registrationNumber: vehicleInfo.registrationNumber,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          mileage: vehicleInfo.mileage,
          status: 'Active'
        }]);
      }
    } catch (error) {
      console.error('🔍 Service Management - Error fetching vehicles:', error);
      // Use mock data if API fails
      setAvailableVehicles([{
        id: vehicleId,
        registrationNumber: vehicleInfo.registrationNumber,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        mileage: vehicleInfo.mileage,
        status: 'Active'
      }]);
    }
  };

  const fetchServiceCenters = async () => {
    try {
      // Mock service centers for now - replace with actual API call
      const mockServiceCenters: ServiceCenter[] = [
        {
          id: '1',
          name: 'EV Service Center Mumbai',
          location: 'Andheri West, Mumbai',
          specialties: ['Battery Service', 'Electrical Repair', 'Software Update'],
          rating: 4.5,
          capacity: 'High',
          contactNumber: '+91-9876543210'
        },
        {
          id: '2',
          name: 'Green Auto Service',
          location: 'Bandra East, Mumbai',
          specialties: ['Preventive Maintenance', 'Brake Service', 'Tire Service'],
          rating: 4.2,
          capacity: 'Medium',
          contactNumber: '+91-9876543211'
        },
        {
          id: '3',
          name: 'Premium EV Care',
          location: 'Powai, Mumbai',
          specialties: ['Emergency Repair', 'Body Work', 'Inspection'],
          rating: 4.8,
          capacity: 'Medium',
          contactNumber: '+91-9876543212'
        },
        {
          id: '4',
          name: 'Express EV Service',
          location: 'Goregaon West, Mumbai',
          specialties: ['Battery Service', 'Software Update', 'Warranty Service'],
          rating: 4.3,
          capacity: 'High',
          contactNumber: '+91-9876543213'
        }
      ];
      setServiceCenters(mockServiceCenters);

      // Mock mechanics
      const mockMechanics: Mechanic[] = [
        { id: '1', name: 'Rajesh Kumar', specialties: ['Battery Service', 'Electrical Repair'], rating: 4.7, experience: 8 },
        { id: '2', name: 'Amit Sharma', specialties: ['Brake Service', 'Tire Service'], rating: 4.5, experience: 6 },
        { id: '3', name: 'Priya Patel', specialties: ['Software Update', 'Inspection'], rating: 4.9, experience: 10 },
        { id: '4', name: 'Suresh Gupta', specialties: ['Emergency Repair', 'Body Work'], rating: 4.4, experience: 12 }
      ];
      setAvailableMechanics(mockMechanics);
    } catch (error) {
      console.error('Error fetching service centers:', error);
    }
  };

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      // Fetch service records via API Gateway
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const authToken = localStorage.getItem('authToken');

      console.log('🔍 Service Management - API Base URL:', apiBaseUrl);
      console.log('🔍 Service Management - Auth Token exists:', !!authToken);
      console.log('🔍 Service Management - Vehicle ID:', vehicleId);

      // First, try to get all service records if no specific vehicle ID
      const serviceRecordsUrl = `${apiBaseUrl}/vehicles/services/records`;
      console.log('🔍 Service Management - Service Records URL:', serviceRecordsUrl);

      const serviceRecordsResponse = await fetch(serviceRecordsUrl, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if available
          ...(authToken && {
            'Authorization': `Bearer ${authToken}`
          })
        }
      });

      console.log('🔍 Service Management - Service Records Response Status:', serviceRecordsResponse.status);

      if (serviceRecordsResponse.ok) {
        const data = await serviceRecordsResponse.json();
        console.log('🔍 Service Management - Service Records Data:', data);
        if (data.success) {
          // Filter records for current vehicle if vehicleId is provided
          const allRecords = data.data.serviceRecords || [];
          const filteredRecords = vehicleId ?
            allRecords.filter((record: ServiceRecord) => record.vehicleId === vehicleId) :
            allRecords;
          console.log('🔍 Service Management - Filtered Records:', filteredRecords);
          setServiceRecords(filteredRecords);
        }
      } else {
        const errorData = await serviceRecordsResponse.text();
        console.warn('🔍 Service Management - Service records API error:', serviceRecordsResponse.status, errorData);
        setServiceRecords([]);
      }

      // If we have a specific vehicle ID, also try to get vehicle-specific history
      if (vehicleId) {
        try {
          const historyUrl = `${apiBaseUrl}/vehicles/services/vehicles/${vehicleId}/history`;
          console.log('🔍 Service Management - History URL:', historyUrl);

          const historyResponse = await fetch(historyUrl, {
            headers: {
              'Content-Type': 'application/json',
              ...(authToken && {
                'Authorization': `Bearer ${authToken}`
              })
            }
          });

          console.log('🔍 Service Management - History Response Status:', historyResponse.status);

          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            console.log('🔍 Service Management - History Data:', historyData);
            if (historyData.success && historyData.data.serviceHistory) {
              setServiceRecords(historyData.data.serviceHistory);
            }
          }
        } catch (error) {
          console.warn('🔍 Service Management - Vehicle-specific service history endpoint error:', error);
        }
      }

      // Fetch service statistics via API Gateway
      const statsUrl = `${apiBaseUrl}/vehicles/services/statistics?vehicleId=${vehicleId || ''}`;
      console.log('🔍 Service Management - Stats URL:', statsUrl);

      const statsResponse = await fetch(statsUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && {
            'Authorization': `Bearer ${authToken}`
          })
        }
      });

      console.log('🔍 Service Management - Stats Response Status:', statsResponse.status);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('🔍 Service Management - Stats Data:', statsData);
        if (statsData.success) {
          setStatistics(statsData.data.summary || statsData.data || null);
        }
      } else {
        console.warn('🔍 Service Management - Service statistics API not available');
        setStatistics({
          totalServices: 0,
          totalCost: 0,
          averageCost: 0,
          averageQualityRating: 0,
          servicesByType: []
        });
      }
    } catch (error) {
      console.error('🔍 Service Management - Error fetching service data:', error);
      // Set default values instead of showing error to user
      setServiceRecords([]);
      setStatistics({
        totalServices: 0,
        totalCost: 0,
        averageCost: 0,
        averageQualityRating: 0,
        servicesByType: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleService = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const authToken = localStorage.getItem('authToken');

      console.log('🔍 Service Management - Schedule API Base URL:', apiBaseUrl);
      console.log('🔍 Service Management - Schedule Auth Token exists:', !!authToken);

      if (!authToken) {
        setSnackbar({
          open: true,
          message: 'Authentication required. Please login again.',
          severity: 'error'
        });
        return;
      }

      const scheduleUrl = `${apiBaseUrl}/vehicles/services/schedule`;
      console.log('🔍 Service Management - Schedule URL:', scheduleUrl);

      const scheduleData = {
        vehicleId: scheduleForm.vehicleId,
        serviceType: scheduleForm.serviceType,
        scheduledDate: scheduleForm.scheduledDate,
        description: scheduleForm.description,
        serviceCenterId: scheduleForm.serviceCenterId,
        mechanicId: scheduleForm.mechanicId,
        estimatedCost: parseFloat(scheduleForm.estimatedCost) || 0,
        priority: scheduleForm.priority,
        specialInstructions: scheduleForm.specialInstructions,
        reminderEnabled: scheduleForm.reminderEnabled
      };

      console.log('🔍 Service Management - Schedule Data:', scheduleData);

      const response = await fetch(scheduleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(scheduleData)
      });

      console.log('🔍 Service Management - Schedule Response Status:', response.status);

      const data = await response.json();
      console.log('🔍 Service Management - Schedule Response Data:', data);

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Service scheduled successfully',
          severity: 'success'
        });
        setScheduleDialogOpen(false);
        setScheduleForm({
          vehicleId: vehicleId || '',
          serviceType: '',
          scheduledDate: '',
          description: '',
          serviceCenter: '',
          serviceCenterId: '',
          mechanicId: '',
          estimatedCost: '',
          priority: 'medium',
          specialInstructions: '',
          reminderEnabled: true
        });
        fetchServiceData();
      } else {
        throw new Error(data.message || 'Failed to schedule service');
      }
    } catch (error) {
      console.error('🔍 Service Management - Schedule Error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to schedule service: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  const handleUpdateServiceStatus = async (serviceId: string, status: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const authToken = localStorage.getItem('authToken');

      console.log('🔍 Service Management - Update Status API Base URL:', apiBaseUrl);
      console.log('🔍 Service Management - Update Status Auth Token exists:', !!authToken);

      const updateUrl = `${apiBaseUrl}/vehicles/services/records/${serviceId}`;
      console.log('🔍 Service Management - Update Status URL:', updateUrl);

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && {
            'Authorization': `Bearer ${authToken}`
          })
        },
        body: JSON.stringify({ serviceStatus: status })
      });

      console.log('🔍 Service Management - Update Status Response Status:', response.status);

      const data = await response.json();
      console.log('🔍 Service Management - Update Status Response Data:', data);

      if (data.success) {
        setSnackbar({
          open: true,
          message: `Service ${status.toLowerCase()} successfully`,
          severity: 'success'
        });
        fetchServiceData();
      } else {
        throw new Error(data.message || 'Failed to update service status');
      }
    } catch (error) {
      console.error('🔍 Service Management - Update Status Error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update service status: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  const getNextServiceDate = () => {
    const completedServices = serviceRecords.filter(s => s.serviceStatus === 'Completed');
    if (completedServices.length === 0) return null;

    const lastService = completedServices.sort((a, b) =>
      new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
    )[0];

    return lastService.nextServiceDue;
  };

  const getDaysUntilNextService = () => {
    const nextDate = getNextServiceDate();
    if (!nextDate) return null;
    return differenceInDays(new Date(nextDate), new Date());
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Scheduled': return 'info';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderServiceOverview = () => {
    const daysUntilNext = getDaysUntilNextService();
    const upcomingServices = serviceRecords.filter(s => s.serviceStatus === 'Scheduled');
    const activeServices = serviceRecords.filter(s => s.serviceStatus === 'In Progress');

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Next Service</Typography>
              </Box>
              {daysUntilNext !== null ? (
                <>
                  <Typography variant="h4" color={daysUntilNext < 7 ? 'error.main' : 'text.primary'}>
                    {daysUntilNext > 0 ? `${daysUntilNext} days` : 'Overdue'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(getNextServiceDate()!), 'dd MMM yyyy')}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No upcoming service
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Scheduled</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {upcomingServices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ServiceIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">In Progress</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {activeServices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PaymentIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Cost</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatCurrency(statistics?.totalCost || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lifetime service cost
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderServiceHistory = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Service Center</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {serviceRecords.map((service) => (
            <TableRow key={service.id} hover>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {format(new Date(service.serviceDate), 'dd MMM yyyy')}
                  </Typography>
                  {service.nextServiceDue && (
                    <Typography variant="caption" color="text.secondary">
                      Next: {format(new Date(service.nextServiceDue), 'dd MMM yyyy')}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip label={service.serviceType} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{service.serviceCenter || 'N/A'}</TableCell>
              <TableCell>
                <Chip
                  label={service.serviceStatus}
                  color={getServiceStatusColor(service.serviceStatus)}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatCurrency(service.totalCost)}</TableCell>
              <TableCell>
                {service.qualityRating ? (
                  <Rating value={service.qualityRating} readOnly size="small" />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Not rated
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedService(service)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {service.serviceStatus === 'Scheduled' && (
                    <>
                      <Tooltip title="Start Service">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleUpdateServiceStatus(service.id, 'In Progress')}
                        >
                          <ServiceIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel Service">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUpdateServiceStatus(service.id, 'Cancelled')}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {service.serviceStatus === 'In Progress' && (
                    <Tooltip title="Complete Service">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleUpdateServiceStatus(service.id, 'Completed')}
                      >
                        <CompleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedService(service);
                        setEditServiceDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderScheduleDialog = () => (
    <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6">Schedule Service</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Vehicle Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CarIcon color="primary" />
              Vehicle Selection
            </Typography>
            <Autocomplete
              fullWidth
              options={availableVehicles}
              getOptionLabel={(option) => `${option.registrationNumber} - ${option.make} ${option.model}`}
              value={selectedVehicle}
              onChange={(event, newValue) => {
                setSelectedVehicle(newValue);
                setScheduleForm(prev => ({ ...prev, vehicleId: newValue?.id || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Vehicle"
                  placeholder="Search by registration number, make, or model"
                  variant="outlined"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {option.registrationNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.make} {option.model} • {option.mileage.toLocaleString()} km
                      </Typography>
                    </Box>
                    <Chip
                      label={option.status}
                      size="small"
                      color={option.status === 'Active' ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
              )}
            />
          </Grid>

          {/* Service Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServiceIcon color="primary" />
              Service Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={scheduleForm.serviceType}
                onChange={(e) => setScheduleForm({...scheduleForm, serviceType: e.target.value})}
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={scheduleForm.priority}
                onChange={(e) => setScheduleForm({...scheduleForm, priority: e.target.value})}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={option.label} color={option.color} size="small" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Scheduled Date & Time"
              value={scheduleForm.scheduledDate}
              onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
              helperText="Select preferred date and time for the service"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Estimated Cost"
              type="number"
              value={scheduleForm.estimatedCost}
              onChange={(e) => setScheduleForm({...scheduleForm, estimatedCost: e.target.value})}
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
              }}
              helperText="Enter estimated service cost in INR"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Description"
              multiline
              rows={3}
              value={scheduleForm.description}
              onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
              placeholder="Describe the service requirements, issues, or specific requests..."
            />
          </Grid>

          {/* Service Center Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServiceCenterIcon color="primary" />
              Service Center Selection
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Service Center</InputLabel>
              <Select
                value={scheduleForm.serviceCenterId}
                onChange={(e) => {
                  const centerId = e.target.value;
                  const center = serviceCenters.find(c => c.id === centerId);
                  setSelectedServiceCenter(center || null);
                  setScheduleForm({
                    ...scheduleForm,
                    serviceCenterId: centerId,
                    serviceCenter: center?.name || ''
                  });
                }}
              >
                {serviceCenters.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {center.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={center.rating} readOnly size="small" />
                          <Typography variant="caption">({center.rating})</Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {center.location} • Capacity: {center.capacity}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {center.specialties.slice(0, 3).map((specialty, index) => (
                          <Chip
                            key={index}
                            label={specialty}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Service Center Details */}
          {selectedServiceCenter && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedServiceCenter.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 {selectedServiceCenter.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📞 {selectedServiceCenter.contactNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating value={selectedServiceCenter.rating} readOnly size="small" />
                      <Typography variant="caption">({selectedServiceCenter.rating})</Typography>
                    </Box>
                    <Chip
                      label={`${selectedServiceCenter.capacity} Capacity`}
                      size="small"
                      color={selectedServiceCenter.capacity === 'High' ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Specialties:
                </Typography>
                <Box>
                  {selectedServiceCenter.specialties.map((specialty, index) => (
                    <Chip
                      key={index}
                      label={specialty}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Mechanic Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MechanicPersonIcon color="primary" />
              Preferred Mechanic (Optional)
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Mechanic</InputLabel>
              <Select
                value={scheduleForm.mechanicId}
                onChange={(e) => setScheduleForm({...scheduleForm, mechanicId: e.target.value})}
              >
                <MenuItem value="">
                  <em>Any Available Mechanic</em>
                </MenuItem>
                {availableMechanics.map((mechanic) => (
                  <MenuItem key={mechanic.id} value={mechanic.id}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {mechanic.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={mechanic.rating} readOnly size="small" />
                          <Typography variant="caption">({mechanic.rating})</Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {mechanic.experience} years exp. • {mechanic.specialties.join(', ')}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Additional Options */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Additional Options
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={scheduleForm.reminderEnabled}
                  onChange={(e) => setScheduleForm({...scheduleForm, reminderEnabled: e.target.checked})}
                />
              }
              label="Send reminder notifications"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              multiline
              rows={2}
              value={scheduleForm.specialInstructions}
              onChange={(e) => setScheduleForm({...scheduleForm, specialInstructions: e.target.value})}
              placeholder="Any special instructions for the mechanic or service center..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => setScheduleDialogOpen(false)} size="large">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleScheduleService}
          size="large"
          disabled={!scheduleForm.vehicleId || !scheduleForm.serviceType || !scheduleForm.scheduledDate}
        >
          Schedule Service
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Service Overview Cards */}
      {renderServiceOverview()}

      {/* Service Management Tabs */}
      <Card variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Service History" icon={<TimelineIcon />} />
            <Tab label="Analytics" icon={<ReportIcon />} />
            <Tab label="Maintenance Schedule" icon={<CalendarIcon />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {tabValue === 0 && 'Service History'}
              {tabValue === 1 && 'Service Analytics'}
              {tabValue === 2 && 'Maintenance Schedule'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule Service
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReportIcon />}
                onClick={() => {/* Generate Report */}}
              >
                Generate Report
              </Button>
            </Box>
          </Box>

          {/* Tab Content */}
          {tabValue === 0 && (
            <Box>
              {serviceRecords.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No service records found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Schedule your first service to start tracking maintenance history
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    Schedule First Service
                  </Button>
                </Box>
              ) : (
                renderServiceHistory()
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Service Statistics</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total Services</Typography>
                        <Typography variant="h4">{statistics?.totalServices || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Average Cost</Typography>
                        <Typography variant="h4">{formatCurrency(statistics?.averageCost || 0)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={statistics?.averageQualityRating || 0} readOnly />
                          <Typography variant="body2">
                            ({(statistics?.averageQualityRating || 0).toFixed(1)})
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Service Types Breakdown</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                      {statistics?.servicesByType.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={item.serviceType}
                            secondary={`${item.count} services • ${formatCurrency(item.totalCost)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Upcoming maintenance schedule based on service intervals and vehicle usage
              </Typography>
              {/* Maintenance schedule content would go here */}
              <Alert severity="info">
                Maintenance scheduling feature coming soon
              </Alert>
            </Box>
          )}
        </Box>
      </Card>

      {/* Schedule Service Dialog */}
      {renderScheduleDialog()}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleServiceManager;
