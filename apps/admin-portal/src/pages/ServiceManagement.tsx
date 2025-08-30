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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Build as ServiceIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Assessment as ReportIcon,
  DirectionsBike as VehicleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isBefore } from 'date-fns';

interface ServiceRecord {
  id: string;
  vehicleId: string;
  vehicle: {
    registrationNumber: string;
    model: { name: string; oem: { name: string } };
  };
  serviceType: string;
  serviceDate: string;
  description: string;
  serviceStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  totalCost: number;
  mechanicName?: string;
  serviceCenter?: string;
  nextServiceDue?: string;
  qualityRating?: number;
}

interface ServiceStats {
  totalServices: number;
  scheduledServices: number;
  inProgressServices: number;
  completedServices: number;
  totalCost: number;
  averageCost: number;
  overdueServices: number;
}

const ServiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ServiceRecord[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

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

  useEffect(() => {
    fetchServiceData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [serviceRecords, searchTerm, statusFilter, typeFilter, activeTab]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const authToken = localStorage.getItem('authToken');

      console.log('🔍 Service Management Page - API Base URL:', apiBaseUrl);
      console.log('🔍 Service Management Page - Auth Token exists:', !!authToken);

      const serviceUrl = `${apiBaseUrl}/vehicles/services/records`;
      console.log('🔍 Service Management Page - Service URL:', serviceUrl);

      const response = await fetch(serviceUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && {
            'Authorization': `Bearer ${authToken}`
          })
        }
      });

      console.log('🔍 Service Management Page - Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Service Management Page - Response Data:', data);
        if (data.success) {
          setServiceRecords(data.data.serviceRecords || []);
          calculateStats(data.data.serviceRecords || []);
        }
      } else {
        const errorData = await response.text();
        console.error('🔍 Service Management Page - API Error:', response.status, errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 Service Management Page - Error fetching service data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load service data: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: ServiceRecord[]) => {
    const now = new Date();
    const scheduled = records.filter(r => r.serviceStatus === 'Scheduled');
    const inProgress = records.filter(r => r.serviceStatus === 'In Progress');
    const completed = records.filter(r => r.serviceStatus === 'Completed');
    const overdue = scheduled.filter(r =>
      r.nextServiceDue && isBefore(new Date(r.nextServiceDue), now)
    );

    const totalCost = completed.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCost = completed.length > 0 ? totalCost / completed.length : 0;

    setStats({
      totalServices: records.length,
      scheduledServices: scheduled.length,
      inProgressServices: inProgress.length,
      completedServices: completed.length,
      totalCost,
      averageCost: avgCost,
      overdueServices: overdue.length
    });
  };

  const filterRecords = () => {
    let filtered = [...serviceRecords];

    // Filter by tab (status-based filtering)
    switch (activeTab) {
      case 1: // Scheduled
        filtered = filtered.filter(r => r.serviceStatus === 'Scheduled');
        break;
      case 2: // In Progress
        filtered = filtered.filter(r => r.serviceStatus === 'In Progress');
        break;
      case 3: // Completed
        filtered = filtered.filter(r => r.serviceStatus === 'Completed');
        break;
      case 4: // Overdue
        const now = new Date();
        filtered = filtered.filter(r =>
          r.nextServiceDue && isBefore(new Date(r.nextServiceDue), now)
        );
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicle.model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.serviceStatus === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.serviceType === typeFilter);
    }

    setFilteredRecords(filtered);
  };

  const getStatusColor = (status: string) => {
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

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="primary.main">
                  {stats?.totalServices || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Services
                </Typography>
              </Box>
              <ServiceIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="warning.main">
                  {stats?.scheduledServices || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scheduled
                </Typography>
              </Box>
              <Badge badgeContent={stats?.overdueServices || 0} color="error">
                <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
              </Badge>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="info.main">
                  {stats?.inProgressServices || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
              <TrendingIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(stats?.totalCost || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Cost
                </Typography>
              </Box>
              <ReportIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search vehicles, service types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Service Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {serviceTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchServiceData}
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderServiceTable = () => (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>Service Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Service Center</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Next Due</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                        <VehicleIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {service.vehicle?.registrationNumber || 'Unknown Vehicle'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {service.vehicle?.model?.oem?.name || 'Unknown'} {service.vehicle?.model?.name || 'Model'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={service.serviceType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {format(new Date(service.serviceDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={service.serviceStatus}
                      color={getStatusColor(service.serviceStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{service.serviceCenter || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(service.totalCost)}</TableCell>
                  <TableCell>
                    {service.nextServiceDue ? (
                      <Typography variant="body2" color={
                        isBefore(new Date(service.nextServiceDue), new Date()) ? 'error.main' : 'text.primary'
                      }>
                        {format(new Date(service.nextServiceDue), 'dd MMM yyyy')}
                      </Typography>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Vehicle">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/vehicles/${service.vehicleId}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Service">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/services/edit/${service.id}`)}
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
      <TablePagination
        component="div"
        count={filteredRecords.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Service Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage vehicle services, maintenance, and scheduling
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/services/schedule')}
          >
            Schedule Service
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => navigate('/services/reports')}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Service Status Tabs */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Services" />
          <Tab
            label={
              <Badge badgeContent={stats?.scheduledServices || 0} color="warning">
                Scheduled
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats?.inProgressServices || 0} color="info">
                In Progress
              </Badge>
            }
          />
          <Tab label="Completed" />
          <Tab
            label={
              <Badge badgeContent={stats?.overdueServices || 0} color="error">
                Overdue
              </Badge>
            }
          />
        </Tabs>
      </Card>

      {/* Filters */}
      {renderFilters()}

      {/* Service Records Table */}
      {renderServiceTable()}

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

export default ServiceManagement;
